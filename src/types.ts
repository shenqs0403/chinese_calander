export interface HolidayItem {
  Name: string;
  StartDate: string;
  EndDate: string;
  CompDays: string[];
}

export interface HolidayYearMap {
  [year: string]: HolidayItem[];
}

export interface HolidayData {
  Version: string;
  Generated: string;
  Region: string;
  Years: HolidayYearMap;
}

export type DayMarkKind = "rest" | "work";

export interface DayMark {
  kind: DayMarkKind;
  name: string;
}