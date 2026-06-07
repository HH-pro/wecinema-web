export interface ScriptDetail {
  _id: string;
  title: string;
  genre?: string | string[];
  script?: string;
  createdAt?: string;
  author?: { _id: string; username?: string; avatar?: string } | string;
}
