# AI-Powered Query Assistant

A simple, fast, and resilient AI query assistant built with React, FastAPI, and the Google Gemini API. It features multi-turn conversational support, path-based routing, and a clean, decoupled architecture.

## Features

- **Clean UI**: Built with React and Material UI for a polished, dark-themed interface.
- **Multi-Turn Conversations**: Supports conversational context by maintaining chat history statelessly.
- **Secure Authentication**: JWT-based token authentication (`HS256`).
- **Resilient Backend**: Modular FastAPI backend with strict Pydantic validation, centralized configuration (`config.py`), and dual endpoints for both standard and Server-Sent Events (SSE) streaming completions.
- **Cloud-Ready**: All API routes are prefixed with `/api` to natively support Application Load Balancer (ALB) path-based routing in production.

## Architecture & Code Structure

The backend has been refactored from a monolithic script into a clean, maintainable structure:

```text
backend/
├── main.py            # Clean FastAPI entry point (mounts CORS & router)
├── config.py          # Centralized environment variables
├── routes/            # API endpoint definitions (/api/login, /api/query)
├── services/          # Core business logic (Gemini LLM async calls)
├── schemas/           # Pydantic data validation models
├── utils/             # Security, JWT, and Mock DB
├── requirements.txt   
└── Dockerfile         # Python 3.12-slim based lightweight container
```

## Local Setup

### Prerequisites
- Node.js (v18+)
- Python (3.12+)
- Docker (optional)

### 1. Environment Variables
Ensure you have an `.env` file at the **root** of the project (next to `.env.example`).
```env
JWT_SECRET=super_secret_test_key_change_me_in_production
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

### 2. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
```
Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Run the FastAPI server:
```bash
uvicorn main:app --reload
```
The backend will run on `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd frontend
```
Install dependencies and start the Vite dev server:
```bash
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 4. Logging In
Use the default mock credentials to log in:
- **Username**: `admin`
- **Password**: `password`

## Containerization
A highly secure, lightweight `Dockerfile` (based on `python:3.12-slim`) is provided. To build and run:
```bash
cd backend
docker build -t ai-query-assistant-backend .
docker run -p 8000:8000 --env-file ../.env ai-query-assistant-backend
```
For cloud deployment strategy, refer to `DEPLOYMENT.md`.

## Known Limitations & Trade-offs

These are deliberate simplifications appropriate for a demo/assignment context. A production system would address each of them.

| Area | Current Approach | Production Alternative |
|---|---|---|
| **JWT Storage** | Token stored in `localStorage` for simplicity | Use `httpOnly` cookies to prevent XSS-based token theft |
| **Password Hashing** | Currently for dev purposes stored as plaintext | Can use `passlib`/`bcrypt` — passwords are never stored as plain text |
| **User Store** | Hardcoded `MOCK_USERS` dict in `security.py` | Persist users in a database (e.g. PostgreSQL) with hashed passwords |
| **Rate Limiting** | No rate limiting on `/api/query` | Add per-IP or per-user rate limiting (e.g. `slowapi`) to prevent abuse |
| **HTTPS** | HTTP only in local dev | Terminate TLS at the load balancer (ACM certificate on ALB) in production |
