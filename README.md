# ⚖️ LegalAI – AI Contract Review Platform

An AI-powered Contract Review Platform that helps legal professionals and businesses analyze contracts using Artificial Intelligence. The application extracts clauses, detects risks, summarizes contracts, performs semantic search, and provides AI-powered answers using Retrieval-Augmented Generation (RAG).

---

# 🚀 Features

## 🔐 Authentication
- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Role-Based Access Control (Admin/User)
- User Profile
- Change Password

---

## 📄 Contract Management

- Upload PDF Contracts
- Store Contracts in PostgreSQL
- Extract Text from PDF
- Contract List
- Contract Details
- Delete Contracts

---

## 🤖 AI Features

- AI Contract Summary
- AI Contract Chat
- Semantic Search
- Clause Extraction
- Missing Clause Detection
- Risk Detection
- Obligation Extraction
- Renewal Alert Detection
- Source Grounded Responses (RAG)
- Groq LLM Integration

---

## 📊 Dashboard

- Total Contracts
- High Risk Contracts
- Medium Risk Contracts
- Low Risk Contracts
- Missing Clauses
- Obligations
- Renewal Alerts
- Recent Contracts

---

## 👨‍💼 Admin Dashboard

- User Management
- Active Users
- Admin Users
- Contract Statistics
- Chat Statistics
- Change User Role
- Activate/Deactivate Users

---

# 🛠 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Lucide React Icons
- CSS

---

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Passlib / bcrypt
- Pydantic

---

## AI

- LangChain
- ChromaDB
- Sentence Transformers
- Groq API
- Retrieval-Augmented Generation (RAG)

---

## Database

- PostgreSQL
- ChromaDB Vector Store

---

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# 📂 Project Structure

```
legal-ai-contract-review
│
├── backend
│   ├── api
│   ├── services
│   ├── rag
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── context
│   │   ├── services
│   │   ├── types
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── README.md
└── screenshots
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/legal-ai-contract-review.git

cd legal-ai-contract-review
```

---

# Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost/legal_ai

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60

GROQ_API_KEY=your_groq_api_key
```

Run backend

```bash
uvicorn main:app --reload
```

Backend URL

```
http://127.0.0.1:8000
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# Docker

Build

```bash
docker compose build
```

Run

```bash
docker compose up
```

---

# AI Workflow

```
Upload Contract
       │
       ▼
Extract PDF Text
       │
       ▼
Split into Chunks
       │
       ▼
Generate Embeddings
       │
       ▼
Store in ChromaDB
       │
       ▼
User Question
       │
       ▼
Semantic Search
       │
       ▼
Relevant Chunks
       │
       ▼
Groq LLM
       │
       ▼
AI Answer with Sources
```

---

# API Endpoints

## Authentication

```
POST /auth/register

POST /auth/login

GET /auth/me

PUT /auth/change-password
```

---

## Contracts

```
POST /contracts/upload

GET /contracts

GET /contracts/{id}

DELETE /contracts/{id}

POST /contracts/{id}/index
```

---

## AI

```
POST /chat

GET /chat/history/{contract_id}

DELETE /chat/history/{contract_id}

POST /search
```

---

## Dashboard

```
GET /dashboard/summary
```

---

## Admin

```
GET /admin/summary

GET /admin/users

PATCH /admin/users/{id}/role

PATCH /admin/users/{id}/status
```

---

# Screenshots

Add screenshots inside

```
screenshots/
```

Example

```
screenshots/

login.png

dashboard.png

upload.png

contracts.png

risk-dashboard.png

chat.png

search.png

profile.png

admin-dashboard.png

swagger.png
```

---

# Future Improvements

- OCR for Scanned PDFs
- Multi-language Support
- Email Notifications
- Clause Comparison
- Redlining Contracts
- Digital Signature Integration
- Kubernetes Deployment
- AWS Deployment
- Audit Logs
- AI Recommendation Engine

---

# Resume Project Description

**LegalAI – AI Contract Review Platform**

Developed a full-stack AI-powered Contract Review Platform using **React, FastAPI, PostgreSQL, ChromaDB, LangChain, and Groq LLM**. Implemented secure JWT authentication, role-based access control, PDF processing, semantic search using Retrieval-Augmented Generation (RAG), AI-powered contract chat, clause extraction, risk detection, obligation analysis, renewal alerts, admin dashboard, and Docker-based deployment.

---

# Author

**D. Venkatesh**
