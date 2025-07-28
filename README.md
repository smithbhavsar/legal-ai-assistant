# Legal AI Assistant - Complete Setup Guide

## 🎯 Project Overview

The Legal AI Assistant is an AI-powered legal guidance system for law enforcement, featuring a dual-pane chatbot, real-time legal research, and advanced retrieval-augmented generation (RAG) from internal documents.

### Key Features

- **Dual AI Workflow**: Research AI (neutral, factual) + Guidance AI (authoritative, directive)
- **Dual-Pane Chat Interface**: Side-by-side responses for research and guidance
- **Model Toggle**: Switch between Ollama (local), Perplexity API (cloud), and more
- **Session History Sidebar**: Persistent chat history and session management
**RAG from Markdown**: Extracts and embeds .md documents into FAISS (via Python) for context-aware answers
- **Citation System**: All responses include source citations and confidence levels
- **User Authentication**: Role-based access (Officer, Supervisor, Admin)
**Real-time Processing**: Server-Sent Events (SSE) for live AI status updates
- **Professional UI**: Responsive, modern Material UI design

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, Material UI, Server-Sent Events (SSE)
- **Backend**: Node.js, Express.js, JWT Authentication, SSE
- **Vector Store**: FAISS (local, for RAG, via Python FastAPI)
- **LLM Integrations**: Perplexity API (primary), Ollama (optional, local), HuggingFace Embeddings
- **Infrastructure**: Docker Compose for easy deployment

### Project Structure
```
legal-ai-assistant/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # LLM, RAG (Python scripts, FastAPI), vector store, prompts
│   │   └── config/          # Env configs
│   └── rag_documents/       # Markdown docs for RAG
├── frontend/                # React + Material UI app
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # React components
│       ├── context/         # React contexts (Auth, Chat)
│       ├── services/        # API clients
├── docker/                  # Docker configuration
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+)
2. **Ollama** with Llama 3.1 model (local LLM)
3. **Python** (for FAISS vector store and FastAPI RAG server)
4. **Git**
5. **Docker & Docker Compose** (optional)


### 1. (Optional) Install Ollama and Llama 3.1 (for local LLM)

If you want to use Ollama locally instead of Perplexity API, install and run Ollama:
```bash
# Windows: Download from https://ollama.com/download
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1
ollama serve
```


### 2. Python RAG Setup (FAISS)

Install Python dependencies:
```bash
pip install -r requirements.txt
```

#### Build the FAISS Vector Index
This will scan all markdown files in `backend/rag_documents/` and build the FAISS index and chunk files:
```bash
cd backend/src/services
python rag_pdf_loader.py
```

#### Start the FastAPI RAG Server
This will serve the `/search` endpoint for the Node backend to call:
```bash
cd backend/src/services
uvicorn rag_api:app --host 0.0.0.0 --port 5000
```
You should see FastAPI running at http://localhost:5000//docs

### 3. Clone and Setup Project

```bash
git clone <your-repo-url>
cd legal-ai-assistant
npm run install-all
```

### 4. Environment Configuration

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys and config
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env if needed
```

See `.env.example` in each folder for required variables:
- **Backend**: Perplexity, HuggingFace, Ollama, JWT, ChromaDB configs
- **Frontend**: API URL, WebSocket URL

### 5. Start Development Servers

**Option A: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - Python RAG API (FastAPI)
cd backend/src/services
uvicorn rag_api:app --host 0.0.0.0 --port 8002
```

**Option B: Concurrent Start**
```bash
npm run dev
```

**Option C: Docker Compose**
```bash
cd docker
docker-compose up -d
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🧩 Features Overview

- **Dual-Pane Chat**: Research and Guidance AI responses side-by-side
- **Session History Sidebar**: Persistent chat sessions, easy navigation
- **Model Toggle**: Switch between Ollama, Perplexity, etc. in chat
- **RAG from Markdown**: .md files in `backend/rag_documents/` are embedded into FAISS for context-aware answers
- **FAISS Integration**: Local vector store (Python) for fast, private retrieval
- **Citations & Confidence**: Every answer includes sources and confidence badges
- **Role-Based Auth**: Officer, Supervisor, Admin

## 🛠️ Environment Variables

See `.env.example` in both `backend/` and `frontend/` for all required variables. Key variables include:
- `PERPLEXITY_API_KEY` (backend)
- `HF_API_KEY` (backend)
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL` (backend)
- `JWT_SECRET` (backend)
- `REACT_APP_API_URL`, `REACT_APP_WS_URL` (frontend)
- `RAG_API_URL` (backend, e.g. http://localhost:8002)

## 🧪 Testing & Troubleshooting

- **Backend**: `cd backend && npm test`
- **Frontend**: `cd frontend && npm test`
- **Ollama**: `curl http://localhost:11434/api/tags`
- **ChromaDB**: Visit http://localhost:8000/docs for API docs

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

MIT License. For educational and research use.

---

**Happy coding! 🎉**