# 🚀 JobSense — AI-Powered Career Co-Pilot

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-blueviolet?style=for-the-badge&logo=vercel)](https://jobsense-ai.vercel.app)
[![Railway Deployment](https://img.shields.io/badge/Backend-Railway-blue?style=for-the-badge&logo=railway)](https://jobsense-career-copilot-production.up.railway.app/api/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**JobSense** is a state-of-the-art, AI-powered career platform designed to help job seekers optimize their resumes, generate cover letters, and maximize their ATS match scores. Built as part of **Bootcamp 6.0**, JobSense uses advanced Large Language Models and Retrieval-Augmented Generation (RAG) to compare, score, and rewrite resumes to align perfectly with target job descriptions.

---

## ✨ Key Features

*   **📊 Honest ATS Match Scoring**: Instantly evaluates your resume against any job description, providing a detailed match score, specific experience gaps, keyword requirements, and structured justifications.
*   **✍️ Verification-Driven Resume Tailoring**: A multi-pass AI optimization pipeline powered by Llama 3.3 that refines resume bullet points to match the target job description. The backend performs a self-correcting evaluation pass to guarantee a **minimum +15% score improvement**.
*   **📄 High-Fidelity PDF Generation**: Renders and downloads tailored resumes, cover letters, and comparative career reports directly to PDF. Uses Playwright for browser rendering with a resilient, CSS-variable-preprocessed `xhtml2pdf` pure-Python fallback.
*   **🗄️ Secure Profile & Resume Vault**: Backed by Supabase Auth and Database, users can upload a default Master Resume, manage custom avatars, and review previous analysis history securely.
*   **📱 Premium Responsive UX**: Built with React and Framer Motion, featuring a collapsible rail sidebar for desktop, a fully responsive overlay drawer for mobile screens, and a sleek glassmorphic dark-mode design system.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (Local)
- **Vector Database**: FAISS (Facebook AI Similarity Search)
- **LLM Engine**: Groq API (running `meta-llama/llama-3.3-70b-versatile` & `meta-llama/llama-3.1-8b-instant`)
- **PDF Extraction**: PyMuPDF (`fitz`)
- **PDF Generation**: Playwright (Headless Chromium) / `xhtml2pdf`

### Database & Auth
- **Provider**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT flow)
- **Storage**: Supabase Storage (avatars & master resumes)

---

## 🏗️ System Architecture Flow

```
[User Uploads PDF] ➔ [PyMuPDF Parser] ➔ [FAISS Local Vector Store] 
                                                    │
[Job Description] ➔ [Bi-Encoder Sentence-Transformers Embedding]
                                                    │
                                                    ▼
[Groq LLM Llama 3.3] ➔ [Multi-Pass Verification / Self-Correcting Loop]
                                                    │
                                                    ▼
   ┌────────────────────────────────────────────────┴──────────────────────────────┐
   ▼                                                ▼                              ▼
[Tailored Resume PDF]                      [Cover Letter PDF]           [Career Match Report]
```

---

## ⚙️ Installation & Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase Account
- Groq API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000/api
   ```
4. Run the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com) with custom redirects to map SPA routes.
- **Backend**: Containerized and deployed on [Railway](https://railway.app) via `nixpacks` with a persistent custom cache for Playwright Chromium binaries.

---

## 🎓 Mentors & Acknowledgements

This practice project was developed during the starting phase of **Bootcamp 6.0** as a foundation for building commercial-grade SaaS applications. 

Special thanks to our mentors:
- **Sir Qasim**
- **Sir Hamza**

Thank you both for your constant support, mentorship, and guidance throughout this journey!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
