export const IST_TZ = "Asia/Kolkata";

export function formatIST(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: IST_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatISTTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: IST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function countdown(target: string | Date): string {
  const t = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const diff = t - Date.now();
  if (diff <= 0) return "00:00:00";
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0
    ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}