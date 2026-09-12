<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import {
    NButton,
    NDatePicker,
    NDrawer,
    NDrawerContent,
    NEmpty,
    NList,
    NListItem,
    NSelect,
    useMessage,
    useThemeVars,
  } from "naive-ui";
  import { Solar } from "lunar-typescript";
  import { toKey } from "../services/holidayService";

  const props = defineProps<{
    show: boolean;
    defaultDate: Date;
  }>();

  const emit = defineEmits<{
    "update:show": [boolean];
  }>();

  const themeVars = useThemeVars();
  const message = useMessage();

  const PURPOSES = [
    { label: "嫁娶（结婚）", value: "嫁娶" },
    { label: "订婚", value: "订婚" },
    { label: "入宅", value: "入宅" },
    { label: "移徙（搬家）", value: "移徙" },
    { label: "开市（开业）", value: "开市" },
    { label: "动土", value: "动土" },
    { label: "破土", value: "破土" },
    { label: "安床", value: "安床" },
    { label: "出行", value: "出行" },
    { label: "祭祀", value: "祭祀" },
    { label: "祈福", value: "祈福" },
    { label: "纳财", value: "纳财" },
    { label: "交易", value: "交易" },
    { label: "修造", value: "修造" },
    { label: "拆卸", value: "拆卸" },
    { label: "作灶", value: "作灶" },
    { label: "求嗣", value: "求嗣" },
    { label: "会友", value: "会友" },
  ];

  interface LuckyDay {
    key: string;
    ymd: string;
    lunar: string;
    ganzhi: string;
    chong: string;
  }

  const purpose = ref<string | null>(null);
  const range = ref<[number, number]>([
    new Date(props.defaultDate).setHours(0, 0, 0, 0),
    new Date(props.defaultDate.getTime() + 90 * 24 * 3600 * 1000).setHours(0, 0, 0, 0),
  ]);
  const results = ref<LuckyDay[]>([]);
  const searched = ref(false);

  watch(
    () => props.defaultDate,
    (d) => {
      range.value = [
        new Date(d).setHours(0, 0, 0, 0),
        new Date(d.getTime() + 90 * 24 * 3600 * 1000).setHours(0, 0, 0, 0),
      ];
    },
  );

  const resultCount = computed(() => results.value.length);

  async function search() {
    if (!purpose.value) return;
    results.value = [];
    searched.value = false;
    const [start, end] = range.value;
    if (!start || !end || end < start) {
      message.warning("请选择有效的日期范围");
      return;
    }

    const begin = new Date(start);
    const finish = new Date(end);
    const total = Math.round((finish.getTime() - begin.getTime()) / 86400000);
    if (total > 365) {
      message.warning("日期范围请控制在一年以内，避免计算耗时");
      return;
    }

    const found: LuckyDay[] = [];
    for (let d = new Date(begin.getTime()); d <= finish; d.setDate(d.getDate() + 1)) {
      const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const lunar = solar.getLunar();
      if (lunar.getDayYi().includes(purpose.value)) {
        found.push({
          key: toKey(d),
          ymd: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
          lunar: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
          ganzhi: `${lunar.getDayInGanZhi()}日`,
          chong: `冲${lunar.getDayChongDesc()}`,
        });
      }
    }
    results.value = found;
    searched.value = true;
  }

  function reset() {
    purpose.value = null;
    results.value = [];
    searched.value = false;
  }

  function weekdayOf(key: string): string {
    const [y, m, d] = key.split("-").map(Number);
    return ["日", "一", "二", "三", "四", "五", "六"][new Date(y, m - 1, d).getDay()];
  }
</script>

<template>
  <NDrawer
    :show="show"
    :width="420"
    placement="right"
    @update:show="(v) => emit('update:show', v)"
  >
    <NDrawerContent title="吉日查询" closable>
      <div class="lucky-body">
        <div class="form-row">
          <span class="form-label">事项</span>
          <NSelect
            v-model:value="purpose"
            :options="PURPOSES"
            filterable
            tag
            placeholder="选择或输入吉事 (如 嫁娶)"
          />
        </div>
        <div class="form-row">
          <span class="form-label">日期范围</span>
          <NDatePicker
            v-model:value="range"
            type="daterange"
            size="medium"
            style="width: 100%"
          />
        </div>
        <div class="form-row actions">
          <NButton type="primary" :disabled="!purpose" @click="search">查询吉日</NButton>
          <NButton secondary @click="reset">重置</NButton>
        </div>

        <div v-if="searched" class="result-header">
          共找到 <b class="count">{{ resultCount }}</b> 个宜「{{ purpose }}」的吉日
        </div>

        <NEmpty v-if="searched && !resultCount" description="该范围内没有合适的吉日" />
        <NList v-else v-show="resultCount" class="result-list" hoverable clickable>
          <NListItem v-for="r in results" :key="r.key">
            <div class="result-row">
              <div class="result-main">
                <span class="result-date">{{ r.ymd }}</span>
                <span class="result-week">{{ weekdayOf(r.key) }}曜</span>
              </div>
              <div class="result-sub">
                <span>{{ r.lunar }}</span>
                <span>{{ r.ganzhi }}</span>
                <span class="chong">{{ r.chong }}</span>
              </div>
            </div>
          </NListItem>
        </NList>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
  .lucky-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: v-bind("themeVars.textColor1");
  }

  .actions {
    flex-direction: row;
    gap: 8px;
    margin-top: 4px;
  }

  .result-header {
    font-size: 13px;
    color: v-bind("themeVars.textColor3");
  }

  .count {
    color: v-bind("themeVars.successColor");
    font-size: 16px;
    margin: 0 2px;
  }

  .result-list {
    flex: 1;
    overflow-y: auto;
  }

  .result-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .result-main {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .result-date {
    font-size: 14px;
    font-weight: 600;
    color: v-bind("themeVars.textColor1");
  }

  .result-week {
    font-size: 12px;
    color: v-bind("themeVars.errorColor");
  }

  .result-sub {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: v-bind("themeVars.textColor3");
  }

  .chong {
    color: v-bind("themeVars.warningColor");
  }
</style>