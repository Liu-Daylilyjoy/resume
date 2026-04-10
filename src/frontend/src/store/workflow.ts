import { reactive } from 'vue';
import { generationBlueprints } from '../apis/mockAgent';
import type {
  ApplicantForm,
  ChatMessage,
  GeneratedResumePayload,
  InterviewPrepPayload,
  InterviewResource,
  ProjectSummary,
  StageLog,
  StepId,
} from '../types/workflow';

function createDefaultForm(): ApplicantForm {
  return {
    fullName: '张同学',
    university: '某某大学',
    educationLevel: '本科',
    graduationYear: '2027',
    targetRole: '前端开发实习生',
    targetCity: '上海 / 杭州',
    email: 'student@example.com',
    phone: '138-0000-0000',
    courseHighlights: '数据结构、计算机网络、操作系统、数据库系统',
    skillKeywords: 'Vue 3, TypeScript, Vite, Node.js, Python',
    personalStrengths: '能快速阅读代码仓库、能将项目证据转成岗位表达、善于准备技术面试',
    extraContext: '希望突出项目阅读能力和工程化思维，简历风格偏正式、清晰、易导出。',
    repoPaths: ['D:\\projects\\resume-agent', 'D:\\projects\\course-scheduler'],
    avatarDataUrl: '',
  };
}

function createStageLogs(): StageLog[] {
  return generationBlueprints.map((stage) => ({
    ...stage,
    status: 'idle',
    summary: '',
  }));
}

function createMessage(role: 'assistant' | 'user', speaker: string, content: string): ChatMessage {
  return {
    id: `${role}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    speaker,
    content,
  };
}

export const workflowState = reactive({
  currentStep: 'intake' as StepId,
  form: createDefaultForm(),
  stages: createStageLogs(),
  isGenerating: false,
  usedLlm: false,
  resumeScore: 0,
  baseResumeMarkdown: '',
  resumeDraft: '',
  projectSummaries: [] as ProjectSummary[],
  lastGeneratedAt: '',
  isPreparingInterview: false,
  interviewSessionId: '',
  interviewTargetRole: '',
  interviewResources: [] as InterviewResource[],
  chatMessages: [] as ChatMessage[],
});

export function canOpenStep(step: StepId) {
  if (step === 'intake') {
    return true;
  }

  if (step === 'editor') {
    return workflowState.resumeDraft.trim().length > 0;
  }

  return workflowState.interviewResources.length > 0;
}

export function setCurrentStep(step: StepId) {
  if (canOpenStep(step)) {
    workflowState.currentStep = step;
  }
}

export function addRepoPath() {
  workflowState.form.repoPaths.push('');
}

export function removeRepoPath(index: number) {
  if (workflowState.form.repoPaths.length > 1) {
    workflowState.form.repoPaths.splice(index, 1);
  }
}

export function updateRepoPath(index: number, value: string) {
  workflowState.form.repoPaths[index] = value;
}

export function setAvatar(dataUrl: string) {
  workflowState.form.avatarDataUrl = dataUrl;
}

export function beginGeneration() {
  workflowState.isGenerating = true;
  workflowState.stages = createStageLogs();
}

export function updateStage(stageId: string, summary: string, status: 'running' | 'completed') {
  const target = workflowState.stages.find((stage) => stage.id === stageId);

  if (!target) {
    return;
  }

  target.status = status;
  target.summary = summary;
}

export function finalizeGeneration(payload: GeneratedResumePayload) {
  workflowState.isGenerating = false;
  workflowState.usedLlm = payload.usedLlm;
  workflowState.resumeScore = payload.score;
  workflowState.projectSummaries = payload.projectSummaries;
  workflowState.baseResumeMarkdown = payload.markdown;
  workflowState.resumeDraft = payload.markdown;
  workflowState.lastGeneratedAt = new Date().toLocaleString('zh-CN', {
    hour12: false,
  });
}

export function resetDraft() {
  workflowState.resumeDraft = workflowState.baseResumeMarkdown;
}

export function setResumeDraft(value: string) {
  workflowState.resumeDraft = value;
}

export function beginInterviewPrep() {
  workflowState.isPreparingInterview = true;
}

export function finalizeInterviewPrep(payload: InterviewPrepPayload) {
  workflowState.isPreparingInterview = false;
  workflowState.interviewSessionId = payload.sessionId;
  workflowState.interviewTargetRole = payload.targetRole;
  workflowState.interviewResources = payload.resources;
  workflowState.chatMessages = [
    createMessage('assistant', '面试官 Agent', payload.openingMessage),
    createMessage('assistant', '面试官 Agent', payload.firstQuestion),
  ];
}

export function appendUserMessage(content: string) {
  workflowState.chatMessages.push(createMessage('user', '候选人', content));
}

export function appendAssistantMessage(message: ChatMessage) {
  workflowState.chatMessages.push(message);
}

