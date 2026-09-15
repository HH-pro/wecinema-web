/**
 * IndexedDB persistence for uploads, so a reload or a closed browser doesn't
 * lose work.
 *
 *  - jobs:  one row per unfinished upload, holding the picked File itself so the
 *           upload resumes without asking for it again. If the browser refuses
 *           to store the file (quota, private mode) the row is kept without it
 *           and the creator is asked to re-select the same file.
 *  - forms: the draft editor's latest values, written on every change, so edits
 *           made offline or in the last seconds before a close survive.
 *
 * Every call degrades to a no-op when IndexedDB is unavailable.
 */

const DB_NAME = "wecinema-uploads";
const DB_VERSION = 1;
const JOBS = "jobs";
const FORMS = "forms";

export interface StoredUploadJob {
  draftId: string;
  userId: string;
  fileName: string;
  size: number;
  lastModified: number;
  type: string;
  file: File | null;
  createdAt: number;
}

export interface StoredDraftForm {
  draftId: string;
  values: Record<string, unknown>;
  /** Values not yet confirmed by the server. */
  unsynced: boolean;
  savedAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(JOBS)) db.createObjectStore(JOBS, { keyPath: "draftId" });
      if (!db.objectStoreNames.contains(FORMS)) db.createObjectStore(FORMS, { keyPath: "draftId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/** Run one request in its own transaction; resolves when the transaction commits. */
async function run<T>(
  store: string,
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  if (!db) throw new Error("IndexedDB unavailable");
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = op(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onabort = () => reject(tx.error ?? req.error ?? new Error("Transaction aborted"));
    tx.onerror = () => reject(tx.error ?? req.error ?? new Error("Transaction failed"));
  });
}

export const uploadStore = {
  /** Save a job. Returns whether the file itself could be stored. */
  async putJob(job: StoredUploadJob): Promise<boolean> {
    try {
      await run(JOBS, "readwrite", (s) => s.put(job));
      return job.file != null;
    } catch {
      try {
        await run(JOBS, "readwrite", (s) => s.put({ ...job, file: null }));
      } catch {
        /* IndexedDB unavailable — the upload still runs for this page view */
      }
      return false;
    }
  },

  async listJobs(userId: string): Promise<StoredUploadJob[]> {
    try {
      const all = await run<StoredUploadJob[]>(JOBS, "readonly", (s) => s.getAll());
      return (all ?? []).filter((j) => j.userId === userId);
    } catch {
      return [];
    }
  },

  async deleteJob(draftId: string): Promise<void> {
    try {
      await run(JOBS, "readwrite", (s) => s.delete(draftId));
    } catch {
      /* nothing stored */
    }
  },

  async putForm(form: StoredDraftForm): Promise<void> {
    try {
      await run(FORMS, "readwrite", (s) => s.put(form));
    } catch {
      /* the server auto-save still runs */
    }
  },

  async getForm(draftId: string): Promise<StoredDraftForm | null> {
    try {
      return (await run<StoredDraftForm | undefined>(FORMS, "readonly", (s) => s.get(draftId))) ?? null;
    } catch {
      return null;
    }
  },

  async deleteForm(draftId: string): Promise<void> {
    try {
      await run(FORMS, "readwrite", (s) => s.delete(draftId));
    } catch {
      /* nothing stored */
    }
  },
};
