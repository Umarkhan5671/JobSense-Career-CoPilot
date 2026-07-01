# JobSense — AI Career Coach (FastAPI Backend)

This is the FastAPI-based backend API for **JobSense — AI Career Coach**. It parses uploaded CV PDFs, splits and embeds both the CV and job description documents locally, retrieves relevant matching context, and prompts Groq's Llama 3.3 70B model to return a structured Career Report.

## Technologies
- **FastAPI**: API framework.
- **FAISS (local, CPU)**: Vector store for semantic similarity.
- **HuggingFace Embeddings**: Local embeddings (`all-MiniLM-L6-v2`) cached locally.
- **PyMuPDF**: Parsing text out of CV PDFs.
- **Pydantic v2**: Career Report schema validation.
- **Langchain**: LCEL chain orchestration.

## Installation & Running

1. **Create and Activate a Virtual Environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   - Copy `.env.example` to `.env`.
   - Put your Groq API key in the `.env` file:
     ```env
     GROQ_API_KEY=gsk_your_actual_groq_api_key
     ```

4. **Run the Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.
