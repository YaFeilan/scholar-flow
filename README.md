# AI Research Assistant (AI研究助理)

Research Assistant 是一款基于人工智能的学术研究辅助工具，旨在帮助研究人员、学生和专业人士快速阅读、理解复杂的学术论文。该应用程序部署在 Google Cloud 上运行，利用大语言模型（LLM）的能力来简化文献综述和提取信息的过程。

## ✨ 主要功能 (Features)

### 📄 PDF 文档分析
* 支持上传 PDF 格式的学术论文或研究报告。
* 自动提取并解析文本内容。

### 📝 智能摘要 (Smart Summarization)
* **TL;DR**: 生成论文的简明摘要。
* **关键要素提取**: 自动提取本文的关键发现、方法论和结论。
* **ELI5 模式**: 用“像我五岁一样”的通俗语言解释复杂的学术概念。

### 💬 互动问答 (Interactive Q&A)
* 针对上传的文档进行提问（例如：“这篇论文的主要贡献是什么？”）。
* 支持基于上下文的追问，深入理解细节。

### 🏷️ 引用生成
* 自动生成 APA, MLA, IEEE 等格式的文本引用，方便学术写作。

### 📊 数据与图表解析 (实验性)
* 尝试解释论文中的表格数据和图表趋势。

---

## 🛠️ 技术栈 (Tech Stack)

该项目采用现代 AI 应用架构构建：

* **前端/全栈框架**: Streamlit 或 React
* **Orchestration / LLM 编排**: LangChain / LlamaIndex
* **大语言模型 (LLM)**: OpenAI GPT-4o / Google Gemini Pro / Anthropic Claude
* **向量数据库**: FAISS / ChromaDB (用于 RAG 检索增强生成)
* **部署环境**: Google Cloud Run (Docker 容器化)
* **编程语言**: Python 3.10+

---

## 🚀 快速开始 (Getting Started)

如果您希望在本地运行此项目（Python 后端），请按照以下步骤操作。

### 先决条件
* Python 3.9 或更高版本
* OpenAI API Key 或 Google Gemini API Key

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone [https://github.com/your-username/ai-research-assistant.git](https://github.com/your-username/ai-research-assistant.git)
    cd ai-research-assistant
    ```

2.  **创建虚拟环境**
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  **安装依赖**
    ```bash
    pip install -r requirements.txt
    ```

4.  **配置环境变量**
    创建一个 `.env` 文件并填写您的 API 密钥：
    ```env
    OPENAI_API_KEY=sk-xxxxxxxxxxxx
    GEMINI_API_KEY=xxxxxxxxxxxx
    ```

5.  **运行应用**
    ```bash
    streamlit run app.py
    # 或者 python main.py
    ```

---

## 📖 使用指南 (前端/Node.js)

如果您使用的是 Node.js 版本的前端，请参考以下步骤：

**前提条件**：需安装 Node.js 环境。

1.  **安装依赖项**
    ```bash
    npm install
    ```

2.  **配置环境**
    在 `.env.local` 文件中设置您的 API 密钥：
    ```env
    GEMINI_API_KEY=your_gemini_key_here
    ```

3.  **运行应用程序**
    ```bash
    npm run dev
    ```

---

## 🤝 贡献 (Contribution)

欢迎任何形式的贡献！
* 请随时提交 **Pull Request**。
* 创建 **Issue** 来讨论新功能或报告 Bug。

---

## ⚠️ 免责声明

本工具生成的摘要和解释仅作为辅助参考，学术研究中请务必查证原文内容。开发者不对 AI 生成内容的准确性承担最终责任。
