<script setup lang="ts">
import { computed } from 'vue';
import { simulateResumeGeneration } from '../apis/mockAgent';
import {
  addRepoPath,
  beginGeneration,
  finalizeGeneration,
  removeRepoPath,
  setAvatar,
  setCurrentStep,
  updateRepoPath,
  updateStage,
  workflowState,
} from '../store/workflow';

const canSubmit = computed(() => {
  const hasCoreFields =
    workflowState.form.fullName.trim().length > 0 &&
    workflowState.form.targetRole.trim().length > 0 &&
    workflowState.form.repoPaths.some((path) => path.trim().length > 0);

  return hasCoreFields && !workflowState.isGenerating;
});

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('头像读取失败'));
    reader.readAsDataURL(file);
  });

  setAvatar(dataUrl);
}

async function handleGenerate() {
  if (!canSubmit.value) {
    return;
  }

  beginGeneration();

  const result = await simulateResumeGeneration(workflowState.form, (stageId, summary, status) => {
    updateStage(stageId, summary, status);
  });

  finalizeGeneration(result);
  setCurrentStep('editor');
}
</script>

<template>
  <section class="workspace">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Step 1</p>
        <h2 class="section-title">填写候选人信息并生成简历初稿</h2>
        <p class="section-desc">
          这里输入的是求职语境，不只是原始资料。页面会把你的背景、目标岗位和项目路径统一转成可编辑简历初稿。
        </p>
      </div>
      <div class="button-row">
        <button type="button" class="button button-ghost" @click="addRepoPath">新增项目路径</button>
        <button type="button" class="button button-primary" :disabled="!canSubmit" @click="handleGenerate">
          {{ workflowState.isGenerating ? '正在生成...' : '开始生成简历' }}
        </button>
      </div>
    </div>

    <div class="content-grid">
      <form class="card form-panel" @submit.prevent="handleGenerate">
        <div class="panel-header">
          <div>
            <p class="eyebrow">候选人表单</p>
            <h3>基础信息</h3>
          </div>
          <div class="avatar-card">
            <div class="avatar-preview">
              <img v-if="workflowState.form.avatarDataUrl" :src="workflowState.form.avatarDataUrl" alt="候选人头像预览" />
              <span v-else>{{ workflowState.form.fullName.slice(0, 1) || '候' }}</span>
            </div>
            <label class="upload-button">
              上传头像
              <input class="sr-only" type="file" accept="image/*" @change="handleAvatarChange" />
            </label>
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="fullName">姓名</label>
            <input id="fullName" v-model="workflowState.form.fullName" class="input" placeholder="例如：张同学" />
          </div>
          <div class="field">
            <label for="targetRole">目标岗位</label>
            <input id="targetRole" v-model="workflowState.form.targetRole" class="input" placeholder="例如：前端开发实习生" />
          </div>
          <div class="field">
            <label for="university">学校</label>
            <input id="university" v-model="workflowState.form.university" class="input" placeholder="例如：某某大学" />
          </div>
          <div class="field">
            <label for="educationLevel">学历</label>
            <input id="educationLevel" v-model="workflowState.form.educationLevel" class="input" placeholder="例如：本科 / 研究生" />
          </div>
          <div class="field">
            <label for="graduationYear">毕业时间</label>
            <input id="graduationYear" v-model="workflowState.form.graduationYear" class="input" placeholder="例如：2027" />
          </div>
          <div class="field">
            <label for="targetCity">目标城市</label>
            <input id="targetCity" v-model="workflowState.form.targetCity" class="input" placeholder="例如：上海 / 深圳" />
          </div>
          <div class="field">
            <label for="email">邮箱</label>
            <input id="email" v-model="workflowState.form.email" class="input" placeholder="example@school.edu" />
          </div>
          <div class="field">
            <label for="phone">手机号</label>
            <input id="phone" v-model="workflowState.form.phone" class="input" placeholder="138-xxxx-xxxx" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="courses">核心课程</label>
            <textarea
              id="courses"
              v-model="workflowState.form.courseHighlights"
              class="textarea"
              placeholder="例如：数据结构、操作系统、计算机网络、数据库"
            />
          </div>
          <div class="field">
            <label for="skills">技能关键词</label>
            <textarea
              id="skills"
              v-model="workflowState.form.skillKeywords"
              class="textarea"
              placeholder="例如：Vue 3, TypeScript, Python, FastAPI"
            />
          </div>
          <div class="field">
            <label for="strengths">个人优势</label>
            <textarea
              id="strengths"
              v-model="workflowState.form.personalStrengths"
              class="textarea"
              placeholder="例如：善于读源码、乐于补齐工程细节、表达清晰"
            />
          </div>
          <div class="field">
            <label for="extra">额外说明</label>
            <textarea
              id="extra"
              v-model="workflowState.form.extraContext"
              class="textarea"
              placeholder="例如：希望突出哪些经历、是否偏正式风格、是否投递实习岗位"
            />
          </div>
        </div>

        <div class="field repo-field">
          <label>本地项目路径</label>
          <div class="repo-list">
            <div v-for="(path, index) in workflowState.form.repoPaths" :key="index" class="repo-row">
              <input
                :value="path"
                class="input"
                :placeholder="`项目路径 ${index + 1}`"
                @input="updateRepoPath(index, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="button button-secondary repo-remove" @click="removeRepoPath(index)">
                删除
              </button>
            </div>
          </div>
          <p class="helper-text">支持多个仓库路径，方便后续做项目摘要、RAG 检索和面试追问路由。</p>
        </div>

        <div class="button-row form-actions">
          <button type="submit" class="button button-primary" :disabled="!canSubmit">
            {{ workflowState.isGenerating ? 'Agent 正在编排中' : '生成 Markdown 简历' }}
          </button>
          <span class="status-pill" :class="workflowState.isGenerating ? 'status-running' : 'status-completed'">
            <span class="status-dot"></span>
            {{ workflowState.isGenerating ? '生成进行中' : '可随时开始生成' }}
          </span>
        </div>
      </form>

      <div class="panel-stack">
        <section class="card stage-panel">
          <div class="panel-header panel-header-tight">
            <div>
              <p class="eyebrow">多 Agent 进度</p>
              <h3>生成过程透明可见</h3>
            </div>
            <span class="status-pill" :class="workflowState.isGenerating ? 'status-running' : 'status-completed'">
              <span class="status-dot"></span>
              {{ workflowState.isGenerating ? '执行中' : '待执行' }}
            </span>
          </div>

          <div class="stage-list">
            <article
              v-for="stage in workflowState.stages"
              :key="stage.id"
              class="muted-card stage-card"
              :class="`stage-${stage.status}`"
            >
              <div class="stage-card-top">
                <strong>{{ stage.label }}</strong>
                <span class="status-pill" :class="`status-${stage.status}`">
                  <span class="status-dot"></span>
                  {{ stage.status === 'idle' ? '未开始' : stage.status === 'running' ? '进行中' : '已完成' }}
                </span>
              </div>
              <p>{{ stage.detail }}</p>
              <small>{{ stage.summary || '等待当前步骤开始。' }}</small>
            </article>
          </div>
        </section>

        <section class="card insight-panel">
          <p class="eyebrow">表单策略</p>
          <h3>为什么这样组织信息</h3>
          <ul class="list">
            <li>先收集岗位和项目路径，再决定简历表述，避免出现“有项目但和岗位无关”的问题。</li>
            <li>把 Markdown 编辑和 PDF 导出留到后一步，保证生成链路和人工润色边界清晰。</li>
            <li>所有模块都围绕可解释性设计，后续接入真实后端时也能保留同样的页面结构。</li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 22px;
}

