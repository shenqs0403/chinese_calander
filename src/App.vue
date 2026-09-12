<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
import {
  NButton,
  NConfigProvider,
  NMessageProvider,
  NSwitch,
  dateZhCN,
  darkTheme,
  lightTheme,
  zhCN,
} from "naive-ui";
  import CalendarPanel from "./components/CalendarPanel.vue";
  import DetailPanel from "./components/DetailPanel.vue";
  import LuckyDayQuery from "./components/LuckyDayQuery.vue";
  import { buildMarks, ensureHolidayData } from "./services/holidayService";
  import type { DayMark } from "./types";

  const STORAGE_THEME_KEY = "app_theme";

  const isDark = ref(
    localStorage.getItem(STORAGE_THEME_KEY) === "dark" ||
      (localStorage.getItem(STORAGE_THEME_KEY) === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
  );

  const theme = computed(() => (isDark.value ? darkTheme : lightTheme));

  function toggleDark(v: boolean) {
    isDark.value = v;
    localStorage.setItem(STORAGE_THEME_KEY, v ? "dark" : "light");
  }

  const selectedDate = ref(new Date());
  const marks = ref<Map<string, DayMark>>(new Map());
  const luckyVisible = ref(false);

  const palette = computed(() =>
    isDark.value
      ? { bg: "#0f0f12", card: "#18181c", border: "#2c2c33", text: "#d7d7db" }
      : { bg: "#f5f5f7", card: "#ffffff", border: "#ececef", text: "#18181c" },
  );

  onMounted(async () => {
    try {
      const data = await ensureHolidayData();
      marks.value = buildMarks(data);
    } catch (e) {
      console.error("节假日数据加载失败", e);
    }
  });
</script>

<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-global-style />
    <n-message-provider>
      <div class="app" :class="{ dark: isDark }">
        <header class="app-header">
          <span class="brand">中国历</span>
          <span class="header-right">
            <NButton type="primary" size="small" @click="luckyVisible = true">
              吉日查询
            </NButton>
            <NSwitch
              :value="isDark"
              size="small"
              @update:value="toggleDark"
            >
              <template #checked-icon>☾</template>
              <template #unchecked-icon>☀</template>
            </NSwitch>
          </span>
        </header>
        <main class="app-main">
          <div class="left">
            <CalendarPanel v-model:selectedDate="selectedDate" :marks="marks" />
          </div>
          <div class="right">
            <DetailPanel :date="selectedDate" :marks="marks" />
          </div>
        </main>
        <LuckyDayQuery
          v-model:show="luckyVisible"
          :default-date="selectedDate"
        />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #app {
    margin: 0;
    padding: 0;
    height: 100%;
  }
</style>

<style scoped>
  .app {
    height: 99%;
    display: flex;
    flex-direction: column;
    background: v-bind("palette.bg");
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid v-bind("palette.border");
    background: v-bind("palette.card");
  }

  .brand {
    font-size: 18px;
    font-weight: 700;
    color: #18a058;
    letter-spacing: 2px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-main {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 16px;
    padding: 16px;
    overflow: hidden;
  }

  .left {
    width: 430px;
    min-width: 430px;
    background: v-bind("palette.card");
    border: 1px solid v-bind("palette.border");
    border-radius: 12px;
    overflow-y: auto;
  }

  .right {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 450px;
    display: flex;
    flex-direction: column;
    background: v-bind("palette.card");
    border: 1px solid v-bind("palette.border");
    border-radius: 12px;
    overflow: hidden;
  }
</style>