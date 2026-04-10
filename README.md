# 求职 Agent

一个面向计算机专业学生的本地求职辅助项目。用户填写基本信息、上传头像、提供本地代码仓库路径后，系统会结合表单内容和源码证据生成可编辑的 Markdown 简历；用户可以在前端继续润色、导出 PDF，并在完成后进入“面试准备”页面，查看岗位资料链接并和面试官 Agent 进行项目深挖对话。

## 项目定位

这个项目不是“单纯把表单拼成简历”，而是把求职流程拆成了 3 条连续链路：

1. 简历生成：结合用户背景、目标岗位和本地代码仓库，生成岗位导向的中文简历。
2. 简历编辑：在前端实时编辑 Markdown，并按当前预览结果导出 PDF。
3. 面试准备：根据最终简历、目标岗位和项目源码，补充资料检索与面试官追问。

## 核心功能

### 1. 多 Agent 简历生成

后端围绕一次简历生成请求串行执行多个职责明确的 Agent：

- 基本情况总结 Agent：压缩个人背景，提炼和岗位相关的教育、课程、技能信息。
- 技术背景 Agent：根据目标岗位，把技能描述改写成更贴近招聘语境的技术背景。
- 项目阅读 Agent：检索本地代码仓库，提取项目结构、关键模块、核心实现与可落入简历的技术证据。
- 排版 Agent：汇总上述内容，生成适合继续编辑的 Markdown 简历正文。
- 简历评审员：对生成结果评分，若低于阈值则按配置触发重写。

这条链路支持两种返回模式：

- 普通接口：直接返回最终 Markdown。
- 流式接口：按阶段输出进度和中间片段，前端可以用独立加载页实时展示生成过程。

### 2. 基于源码的项目阅读

用户可以一次输入多个本地项目路径，系统会先做轻量项目扫描，再对可索引仓库建立混合代码索引。项目介绍不是只看 README，而是尽量从真实代码实现中提取：

- 项目结构和目录边界
- 关键文件与模块职责
- 主要技术栈
- 接口、调用链、状态管理、检索链路等实现细节
- 性能优化、缓存、失败场景、边界条件等可追问内容

### 3. 前端 Markdown 编辑与 PDF 导出

简历生成完成后，前端进入结果页：

- 左侧编辑 Markdown
- 右侧实时渲染预览
- 保留头像区块
- 点击按钮后直接在浏览器侧导出 PDF

PDF 不再由后端生成，这样用户在前端修改后的每一次调整，都能立即反映到最终导出结果。

### 4. 完成后的面试准备

用户点击“完成并进入面试准备”后，后端会基于最终编辑后的 Markdown 再执行两件事：

- 检索岗位面试题、知识点资料和项目相关面经链接
- 创建一个与目标岗位一致的面试官 Agent 会话

面试官 Agent 会结合：

- 最终简历正文
- 目标岗位
- 本地项目摘要
- 针对项目再次检索到的源码上下文

围绕项目实现、工程权衡、性能优化和边界情况发起追问。

## 关键技术细节

### 多 Agent 编排与评分重试

简历生成阶段使用固定线性编排，而不是自由路由式 Agent 对话。这样做的好处是：

- 每一步职责更稳定
- 前端更容易展示阶段进度
- 简历评审可以插在链路尾部做统一质量控制

后端配置里支持：

- `RESUME_SCORE`：简历评审达标分数
- `RESUME_MAX_ATTEMPTS`：最多重写次数
- `RESUME_FAILURE_STRATEGY`：低于阈值时是“返回最好的一版”还是“严格失败”

如果本地没有可用的 LLM/Embedding 配置，系统会退回模板式兜底，保证本地开发环境仍能跑通主流程。

### AST 优先的混合代码索引

项目阅读不是简单的“全文切块 + 向量检索”，而是实现了一套 AST 优先的混合索引：

- 符号索引：基于 `tree-sitter` 解析 Python、TS/JS、Vue 脚本块，抽取函数、类、接口、类型、方法等语义单元。
- BM25 全文索引：基于 SQLite FTS5，补足函数名、类名、变量名、路径名等字面匹配能力。
- 向量检索：对符号正文、docstring、模块名等做 embedding，用于匹配自然语言描述。

混合检索的核心目标不是“只找语义最像的文本”，而是同时兼顾：

- 精确命中具体函数或模块
- 命中业务关键词
- 理解自然语言问题

最终排序不是单一路径决定，而是把三路候选结果用加权 RRF 融合，再做一轮基于文件路径、模块名、父符号的加分与去重。

### 索引中的元数据绑定

每个代码符号都会绑定结构化元数据，例如：

- 仓库 ID
- 文件路径
- 模块名
- 符号类型、符号名、限定名
- 起止行号
- imports / exports
- callers / callees
- git 版本、脏状态、内容哈希

这样做的价值是：

- 返回给 Agent 的不是“匿名代码片段”，而是可解释的工程上下文
- 可以在面试追问时继续围绕同一项目、同一模块做定向检索
- 可以避免多个项目在同一次对话里相互串味

### 仓库隔离与增量更新

每个仓库都会在本地缓存目录下建立独立索引库：

```text
src/backend/.cache/repo_index/<repo_id>/index.sqlite
```

