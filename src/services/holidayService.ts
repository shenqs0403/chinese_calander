import type { DayMark, HolidayData } from "../types";

const STORAGE_KEY = "cn_holiday_cache_v1";
const HOLIDAY_URL =
  "https://tigertall.github.io/chinese-calendar/data/holidays_cn.json";

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

interface CachedPayload {
  fetchedAt: string;
  data: HolidayData;
}

function shouldRefresh(cached: HolidayData | null): boolean {
  if (!cached || !cached.Years) return true;
  const now = new Date();
  if (now.getMonth() === 11 && now.getDate() === 25) return true;
  if (!cached.Years[String(now.getFullYear())]) return true;
  return false;
}

export async function fetchHolidayData(): Promise<HolidayData> {
  const res = await fetch(HOLIDAY_URL);
  if (!res.ok) {
    throw new Error(`获取节假日数据失败: HTTP ${res.status}`);
  }
  return (await res.json()) as HolidayData;
}

function saveCache(data: HolidayData): void {
  try {
    const payload: CachedPayload = { fetchedAt: new Date().toISOString(), data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    //
  }
}

/**
 * 首次运行或每年的 12 月 25 日重新拉取节假日数据，
 * 其余时间使用本地缓存。
 */
export async function ensureHolidayData(): Promise<HolidayData> {
  let cached: HolidayData | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedPayload;
      cached = parsed?.data ?? null;
    }
  } catch {
    cached = null;
  }

  if (!shouldRefresh(cached)) {
    return cached as HolidayData;
  }

  const data = await fetchHolidayData();
  saveCache(data);
  return data;
}

function markRange(
  map: Map<string, DayMark>,
  start: string,
  end: string,
  name: string,
): void {
  const s = parseDate(start);
  const e = parseDate(end);
  for (let d = new Date(s.getTime()); d <= e; d.setDate(d.getDate() + 1)) {
    map.set(toKey(d), { kind: "rest", name });
  }
}

/**
 * 生成日期 -> { kind: 'rest' | 'work' } 的映射表。
 * 假期（起止含当天）为休，调休上班日为班。
 */
export function buildMarks(data: HolidayData): Map<string, DayMark> {
  const map = new Map<string, DayMark>();
  for (const items of Object.values(data.Years ?? {})) {
    for (const item of items) {
      markRange(map, item.StartDate, item.EndDate, item.Name);
      for (const c of item.CompDays ?? []) {
        map.set(c, { kind: "work", name: item.Name });
      }
    }
  }
  return map;
}