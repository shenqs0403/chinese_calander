<script setup lang="ts">
  import { computed } from "vue";
  import { NDescriptions, NDescriptionsItem, NEmpty, NTag, useThemeVars } from "naive-ui";
  import { Solar } from "lunar-typescript";
  import type { DayMark } from "../types";
  import { toKey } from "../services/holidayService";

  const props = defineProps<{
    date: Date;
    marks: Map<string, DayMark>;
  }>();

  const themeVars = useThemeVars();

  interface DayInfo {
    ymd: string;
    week: string;
    lunarTitle: string;
    ganzhi: { year: string; month: string; day: string };
    yearNaYin: string;
    shengxiao: string;
    activities: string[];
    restName?: string;
    workName?: string;
    yi: string[];
    ji: string[];
    chong: string;
    sha: string;
    zhiXing: string;
  }

  const WEEK_CN = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  const info = computed<DayInfo>(() => {
    const d = props.date;
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const lunar = solar.getLunar();
    const ec = lunar.getEightChar();

    const activities: string[] = [];
    for (const f of lunar.getFestivals()) activities.push(`农历${f}`);
    for (const f of lunar.getOtherFestivals()) activities.push(`公历${f}`);
    const jq = lunar.getJieQi();
    if (jq) activities.push(`节气·${jq}`);

    const mark = props.marks.get(toKey(d)) as DayMark | undefined;

    return {
      ymd: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
      week: WEEK_CN[d.getDay()],
      lunarTitle: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      ganzhi: {
        year: ec.getYear(),
        month: ec.getMonth(),
        day: ec.getDay(),
      },
      yearNaYin: ec.getYearNaYin(),
      shengxiao: lunar.getYearShengXiaoExact(),
      activities,
      restName: mark?.kind === "rest" ? mark.name : undefined,
      workName: mark?.kind === "work" ? mark.name : undefined,
      yi: lunar.getDayYi(),
      ji: lunar.getDayJi(),
      chong: lunar.getDayChongDesc(),
      sha: lunar.getDaySha(),
      zhiXing: lunar.getZhiXing(),
    };
  });

  const colors = computed(() => ({
    text1: themeVars.value.textColor1,
    text3: themeVars.value.textColor3,
  }));
</script>

<template>
  <div class="detail-panel">
    <div class="detail-header">
      <div>
        <div class="big-date">{{ info.ymd }}</div>
        <div class="sub-date">
          {{ info.week }} · {{ info.lunarTitle }}
          <NTag v-if="info.restName" size="small" type="success" round>休</NTag>
          <NTag v-if="info.workName" size="small" type="error" round>班</NTag>
          <span v-if="info.restName" class="mark-name">· {{ info.restName }}</span>
          <span v-else-if="info.workName" class="mark-name">· {{ info.workName }}</span>
        </div>
      </div>
    </div>

    <section class="section">
      <h3 class="section-title">今日活动</h3>
      <div v-if="info.activities.length" class="activity-tags">
        <NTag v-for="a in info.activities" :key="a" type="info" size="small">{{ a }}</NTag>
      </div>
      <NEmpty v-else description="当日暂无节日活动" :show-icon="false" class="empty" />
    </section>

    <section class="section">
      <h3 class="section-title">天干地支</h3>
      <NDescriptions :column="3" label-placement="top" size="small" bordered>
        <NDescriptionsItem label="年柱">{{ info.ganzhi.year }}</NDescriptionsItem>
        <NDescriptionsItem label="月柱">{{ info.ganzhi.month }}</NDescriptionsItem>
        <NDescriptionsItem label="日柱">{{ info.ganzhi.day }}</NDescriptionsItem>
      </NDescriptions>
      <div class="ganzhi-extra">
        <span>岁次：{{ info.ganzhi.year }}年</span>
        <span>生肖：{{ info.shengxiao }}</span>
        <span>纳音：{{ info.yearNaYin }}</span>
      </div>
    </section>

    <section class="section">
      <h3 class="section-title">黄历</h3>
      <div class="almanac-block">
        <div class="almanac-row">
          <span class="almanac-label">宜</span>
          <div class="almanac-values">
            <NTag v-for="y in info.yi" :key="y" size="small" type="success" :bordered="false" round>
              {{ y }}
            </NTag>
          </div>
        </div>
        <div class="almanac-row">
          <span class="almanac-label">忌</span>
          <div class="almanac-values">
            <NTag v-for="j in info.ji" :key="j" size="small" type="error" :bordered="false" round>
              {{ j }}
            </NTag>
          </div>
        </div>
        <div class="almanac-row slim">
          <span class="almanac-label">冲煞</span>
          <span class="almanac-value-text">
            冲{{ info.chong }} 煞{{ info.sha }} · 值神：{{ info.zhiXing }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
  .detail-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .detail-header {
    padding: 4px 0 12px;
  }

  .big-date {
    font-size: 22px;
    font-weight: 700;
    color: v-bind("colors.text1");
  }

  .sub-date {
    margin-top: 6px;
    font-size: 13px;
    color: v-bind("colors.text3");
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .mark-name {
    color: v-bind("colors.text3");
  }

  .section {
    padding: 4px 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 10px 0 10px;
    color: v-bind("colors.text1");
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title::before {
    content: "";
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: v-bind("themeVars.primaryColor");
  }

  .activity-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .empty {
    padding: 8px 0;
  }

  .ganzhi-extra {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 10px;
    font-size: 13px;
    color: v-bind("colors.text3");
  }

  .almanac-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .almanac-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .almanac-row.slim {
    align-items: center;
  }

  .almanac-label {
    min-width: 36px;
    font-size: 13px;
    font-weight: 600;
    color: v-bind("colors.text3");
    line-height: 22px;
  }

  .almanac-values {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  .almanac-value-text {
    font-size: 13px;
    color: v-bind("colors.text1");
  }
</style>