.section-heading,
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: 22px;
}

.form-panel,
.stage-panel,
.insight-panel {
  padding: 24px;
}

.panel-stack {
  display: grid;
  gap: 22px;
}

.form-panel {
  display: grid;
  gap: 22px;
}

.panel-header h3,
.insight-panel h3 {
  margin: 0;
  font-size: 1.15rem;
}

.avatar-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-panel-muted);
  color: var(--primary-strong);
  font-size: 1.25rem;
  font-weight: 700;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  padding: 10px 14px;
  background: #ffffff;
  font-weight: 600;
}

.repo-field {
  gap: 12px;
}

.repo-list {
  display: grid;
  gap: 12px;
}

.repo-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.repo-remove {
  min-width: 80px;
}

.form-actions {
  align-items: center;
}

.panel-header-tight {
  align-items: center;
}

.stage-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.stage-card {
  padding: 16px;
}

.stage-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.stage-card p {
  margin: 0;
  color: var(--text-subtle);
  line-height: 1.6;
}

.stage-card small {
  display: block;
  margin-top: 10px;
  color: var(--text-main);
  line-height: 1.6;
}

.insight-panel {
  display: grid;
  gap: 10px;
}

@media (max-width: 1240px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-heading,
  .panel-header,
  .repo-row {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>

