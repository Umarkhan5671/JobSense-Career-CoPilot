import os
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv

# Load env variables at the very beginning
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jobsense-backend")

# Fail fast at startup if GROQ_API_KEY is missing
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    # Print a clear, loud message to console and exit/raise error
    error_msg = "\n" + "="*80 + "\nCRITICAL ERROR: GROQ_API_KEY is not defined in the environment or .env file.\nPlease create a backend/.env file and set GROQ_API_KEY=your_key_here\n" + "="*80 + "\n"
    logger.error(error_msg)
    # We will raise RuntimeError to prevent the app from starting up if key is missing
    raise RuntimeError("GROQ_API_KEY is missing. Check your .env file.")

# Import ingest and generate after env check
from ingest import ingest_pdf, ingest_text
from generate import generate_report

app = FastAPI(
    title="JobSense — AI Career Coach API",
    description="Backend API for JobSense Career Coach using FastAPI and local FAISS vector stores.",
    version="1.0.0"
)

# Enable CORS for frontend development servers
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Fallback-Applied"],
)


@app.get("/api/health")
def health_check():
    """Verify that backend is online and Groq API key is configured."""
    return {
        "status": "healthy",
        "groq_configured": bool(os.getenv("GROQ_API_KEY"))
    }


@app.post("/api/analyze")
async def analyze_career_fit(
    cv_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Accepts CV PDF file and Job Description.
    Ingests both into separate FAISS vector stores,
    queries LLM via Groq, and returns CareerReport.
    """
    logger.info(f"Received career analysis request. CV filename: {cv_file.filename}")

    # Validate file type
    if not cv_file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported for CV upload."
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    # Save uploaded CV PDF to a temporary file
    temp_pdf = None
    try:
        suffix = os.path.splitext(cv_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await cv_file.read()
            tmp.write(content)
            temp_pdf_path = tmp.name
        
        logger.info(f"Successfully saved uploaded CV to temporary path: {temp_pdf_path}")

        # Build FAISS vector stores
        try:
            logger.info("Ingesting CV PDF...")
            cv_store = ingest_pdf(temp_pdf_path)
            
            logger.info("Ingesting Job Description...")
            jd_store = ingest_text(job_description)
        except ValueError as ve:
            logger.error(f"Ingestion ValueError: {str(ve)}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(ve)
            )
        except Exception as e:
            logger.error(f"Ingestion unexpected error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error parsing documents. Make sure the PDF is readable and not password-protected."
            )

        # Generate RAG report
        try:
            logger.info("Generating Career Report via RAG...")
            report = generate_report(cv_store, jd_store)
            logger.info("Career Report generated successfully!")
            return report
        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Career Coach service error: {str(e)}"
            )

    finally:
        # Clean up temporary PDF file
        if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
                logger.info(f"Cleaned up temporary PDF file: {temp_pdf_path}")
            except Exception as cleanup_err:
                logger.error(f"Failed to remove temporary file {temp_pdf_path}: {cleanup_err}")


import json

def remove_file_safely(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"Removed temporary file: {path}")
    except Exception as err:
        logger.error(f"Failed to remove temporary file {path}: {err}")

@app.post("/api/export-report")
async def export_report(
    report_data: dict,
    background_tasks: BackgroundTasks
):
    """
    Accepts report JSON and returns a generated PDF file response.
    """
    logger.info("Received request to export career report to PDF.")
    try:
        from report_export import export_report_to_pdf
        pdf_bytes = await export_report_to_pdf(report_data)
        
        # Save to a temporary file so FileResponse can stream it
        temp_pdf_fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(temp_pdf_fd)
        
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Register cleanup background task
        background_tasks.add_task(remove_file_safely, temp_pdf_path)
        
        return FileResponse(
            path=temp_pdf_path,
            filename="jobsense_career_report.pdf",
            media_type="application/pdf"
        )
        
    except Exception as e:
        logger.error(f"Failed to export report PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting PDF report: {str(e)}"
        )


# Custom global exception handlers to keep errors user-friendly
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def custom_general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )
