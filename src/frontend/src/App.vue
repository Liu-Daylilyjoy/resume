<script setup lang="ts">
import { computed } from 'vue';
import EditorWorkspace from './pages/EditorWorkspace.vue';
import GenerateWorkspace from './pages/GenerateWorkspace.vue';
import InterviewWorkspace from './pages/InterviewWorkspace.vue';
import { canOpenStep, setCurrentStep, workflowState } from './store/workflow';
import type { StepId } from './types/workflow';

const steps: Array<{ id: StepId; title: string; desc: string }> = [
  {
    id: 'intake',
    title: '信息录入',
    desc: '填写背景、岗位和项目路径，触发多 Agent 简历生成。',
  },
  {
    id: 'editor',
    title: '简历编辑',
    desc: '在 Markdown 工作台中继续润色，并导出 PDF。',
  },
  {
    id: 'interview',
    title: '面试准备',
    desc: '查看资料链接，继续围绕项目源码做追问演练。',
  },
];

const currentView = computed(() => {
  if (workflowState.currentStep === 'editor') {
    return EditorWorkspace;
  }

  if (workflowState.currentStep === 'interview') {
    return InterviewWorkspace;
  }

  return GenerateWorkspace;
});

function stepState(stepId: StepId) {
  if (workflowState.currentStep === stepId) {
    return 'active';
  }

  return canOpenStep(stepId) ? 'available' : 'locked';
}
</script>

<template>
  <div class="shell app-shell">
    <header class="card app-header">
      <div class="header-copy">
        <p class="eyebrow">Resume Agent Workspace</p>
        <h1>从源码提炼证据，到生成简历，再到面试追问的一体化工作流</h1>
        <p class="section-desc">
          当前原型严格按照 README 的三段主链路设计，重点优化了信息密度、表单清晰度和流程可解释性，适合计算机专业求职场景。
        </p>
      </div>
      <div class="metric-grid header-metrics">
        <article class="card metric-card">
          <p class="metric-label">Agent 链路</p>
          <p class="metric-value">5 阶段</p>
        </article>
        <article class="card metric-card">
          <p class="metric-label">工作台形态</p>
          <p class="metric-value">Markdown + PDF</p>
        </article>
        <article class="card metric-card">
          <p class="metric-label">适用对象</p>
          <p class="metric-value">CS 求职人群</p>
        </article>
      </div>
    </header>

    <div class="app-layout">
      <aside class="card sidebar">
        <div>
          <p class="eyebrow">流程导航</p>
          <h2 class="section-title">主工作流</h2>
          <p class="section-desc">每个阶段都保留可解释输出，避免“黑箱式”简历生成。</p>
        </div>

        <nav class="step-list" aria-label="求职流程步骤">
          <button
            v-for="step in steps"
            :key="step.id"
            type="button"
            class="step-button"
            :class="`step-${stepState(step.id)}`"
            :disabled="!canOpenStep(step.id)"
            @click="setCurrentStep(step.id)"
          >
            <span class="step-index">{{ steps.findIndex((item) => item.id === step.id) + 1 }}</span>
            <span class="step-copy">
              <strong>{{ step.title }}</strong>
              <small>{{ step.desc }}</small>
            </span>
          </button>
        </nav>

        <section class="muted-card sidebar-note">
          <p class="eyebrow">设计约束</p>
          <ul class="list">
            <li>浅色中性底色，强调可信感与打印友好。</li>
            <li>所有关键动作都挂在明确按钮上，不用隐藏式交互。</li>
            <li>重点信息统一卡片化，保证移动端和桌面端都清晰可扫读。</li>
          </ul>
        </section>
      </aside>

      <main class="app-main">
        <component :is="currentView" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  gap: 24px;
}

.app-header {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  gap: 24px;
  padding: 28px;
}

.header-copy h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 1.2;
}

.header-metrics {
  align-self: stretch;
}

.app-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 18px;
  padding: 22px;
}

.step-list {
  display: grid;
  gap: 10px;
}

.step-button {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: var(--bg-panel);
  text-align: left;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.step-button:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--bg-soft);
  transform: translateY(-1px);
}

.step-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.step-index {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-panel-muted);
  color: var(--text-subtle);
  font-weight: 700;
}

.step-copy {
  display: grid;
  gap: 4px;
}

.step-copy strong {
  font-size: 0.98rem;
}

.step-copy small {
  color: var(--text-subtle);
  line-height: 1.5;
}

.step-active {
  border-color: rgba(31, 94, 255, 0.28);
  background: linear-gradient(180deg, var(--bg-soft), #ffffff);
}

.step-active .step-index,
.step-available .step-index {
  background: var(--bg-accent);
  color: var(--primary-strong);
}

.sidebar-note {
  padding: 16px;
}

.app-main {
  min-width: 0;
}

@media (max-width: 1180px) {
  .app-header,
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>

