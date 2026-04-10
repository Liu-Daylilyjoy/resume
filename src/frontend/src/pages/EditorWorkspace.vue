<script setup lang="ts">
import { computed, ref } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { prepareInterviewWorkspace } from '../apis/mockAgent';
import {
  beginInterviewPrep,
  finalizeInterviewPrep,
  resetDraft,
  setCurrentStep,
  setResumeDraft,
  workflowState,
} from '../store/workflow';

const previewRef = ref<HTMLElement | null>(null);

const previewHtml = computed(() =>
  DOMPurify.sanitize(
    marked.parse(workflowState.resumeDraft || '## 请先回到上一步生成简历内容') as string
  )
);

const initials = computed(() => workflowState.form.fullName.trim().slice(0, 1) || '候');

const canPrepareInterview = computed(
  () =>
    workflowState.resumeDraft.trim().length > 0 &&
    workflowState.projectSummaries.length > 0 &&
    !workflowState.isPreparingInterview
);

async function handleExportPdf() {
  if (!previewRef.value) {
    return;
  }

  const { default: html2pdf } = await import('html2pdf.js');

  await html2pdf()
    .set({
      margin: 10,
      filename: `${workflowState.form.fullName || 'resume'}-resume.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(previewRef.value)
    .save();
}

async function handlePrepareInterview() {
  if (!canPrepareInterview.value) {
    return;
  }

  beginInterviewPrep();
  const payload = await prepareInterviewWorkspace(
    workflowState.form,
    workflowState.resumeDraft,
    workflowState.projectSummaries
  );
  finalizeInterviewPrep(payload);
  setCurrentStep('interview');
}
</script>

<template>
  <section class="workspace">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Step 2</p>
        <h2 class="section-title">Markdown 编辑工作台</h2>
        <p class="section-desc">
          结果页不只是静态预览。你可以继续编辑正文、保留头像区块，并直接按当前预览内容导出 PDF。
        </p>
      </div>
      <div class="button-row">
        <button type="button" class="button button-secondary" @click="resetDraft">恢复生成稿</button>
        <button type="button" class="button button-ghost" @click="handleExportPdf">导出 PDF</button>
        <button type="button" class="button button-primary" :disabled="!canPrepareInterview" @click="handlePrepareInterview">
          {{ workflowState.isPreparingInterview ? '正在准备...' : '完成并进入面试准备' }}
        </button>
      </div>
    </div>

    <section v-if="workflowState.resumeDraft" class="workspace-grid">
      <div class="panel-stack">
        <section class="card summary-panel">
          <div class="metric-grid">
            <article class="card metric-card">
              <p class="metric-label">生成时间</p>
              <p class="metric-value summary-value">{{ workflowState.lastGeneratedAt || '刚刚生成' }}</p>
            </article>
            <article class="card metric-card">
              <p class="metric-label">评审分数</p>
              <p class="metric-value">{{ workflowState.resumeScore }}</p>
            </article>
            <article class="card metric-card">
              <p class="metric-label">项目摘要数</p>
              <p class="metric-value">{{ workflowState.projectSummaries.length }}</p>
            </article>
          </div>
        </section>

        <section class="card editor-panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">左侧编辑</p>
              <h3>当前简历正文</h3>
            </div>
            <span class="status-pill status-completed">
              <span class="status-dot"></span>
              {{ workflowState.usedLlm ? 'LLM 生成' : '模板兜底生成' }}
            </span>
          </div>
          <textarea
            :value="workflowState.resumeDraft"
            class="textarea editor-textarea"
            aria-label="Markdown 简历正文"
            @input="setResumeDraft(($event.target as HTMLTextAreaElement).value)"
          />
        </section>

        <section class="card evidence-panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">项目证据</p>
              <h3>生成阶段提取的重点</h3>
            </div>
          </div>

          <div class="evidence-list">
            <article v-for="project in workflowState.projectSummaries" :key="project.repoPath" class="muted-card evidence-card">
              <h4>{{ project.repoName }}</h4>
              <p class="helper-text">{{ project.repoPath }}</p>
              <div class="chip-row">
                <span v-for="tech in project.techStack" :key="tech" class="chip">{{ tech }}</span>
              </div>
              <ul class="list">
                <li v-for="item in project.evidence" :key="item">{{ item }}</li>
              </ul>
            </article>
          </div>
        </section>
      </div>

      <section class="card preview-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">右侧预览</p>
            <h3>PDF 将以当前内容导出</h3>
          </div>
          <span class="helper-text">头像区块固定保留在简历顶部，便于打印与投递。</span>
        </div>

        <div ref="previewRef" class="resume-sheet">
          <header class="resume-sheet-header">
            <div class="resume-avatar">
              <img v-if="workflowState.form.avatarDataUrl" :src="workflowState.form.avatarDataUrl" alt="候选人头像" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="resume-meta">
              <p class="eyebrow">Candidate Profile</p>
              <h2>{{ workflowState.form.fullName }}</h2>
              <p>{{ workflowState.form.targetRole }} · {{ workflowState.form.targetCity }}</p>
              <p>{{ workflowState.form.email }} · {{ workflowState.form.phone }}</p>
            </div>
          </header>
          <article class="markdown-body" v-html="previewHtml"></article>
        </div>
      </section>
    </section>

    <section v-else class="card empty-state">
      <div>
        <h3>还没有可编辑内容</h3>
        <p>先回到上一步完成简历生成，编辑工作台才会出现 Markdown 和预览内容。</p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 22px;
}

.section-heading,
.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
  gap: 22px;
}

.panel-stack {
  display: grid;
  gap: 22px;
}

.summary-panel,
.editor-panel,
.evidence-panel,
.preview-panel {
  padding: 24px;
}

.summary-value {
  font-size: 1rem;
}

.editor-textarea {
  min-height: 460px;
  margin-top: 18px;
  font-family: "Consolas", "SFMono-Regular", "Menlo", monospace;
}

.evidence-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.evidence-card {
  padding: 16px;
}

.evidence-card h4 {
  margin: 0 0 6px;
}

.resume-sheet {
  margin-top: 20px;
  min-height: 960px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #ffffff;
  padding: 28px;
}

.resume-sheet-header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--border);
}

.resume-avatar {
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border-radius: 24px;
  background: var(--bg-panel-muted);
  color: var(--primary-strong);
  font-size: 1.75rem;
  font-weight: 700;
  overflow: hidden;
}

.resume-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resume-meta h2 {
  margin: 0;
  font-size: 1.75rem;
}

.resume-meta p {
  margin: 6px 0 0;
  color: var(--text-subtle);
}

@media (max-width: 1240px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-heading,
  .panel-head,
  .resume-sheet-header {
    display: grid;
  }
}
</style>
