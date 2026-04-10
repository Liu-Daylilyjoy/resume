import type {
  ApplicantForm,
  ChatMessage,
  GeneratedResumePayload,
  InterviewPrepPayload,
  InterviewResource,
  ProjectSummary,
} from '../types/workflow';

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const generationBlueprints = [
  {
    id: 'profile',
    label: '基本情况总结',
    detail: '压缩教育背景、课程和求职目标，形成候选人画像。',
  },
  {
    id: 'role',
    label: '技术背景重写',
    detail: '围绕目标岗位，把技能表述转换成更贴近招聘语境的版本。',
  },
  {
    id: 'projects',
    label: '项目阅读取证',
    detail: '结合仓库路径生成项目摘要、关键模块和可追问实现点。',
  },
  {
    id: 'layout',
    label: 'Markdown 排版',
    detail: '组装成可继续编辑的中文简历初稿。',
  },
  {
    id: 'review',
    label: '简历评审打分',
    detail: '根据岗位贴合度和证据完整性给出通过建议。',
  },
] as const;

const defaultResources: InterviewResource[] = [
  {
    id: 'resource-1',
    title: 'Vue 官方指南',
    source: '文档',
    summary: '适合前端方向补充组件通信、响应式和组合式 API 的表述。',
    url: 'https://cn.vuejs.org/guide/introduction.html',
    tags: ['前端', 'Vue'],
  },
  {
    id: 'resource-2',
    title: 'FastAPI Documentation',
    source: '文档',
    summary: '适合后端方向梳理接口设计、依赖注入和异步处理。',
    url: 'https://fastapi.tiangolo.com/',
    tags: ['后端', 'API'],
  },
  {
    id: 'resource-3',
    title: 'MDN Web Docs',
    source: '知识库',
    summary: '适合补充浏览器基础、性能优化和 Web API 细节。',
    url: 'https://developer.mozilla.org/zh-CN/',
    tags: ['通用', '基础'],
  },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function splitTokens(value: string) {
  return value
    .split(/[\n,，、/]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractRepoName(repoPath: string) {
  const normalized = repoPath.replace(/\\/g, '/').replace(/\/$/, '');
  const parts = normalized.split('/').filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : '未命名项目';
}

function summarizeProjects(form: ApplicantForm): ProjectSummary[] {
  const skillTokens = splitTokens(form.skillKeywords);
  const roleKeyword = form.targetRole || '目标岗位';
  const fallbacks = ['TypeScript', 'Vue 3', 'FastAPI'];

  return form.repoPaths
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => {
      const repoName = extractRepoName(path);
      const techStack = [...new Set([...skillTokens.slice(0, 3), ...fallbacks])].slice(0, 4);

      return {
        repoName,
        repoPath: path,
        techStack,
        evidence: [
          `针对 ${roleKeyword} 重新整理 ${repoName} 的项目边界、关键模块与可追问点。`,
          `优先提炼和 ${techStack[0] ?? '核心技术'} 相关的实现证据，方便写进简历与面试回答。`,
          `为 ${repoName} 保留性能优化、异常处理和工程权衡三个追问入口。`,
        ],
      };
    });
}

function buildResumeMarkdown(form: ApplicantForm, projectSummaries: ProjectSummary[]) {
  const skillTokens = splitTokens(form.skillKeywords);
  const strengthTokens = splitTokens(form.personalStrengths);
  const firstProject = projectSummaries[0];

  return `## 求职方向

- 目标岗位：${form.targetRole || '待补充'}
- 倾向城市：${form.targetCity || '待补充'}
- 学历信息：${form.university || '待补充'} · ${form.educationLevel || '待补充'} · ${form.graduationYear || '待补充'}

## 教育与技术背景

- 核心课程：${form.courseHighlights || '数据结构、操作系统、计算机网络、数据库'}
- 技术关键词：${skillTokens.join('、') || 'TypeScript、Vue、Python、FastAPI'}
- 个人优势：${strengthTokens.join('、') || '能从源码中提炼证据、能将项目经验映射到岗位需求'}

## 项目经历

${projectSummaries
  .map(
    (project) => `### ${project.repoName}

- 项目路径：\`${project.repoPath}\`
- 技术栈：${project.techStack.join(' / ')}
- 亮点沉淀：
  - ${project.evidence[0]}
  - ${project.evidence[1]}
  - ${project.evidence[2]}`
  )
  .join('\n\n')}

## 岗位匹配表达

- 围绕 ${form.targetRole || '目标岗位'} 强化“项目阅读后再写简历”的能力，避免只写表面功能。
- 强调对源码结构、模块职责、调用链路与边界条件的理解，适合在面试中展开深挖。
- 简历完成后，可直接进入面试准备页，继续围绕 ${firstProject?.repoName ?? '项目实现'} 做追问演练。

## 补充说明

${form.extraContext || '可在此补充实习偏好、时间安排、岗位方向或对项目的额外说明。'}
`;
}

function buildInterviewResources(form: ApplicantForm, projectSummaries: ProjectSummary[]) {
  const roleTokens = splitTokens(form.targetRole);
  const projectTokens = projectSummaries[0]?.techStack ?? [];

  return [
    {
      id: createId('resource'),
      title: `${form.targetRole || '目标岗位'} 常见面试知识点梳理`,
      source: '检索结果',
      summary: '按岗位关键词聚焦高频问法，方便进入模拟问答前先复核知识框架。',
      url: 'https://roadmap.sh/',
      tags: [...roleTokens.slice(0, 2), '面试题'],
    },
    {
      id: createId('resource'),
      title: `${projectSummaries[0]?.repoName ?? '项目'} 技术栈查缺清单`,
      source: '项目摘要',
      summary: '把项目中真正使用到的技术栈和可追问模块合并成一页复习清单。',
      url: 'https://developer.mozilla.org/zh-CN/',
      tags: [...projectTokens.slice(0, 2), '项目深挖'],
    },
    ...defaultResources,
  ];
}

export async function simulateResumeGeneration(
  form: ApplicantForm,
  onStageUpdate: (stageId: string, summary: string, status: 'running' | 'completed') => void
): Promise<GeneratedResumePayload> {
  const projectSummaries = summarizeProjects(form);

  const stageSummaries: Record<string, string> = {
    profile: `${form.fullName || '候选人'} 的教育背景和求职方向已压缩为一页式画像。`,
    role: `已围绕 ${form.targetRole || '目标岗位'} 重写技能表达，突出岗位贴合度。`,
    projects: `从 ${projectSummaries.length || 1} 个项目路径中提炼出可用于简历与面试的证据点。`,
    layout: '已生成可继续编辑的 Markdown 初稿，并保留头像位与项目摘要结构。',
    review: '当前版本已通过基础评审，可继续进入编辑和面试准备阶段。',
  };

  for (const stage of generationBlueprints) {
    onStageUpdate(stage.id, `正在处理：${stage.detail}`, 'running');
    await wait(480);
    onStageUpdate(stage.id, stageSummaries[stage.id], 'completed');
  }

  return {
    markdown: buildResumeMarkdown(form, projectSummaries),
    projectSummaries,
    score: 83 + Math.min(projectSummaries.length, 2) * 4,
    usedLlm: false,
  };
}

export async function prepareInterviewWorkspace(
  form: ApplicantForm,
  markdown: string,
  projectSummaries: ProjectSummary[]
): Promise<InterviewPrepPayload> {
  await wait(520);

  const leadProject = projectSummaries[0];
  const openingMessage = `下面进入 ${form.targetRole || '目标岗位'} 的面试准备阶段。我会优先围绕最终简历和项目证据提问，不只停留在功能描述。`;
  const firstQuestion = leadProject
    ? `先从 ${leadProject.repoName} 开始。你为什么认为这个项目最能证明你胜任 ${form.targetRole || '该岗位'}？请结合一个具体模块说明。`
    : `请先解释一下，你的最终简历里哪一段最能体现你对 ${form.targetRole || '目标岗位'} 的匹配度？`;

  return {
    sessionId: createId('session'),
    targetRole: form.targetRole,
    resources: buildInterviewResources(form, projectSummaries),
    openingMessage,
    firstQuestion: markdown.length > 0 ? firstQuestion : '请先完善简历正文后再进入问答。',
  };
}

export async function generateInterviewReply(
  form: ApplicantForm,
  projectSummaries: ProjectSummary[],
  answer: string,
  round: number
): Promise<ChatMessage> {
  await wait(420);

  const leadProject = projectSummaries[0];
  const conciseAnswer = answer.trim().length < 36;
  const focus = conciseAnswer ? '实现细节' : '工程权衡';
  const prompt = conciseAnswer
    ? `你的回答还可以再具体一点。请围绕 ${leadProject?.repoName ?? '当前项目'} 讲清楚一个模块的输入、输出和失败场景。`
    : `如果把这个项目继续往线上质量推进，你会优先补哪一项 ${focus}？请说明原因和落地方式。`;

  return {
    id: createId('chat'),
    role: 'assistant',
    speaker: `面试官 Agent · Round ${round}`,
    content: `${prompt} 另外，也请顺带说明这段经历和 ${form.targetRole || '目标岗位'} 的直接关系。`,
  };
}
