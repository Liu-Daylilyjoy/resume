export type StepId = 'intake' | 'editor' | 'interview';
export type StageStatus = 'idle' | 'running' | 'completed';

export interface ApplicantForm {
  fullName: string;
  university: string;
  educationLevel: string;
  graduationYear: string;
  targetRole: string;
  targetCity: string;
  email: string;
  phone: string;
  courseHighlights: string;
  skillKeywords: string;
  personalStrengths: string;
  extraContext: string;
  repoPaths: string[];
  avatarDataUrl: string;
}

export interface StageLog {
  id: string;
  label: string;
  detail: string;
  status: StageStatus;
  summary: string;
}

export interface ProjectSummary {
  repoName: string;
  repoPath: string;
  techStack: string[];
  evidence: string[];
}

export interface GeneratedResumePayload {
  markdown: string;
  projectSummaries: ProjectSummary[];
  score: number;
  usedLlm: boolean;
}

export interface InterviewResource {
  id: string;
  title: string;
  source: string;
  summary: string;
  url: string;
  tags: string[];
}

export interface InterviewPrepPayload {
  sessionId: string;
  targetRole: string;
  resources: InterviewResource[];
  openingMessage: string;
  firstQuestion: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  speaker: string;
  content: string;
}

