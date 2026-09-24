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
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow } from "@tauri-apps/api/window";
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

  function minimizeWindow() {
    try {
      getCurrentWindow().minimize();
    } catch (e) {
      console.error("最小化失败", e);
    }
  }

  function closeWindow() {
    try {
      invoke("exit_app");
    } catch (e) {
      console.error("退出程序失败", e);
    }
  }

  const selectedDate = ref(new Date());
  const marks = ref<Map<string, DayMark>>(new Map());
  const luckyVisible = ref(false);
  const isWayland = ref(false);

  const palette = computed(() =>
    isDark.value
      ? { bg: "#0f0f12", card: "#18181c", border: "#2c2c33", text: "#d7d7db" }
      : { bg: "#f5f5f7", card: "#ffffff", border: "#ececef", text: "#18181c" },
  );

  onMounted(async () => {
    try {
      isWayland.value = await invoke<boolean>("is_wayland");
    } catch (e) {
      console.error("获取环境失败", e);
    }
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
      <div class="app" :class="{ dark: isDark, wayland: isWayland }">
        <header class="app-header" data-tauri-drag-region="deep">
          <div class="drag-area">
            <span class="brand">中国历</span>
          </div>
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
            <span class="window-controls">
              <button class="win-btn" title="最小化" @click="minimizeWindow">
                ─
              </button>
              <button class="win-btn close-btn" title="关闭" @click="closeWindow">
                ✕
              </button>
            </span>
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

  .app.wayland {
    border: 1px solid #000;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 12px;
    border-bottom: 1px solid v-bind("palette.border");
    background: v-bind("palette.card");
    user-select: none;
  }

  .drag-area {
    display: flex;
    align-items: center;
    align-self: stretch;
    flex: 1;
    min-width: 0;
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

  .window-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 4px;
    padding-left: 12px;
    border-left: 1px solid v-bind("palette.border");
  }

  .win-btn {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: v-bind("palette.text");
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .win-btn:hover {
    background: v-bind("palette.border");
  }

  .close-btn:hover {
    background: #e5484d;
    color: #fff;
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
    height: 500px;
    background: v-bind("palette.card");
    border: 1px solid v-bind("palette.border");
    border-radius: 12px;
    overflow-y: auto;
  }

  .right {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 500px;
    display: flex;
    flex-direction: column;
    background: v-bind("palette.card");
    border: 1px solid v-bind("palette.border");
    border-radius: 12px;
    overflow: hidden;
  }
</style>