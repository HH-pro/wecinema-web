// Utility helpers for marketplace components

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getOrderProgress(status: string): number {
  const progressMap: Record<string, number> = {
    pending_payment: 10,
    paid: 20,
    processing: 35,
    in_progress: 50,
    delivered: 75,
    in_revision: 60,
    completed: 100,
    completed_payment_pending: 90,
    released: 100,
    cancelled: 0,
    refunded: 0,
    disputed: 0,
  };
  return progressMap[status] ?? 0;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
