<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { NButton, NDatePicker, useThemeVars } from "naive-ui";
  import { Solar } from "lunar-typescript";
  import type { DayMark } from "../types";
  import { toKey } from "../services/holidayService";

  const props = defineProps<{
    selectedDate: Date;
    marks: Map<string, DayMark>;
  }>();

  const emit = defineEmits<{
    "update:selectedDate": [Date];
  }>();

  const themeVars = useThemeVars();

  const WEEK_HEADERS = ["一", "二", "三", "四", "五", "六", "日"];

  const displayYear = ref(props.selectedDate.getFullYear());
  const displayMonth = ref(props.selectedDate.getMonth());

  watch(
    () => props.selectedDate,
    (d) => {
      displayYear.value = d.getFullYear();
      displayMonth.value = d.getMonth();
    },
  );

  const selectedTs = computed(() => props.selectedDate.getTime());
  const now = new Date();
  const todayKey = toKey(now);

  const marksMap = computed(() => {
    const m = new Map<string, DayMark>();
    props.marks.forEach((v, k) => m.set(k, v));
    return m;
  });

  interface Cell {
    key: string;
    date: Date;
    day: number;
    inMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isWeekend: boolean;
    lunarText: string;
    festival: string;
    mark?: DayMark;
  }

  const cells = computed<Cell[]>(() => {
    const first = new Date(displayYear.value, displayMonth.value, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(displayYear.value, displayMonth.value, 1 - offset);
    const list: Cell[] = [];
    const totalCells = offset + new Date(displayYear.value, displayMonth.value + 1, 0).getDate() <= 35 ? 35 : 42;
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = toKey(d);
      const lunar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).getLunar();
      const festivals = [...lunar.getFestivals(), ...lunar.getOtherFestivals()];
      const jieqi = lunar.getJieQi();
      const lunarDay = lunar.getDayInChinese();
      let lunarText = lunarDay;
      if (jieqi) lunarText = jieqi;
      else if (lunarDay === "初一") lunarText = `${lunar.getMonthInChinese()}月`;
      list.push({
        key,
        date: d,
        day: d.getDate(),
        inMonth: d.getMonth() === displayMonth.value,
        isToday: key === todayKey,
        isSelected: key === toKey(props.selectedDate),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        lunarText,
        festival: festivals[0] ?? "",
        mark: marksMap.value.get(key),
      });
    }
    return list;
  });

  const title = computed(() => `${displayYear.value}年 ${displayMonth.value + 1}月`);

  function shiftMonth(delta: number) {
    const d = new Date(displayYear.value, displayMonth.value + delta, 1);
    displayYear.value = d.getFullYear();
    displayMonth.value = d.getMonth();
  }

  function goToday() {
    const t = new Date();
    displayYear.value = t.getFullYear();
    displayMonth.value = t.getMonth();
    emit("update:selectedDate", t);
  }

  function jumpTo(ts: number | null) {
    if (ts == null) return;
    emit("update:selectedDate", new Date(ts));
  }

  function pickCell(c: Cell) {
    emit("update:selectedDate", new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate()));
  }

  const colors = computed(() => ({
    holidayBg: themeVars.value.successColor + "22",
    workBg: themeVars.value.errorColor + "22",
    todayBg: themeVars.value.primaryColor + "22",
    todayBorder: themeVars.value.primaryColor,
    selectedBorder: themeVars.value.primaryColor,
    weekend: themeVars.value.errorColor,
    monthOff: themeVars.value.textColor3,
    border: themeVars.value.borderColor,
    card: themeVars.value.cardColor,
  }));
</script>

<template>
  <div class="calendar-panel">
    <div class="panel-header">
      <span class="panel-title">日历</span>
      <span class="legend">
        <span class="legend-item"><em class="dot rest" /> 休</span>
        <span class="legend-item"><em class="dot work" /> 班</span>
      </span>
    </div>

    <div class="toolbar">
      <NButton size="small" quaternary @click="shiftMonth(-1)">◀</NButton>
      <div class="title-wrapper">
        <span class="month-title">{{ title }}</span>
        <NDatePicker
          :value="selectedTs"
          type="date"
          size="small"
          class="jump-picker"
          @update:value="jumpTo"
          fast-year-select
          fast-month-select
        />
      </div>
      <NButton size="small" quaternary @click="shiftMonth(1)">▶</NButton>
      <NButton size="small" secondary @click="goToday">今天</NButton>
    </div>

    <div class="grid-header">
      <div v-for="w in WEEK_HEADERS" :key="w" class="week-name" :class="{ 'weekend-name': w === '六' || w === '日' }">
        {{ w }}
      </div>
    </div>

    <div class="grid">
      <div
        v-for="c in cells"
        :key="c.key"
        class="cell"
        :class="{
          'month-off': !c.inMonth,
          'weekend': c.isWeekend,
          'holiday-cell': c.mark?.kind === 'rest',
          'work-cell': c.mark?.kind === 'work',
          'today-cell': c.isToday,
          'selected-cell': c.isSelected,
        }"
        @click="pickCell(c)"
      >
        <span v-if="c.mark" class="badge" :class="c.mark.kind">
          {{ c.mark.kind === "rest" ? "休" : "班" }}
        </span>
        <span class="cell-day">{{ c.day }}</span>
        <span class="cell-lunar">{{ c.festival || c.lunarText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .calendar-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: v-bind("colors.card");
  }

  .legend {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: v-bind("themeVars.textColor3");
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
  }

  .dot.rest {
    background: v-bind("themeVars.successColor");
  }

  .dot.work {
    background: v-bind("themeVars.errorColor");
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 0;
  }

  .month-title {
    font-size: 15px;
    font-weight: 600;
    color: v-bind("themeVars.textColor1");
    white-space: nowrap;
  }

  .jump-picker {
    width: 120px;
  }

  .grid-header,
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .week-name {
    text-align: center;
    font-size: 12px;
    color: v-bind("themeVars.textColor3");
    padding: 4px 0;
  }

  .weekend-name {
    color: v-bind("themeVars.errorColor");
  }

  .cell {
    position: relative;
    border: 1px solid v-bind("colors.border");
    padding-top: 100%;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
    background: v-bind("colors.card");
    transition: border-color 0.15s, box-shadow 0.15s;
    user-select: none;
  }

  .cell > * {
    position: absolute;
  }

  .cell:hover {
    border-color: v-bind("themeVars.primaryColor");
  }

  .holiday-cell {
    background: v-bind("colors.holidayBg") !important;
  }

  .work-cell {
    background: v-bind("colors.workBg") !important;
  }

  .today-cell {
    border-color: v-bind("colors.todayBorder") !important;
  }

  .selected-cell {
    border-color: v-bind("colors.selectedBorder") !important;
    box-shadow: inset 0 0 0 1px v-bind("colors.selectedBorder");
  }

  .cell-day {
    top: 10%;
    left: 14%;
    font-size: 15px;
    font-weight: 600;
    color: v-bind("themeVars.textColor1");
  }

  .month-off .cell-day {
    color: v-bind("themeVars.textColor3");
  }

  .weekend .cell-day {
    color: v-bind("themeVars.errorColor");
  }

  .cell-lunar {
    bottom: 8px;
    left: 10%;
    right: 10%;
    font-size: 11px;
    text-align: center;
    color: v-bind("themeVars.textColor3");
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    top: 4px;
    right: 4px;
    font-size: 10px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 600;
  }

  .badge.rest {
    background: v-bind("themeVars.successColor");
    color: #fff;
  }

  .badge.work {
    background: v-bind("themeVars.errorColor");
    color: #fff;
  }
</style>