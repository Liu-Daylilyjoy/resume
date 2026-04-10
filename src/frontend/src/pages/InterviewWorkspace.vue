<script setup lang="ts">
import { computed, ref } from 'vue';
import { generateInterviewReply } from '../apis/mockAgent';
import {
  appendAssistantMessage,
  appendUserMessage,
  setCurrentStep,
  workflowState,
} from '../store/workflow';

const draftAnswer = ref('');
const isReplying = ref(false);

const hasInterviewData = computed(() => workflowState.interviewResources.length > 0);

async function handleSend() {
  const answer = draftAnswer.value.trim();

  if (!answer || isReplying.value) {
    return;
  }

  appendUserMessage(answer);
  draftAnswer.value = '';
  isReplying.value = true;

  const nextMessage = await generateInterviewReply(
    workflowState.form,
    workflowState.projectSummaries,
    answer,
    workflowState.chatMessages.length
  );

  appendAssistantMessage(nextMessage);
  isReplying.value = false;
}
</script>

<template>
  <section class="workspace">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Step 3</p>
        <h2 class="section-title">面试准备与项目追问</h2>
        <p class="section-desc">
          页面同时承接资料检索和面试官 Agent 对话，帮助你把简历内容继续落到源码、工程权衡和边界情况上。
        </p>
      </div>
      <div class="button-row">
        <button type="button" class="button button-secondary" @click="setCurrentStep('editor')">返回编辑工作台</button>
      </div>
    </div>

    <section v-if="hasInterviewData" class="interview-grid">
      <aside class="card resource-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">资料检索</p>
            <h3>建议先快速复核这些资料</h3>
          </div>
          <span class="status-pill status-completed">
            <span class="status-dot"></span>
            会话 {{ workflowState.interviewSessionId }}
          </span>
        </div>

        <div class="resource-list">
          <article v-for="resource in workflowState.interviewResources" :key="resource.id" class="muted-card resource-card">
            <div class="resource-top">
              <div>
                <h4>{{ resource.title }}</h4>
                <p class="helper-text">{{ resource.source }}</p>
              </div>
              <a class="resource-link" :href="resource.url" target="_blank" rel="noreferrer">打开链接</a>
            </div>
            <p>{{ resource.summary }}</p>
            <div class="chip-row">
              <span v-for="tag in resource.tags" :key="tag" class="chip">{{ tag }}</span>
            </div>
          </article>
        </div>
      </aside>

      <section class="card chat-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">面试官 Agent</p>
            <h3>围绕项目实现做连续追问</h3>
          </div>
          <span class="status-pill status-running">
            <span class="status-dot"></span>
            目标岗位：{{ workflowState.interviewTargetRole }}
          </span>
        </div>

        <div class="chat-list" aria-live="polite">
          <article
            v-for="message in workflowState.chatMessages"
            :key="message.id"
            class="message"
            :class="`message-${message.role}`"
          >
            <p class="message-speaker">{{ message.speaker }}</p>
            <p class="message-content">{{ message.content }}</p>
          </article>
        </div>

        <div class="composer">
          <label class="sr-only" for="answerBox">回答输入框</label>
          <textarea
            id="answerBox"
            v-model="draftAnswer"
            class="textarea"
            placeholder="尝试按“背景 - 决策 - 结果 - 反思”的结构作答，越具体越有利于后续追问。"
          />
          <div class="button-row composer-actions">
            <span class="helper-text">建议结合一个具体模块、一个失败场景和一个工程取舍来回答。</span>
            <button type="button" class="button button-primary" :disabled="isReplying" @click="handleSend">
              {{ isReplying ? '追问生成中...' : '发送回答' }}
            </button>
          </div>
        </div>
      </section>
    </section>

    <section v-else class="card empty-state">
      <div>
        <h3>还没有准备好的面试会话</h3>
        <p>请先在编辑工作台点击“完成并进入面试准备”，系统才会根据最终简历生成资料链接和第一轮问题。</p>
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

.interview-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  gap: 22px;
}

.resource-panel,
.chat-panel {
  padding: 24px;
}

.resource-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.resource-card {
  padding: 16px;
}

.resource-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.resource-card h4 {
  margin: 0 0 6px;
}

.resource-card p {
  color: var(--text-subtle);
  line-height: 1.6;
}

.resource-link {
  color: var(--primary-strong);
  font-weight: 600;
  text-decoration: none;
}

.chat-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  max-height: 560px;
  overflow: auto;
  padding-right: 4px;
}

.message {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
}

.message-assistant {
  background: var(--bg-panel-muted);
}

.message-user {
  background: var(--bg-soft);
  margin-left: 36px;
}

.message-speaker {
  margin: 0 0 8px;
  color: var(--primary-strong);
  font-size: 0.9rem;
  font-weight: 700;
}

.message-content {
  margin: 0;
  line-height: 1.72;
}

.composer {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.composer-actions {
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 1240px) {
  .interview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-heading,
  .panel-head,
  .resource-top,
  .composer-actions {
    display: grid;
  }

  .message-user {
    margin-left: 0;
  }
}
</style>