更新策略不是每次全量重建，而是“请求时增量同步”：

- 如果是 Git 仓库：优先用 `git diff`、未跟踪文件和 `HEAD` 变化判断增量
- 如果不是 Git 仓库：回退到 `mtime + size + content_hash` 指纹比较

只有变化的文件才会被重新解析、重建符号、重建 FTS 文档、重算 embedding。

### 前端结果页的实现方式

结果页不是一个静态预览面板，而是一个真正的 Markdown 编辑工作台：

- 编辑区维护当前简历正文
- 预览区用 `marked + DOMPurify` 实时渲染
- 头像通过预留区块自动插入到 Markdown 顶部
- `html2pdf.js` 按当前预览 DOM 直接导出 PDF

这意味着最终 PDF 反映的是“用户当前编辑后的简历”，而不是后端最初生成的原始文本。

### 面试准备链路

面试准备页里有两个并行能力：

1. 资料检索
   - 默认走 DuckDuckGo
   - 可切换 Tavily
   - 按目标岗位、技能关键词和项目主题生成搜索 query
   - 对结果做 URL 去重和岗位过滤，避免把“AI 应用开发工程师”搜成“AI 产品经理”

2. 面试官 Agent
   - 首轮根据最终简历和项目源码生成开场与问题
   - 后续根据用户回答继续追问
   - 多项目场景下会尽量把问题路由到当前最相关的项目仓库，而不是把多个仓库上下文混在一起

## 技术栈

- 前端：Vue 3 + Vite + TypeScript
- 后端：FastAPI
- Agent 编排：LangChain + LangGraph
- 代码检索：tree-sitter + SQLite FTS5 + OpenAI Embeddings
- Markdown 预览：marked + DOMPurify
- PDF 导出：html2pdf.js

## 目录结构

详细结构说明见 [docs/structure.md](d:/文档/university/job/resume/docs/structure.md)。

当前主目录按前后端分离组织：

```text
src/
  backend/
    resume_agent/
      api/
      core/
      prompts/
      schema/
      services/
      tools/
  frontend/
    src/
      pages/
      apis/
      store/
      styles/
```

## 快速启动

在项目根目录执行：

```powershell
.\start-dev.cmd
```

关闭前后端：

```powershell
.\stop-dev.cmd
```

## 手动启动

### 后端

```powershell
cd src/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn resume_agent.main:app --reload --host 127.0.0.1 --port 8000
```

### 前端

```powershell
cd src/frontend
npm install
Copy-Item .env.example .env
npm run dev
```

## 常用环境变量

后端 `.env` 示例：

```env
LLM_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

RESUME_SCORE=80
RESUME_MAX_ATTEMPTS=2
RESUME_FAILURE_STRATEGY=return_best

CODE_SEARCH_TOP_K=8
CODE_INDEX_MAX_FILE_BYTES=200000
CODE_INDEX_MAX_FILES=240
CODE_INDEX_ENABLE_GIT_DIFF=true
CODE_INDEX_SUPPORTED_LANGUAGES=python,typescript,javascript,tsx,jsx,vue

SEARCH_PROVIDER=duckduckgo
SEARCH_MAX_RESULTS_PER_QUERY=6
SEARCH_TIMEOUT_SECONDS=8
TAVILY_API_KEY=
INTERVIEW_SESSION_TTL_MINUTES=30
```

重点说明：

- `LLM_BASE_URL`：OpenAI 兼容服务地址
- `OPENAI_MODEL`：多 Agent 文本生成模型
- `EMBEDDING_MODEL`：代码向量检索模型
- `RESUME_SCORE`：简历评审达标线
- `RESUME_MAX_ATTEMPTS`：简历最大重写次数
- `RESUME_FAILURE_STRATEGY`：未达标时返回最好版本还是严格失败
- `CODE_INDEX_ENABLE_GIT_DIFF`：是否启用 Git 增量同步
- `SEARCH_PROVIDER`：面试资料搜索提供方
- `INTERVIEW_SESSION_TTL_MINUTES`：面试官会话过期时间

## API 概览

### `GET /api/health`

健康检查。

### `POST /api/v1/resume/generate`

同步生成简历，返回：

- `markdown`
- `used_llm`
- `project_summaries`

### `POST /api/v1/resume/generate/stream`

流式生成简历，按 NDJSON 输出阶段事件，适合前端加载页实时展示。

### `POST /api/v1/interview/prepare`

基于最终编辑后的 Markdown、表单数据和项目路径，创建面试准备会话，返回：

- `session_id`
- `target_role`
- `resources`
- `opening_message`
- `first_question`

### `POST /api/v1/interview/chat`

基于 `session_id` 继续与面试官 Agent 对话，返回下一轮追问内容。

## 当前更适合的使用方式

这个项目最适合下面几类场景：

- 计算机专业学生准备校招或实习简历
- 想把本地项目真正“读懂后再写进简历”
- 想在写完简历后，继续围绕源码做面试深挖准备

如果你希望继续扩展，当前最值得做的方向通常是：

- 进一步增强量化证据提取
- 把 RAG 做成更强的项目级混合重排
- 增加面试官多轮追问中的项目切换可视化