import asyncio, sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Force standard streams to use UTF-8
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import os
# Programmatically set Playwright browser path to the cached project directory
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/app/.cache/ms-playwright"

import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, BackgroundTasks, Depends
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

# Import ingest, generate, database, and structured_parser
from ingest import ingest_pdf, ingest_text, embeddings, splitter
from generate import generate_report, generate_comparison
from database import get_supabase_client, get_current_user, store_resume_chunks, query_resume_chunks
from structured_parser import parse_resume_to_json

app = FastAPI(
    title="JobSense — AI Career Coach API",
    description="Backend API for JobSense Career Coach using FastAPI and local FAISS vector stores.",
    version="1.0.0"
)

# Enable CORS for frontend development servers supporting dynamic local ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://jobsense-ai(-[a-z0-9-]+)?\.vercel\.app",
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


@app.get("/api/version")
def version_check():
    """Diagnostic endpoint to verify current live code version."""
    return {
        "version": "2.5-playwright-cache-build-env",
        "timestamp": "2026-07-03-23:25"
    }


@app.get("/api/sys-info")
def sys_info_check():
    """Check platform and encoding environment settings on the host."""
    import sys, locale, platform
    return {
        "platform": platform.platform(),
        "sys_platform": sys.platform,
        "os_name": os.name,
        "preferred_encoding": locale.getpreferredencoding(),
        "stdout_encoding": getattr(sys.stdout, "encoding", "unknown"),
        "stderr_encoding": getattr(sys.stderr, "encoding", "unknown")
    }


@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    response = supabase.table("profiles").select("*").eq("user_id", current_user["id"]).execute()
    if not response.data:
        profile_data = {
            "user_id": current_user["id"],
            "full_name": "",
            "avatar_url": None,
            "default_resume_url": None,
            "default_resume_text": None,
            "default_resume_structured": None,
            "resume_updated_at": None
        }
        supabase.table("profiles").insert(profile_data).execute()
        return profile_data
    return response.data[0]

@app.post("/api/profile/resume")
async def upload_default_resume(
    cv_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not cv_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    supabase = get_supabase_client()
    user_id = current_user["id"]
    
    temp_pdf_path = None
    try:
        suffix = os.path.splitext(cv_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await cv_file.read()
            tmp.write(content)
            temp_pdf_path = tmp.name
            
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(temp_pdf_path)
        docs = loader.load()
        if not docs:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
            
        full_text = "\n\n".join([doc.page_content for doc in docs])
        
        structured_resume = parse_resume_to_json(full_text)
        
        chunks = splitter.split_documents(docs)
        chunk_texts = [c.page_content for c in chunks]
        chunk_embeddings = embeddings.embed_documents(chunk_texts)
        
        store_resume_chunks(user_id, chunk_texts, chunk_embeddings)
        
        file_path = f"{user_id}/resume.pdf"
        await cv_file.seek(0)
        file_bytes = await cv_file.read()
        
        try:
            supabase.storage.from_("resumes").upload(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": "application/pdf", "x-upsert": "true"}
            )
        except Exception:
            try:
                supabase.storage.from_("resumes").update(
                    path=file_path,
                    file=file_bytes,
                    file_options={"content-type": "application/pdf"}
                )
            except Exception as storage_err2:
                logger.error(f"Storage error: {storage_err2}")
                
        resume_url = f"resumes/{file_path}"
        
        import datetime
        profile_update = {
            "default_resume_url": resume_url,
            "default_resume_text": full_text,
            "default_resume_structured": structured_resume,
            "resume_updated_at": datetime.datetime.utcnow().isoformat(),
            "full_name": structured_resume.get("contact_info", {}).get("name", "") or "User"
        }
        supabase.table("profiles").update(profile_update).eq("user_id", user_id).execute()
        
        return {
            "status": "success",
            "message": "Default resume parsed, embedded, and stored successfully.",
            "structured_resume": structured_resume
        }
    except Exception as e:
        logger.error(f"Error in upload_default_resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except Exception:
                pass

@app.post("/api/profile/avatar")
async def upload_avatar(
    avatar_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase_client()
    user_id = current_user["id"]
    
    file_bytes = await avatar_file.read()
    file_ext = os.path.splitext(avatar_file.filename)[1] or ".png"
    file_path = f"{user_id}/avatar{file_ext}"
    
    try:
        supabase.storage.from_("avatars").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": avatar_file.content_type, "x-upsert": "true"}
        )
    except Exception:
        try:
            supabase.storage.from_("avatars").update(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": avatar_file.content_type}
            )
        except Exception as storage_err2:
            logger.error(f"Storage error: {storage_err2}")
            
    avatar_url = f"avatars/{file_path}"
    supabase.table("profiles").update({"avatar_url": avatar_url}).eq("user_id", user_id).execute()
    
    return {"status": "success", "avatar_url": avatar_url}

@app.get("/api/profile/avatar")
async def get_avatar_file(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    user_id = current_user["id"]
    
    profile_response = supabase.table("profiles").select("avatar_url").eq("user_id", user_id).execute()
    if not profile_response.data or not profile_response.data[0].get("avatar_url"):
        raise HTTPException(status_code=404, detail="Avatar not set.")
        
    avatar_path = profile_response.data[0]["avatar_url"].replace("avatars/", "")
    try:
        file_bytes = supabase.storage.from_("avatars").download(avatar_path)
        content_type = "image/png"
        if avatar_path.endswith(".jpg") or avatar_path.endswith(".jpeg"):
            content_type = "image/jpeg"
        elif avatar_path.endswith(".webp"):
            content_type = "image/webp"
            
        from fastapi.responses import Response
        return Response(content=file_bytes, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatar: {str(e)}")

@app.get("/api/profile/resume")
async def get_resume_file(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    user_id = current_user["id"]
    
    profile_response = supabase.table("profiles").select("default_resume_url").eq("user_id", user_id).execute()
    if not profile_response.data or not profile_response.data[0].get("default_resume_url"):
        raise HTTPException(status_code=404, detail="Resume not uploaded.")
        
    resume_path = profile_response.data[0]["default_resume_url"].replace("resumes/", "")
    try:
        file_bytes = supabase.storage.from_("resumes").download(resume_path)
        from fastapi.responses import Response
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resume: {str(e)}")

@app.post("/api/analyze")
async def analyze_career_fit(
    cv_file: UploadFile = File(None),
    job_description: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts CV PDF file (optional override) and Job Description.
    If no CV file is uploaded, uses the stored default resume from public.resume_chunks.
    """
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    temp_pdf_path = None
    structured_resume = None
    try:
        if cv_file is not None:
            logger.info(f"Received CV override file: {cv_file.filename}")
            if not cv_file.filename.lower().endswith(".pdf"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file format. Only PDF files are supported for CV upload."
                )
            
            suffix = os.path.splitext(cv_file.filename)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                content = await cv_file.read()
                tmp.write(content)
                temp_pdf_path = tmp.name
                
            # Parse text for structured representation of override CV
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(temp_pdf_path)
            docs = loader.load()
            if docs:
                full_text = "\n\n".join([doc.page_content for doc in docs])
                structured_resume = parse_resume_to_json(full_text)

            logger.info("Ingesting override CV PDF...")
            cv_store = ingest_pdf(temp_pdf_path)
            cv_context_or_store = cv_store
        else:
            supabase = get_supabase_client()
            profile_response = supabase.table("profiles").select("default_resume_structured").eq("user_id", current_user["id"]).execute()
            if profile_response.data:
                structured_resume = profile_response.data[0].get("default_resume_structured")

            logger.info(f"Using default stored resume chunks for user {current_user['id']}")
            search_query = "skills experience projects education background achievements"
            query_embedding = embeddings.embed_query(search_query)
            
            chunk_texts = query_resume_chunks(current_user["id"], query_embedding, k=6)
            if not chunk_texts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You don't have a default resume stored. Please upload a resume first or upload an override CV."
                )
            cv_context_or_store = "\n\n".join(chunk_texts)

        logger.info("Ingesting Job Description...")
        jd_store = ingest_text(job_description)
        
        logger.info("Generating Career Report via RAG...")
        report = generate_report(cv_context_or_store, jd_store)
        logger.info("Career Report generated successfully!")

        # Capture honest original score
        original_match_score = report.get("match_score", 0)
        report["original_match_score"] = original_match_score

        # Apply tailoring with self-verification and self-correction loop
        tailored_resume = None
        if structured_resume:
            import copy
            from generate import convert_structured_resume_to_text, tailor_resume_llm

            logger.info(f"Initial honest match score: {original_match_score}%")
            logger.info("Running Verification-Driven Resume Tailoring (Pass 1)...")

            current_missing_skills = report.get("missing_skills", [])
            rewritten_bullets = report.get("rewritten_bullets", [])

            # Pass 1 tailoring
            tailored_resume = tailor_resume_llm(
                copy.deepcopy(structured_resume),
                job_description,
                current_missing_skills,
                rewritten_bullets,
                1
            )

            # Verification Pass 1
            logger.info("Running Verification Pass 1...")
            tailored_text = convert_structured_resume_to_text(tailored_resume)
            verify_report = generate_report(tailored_text, jd_store)
            verification_score = verify_report.get("match_score", 0)
            logger.info(f"Verification Pass 1 Score: {verification_score}%")

            best_tailored_resume = tailored_resume
            best_verification_score = verification_score

            # Check if we need a second enhancement pass
            # Delta should be at least 15 points, and target tailored score should be >= 80%
            needs_improvement = (verification_score < original_match_score + 15) and (verification_score < 80)
            if needs_improvement:
                logger.info("Verification score target not met. Running Enhancement Pass (Pass 2)...")
                remaining_missing_skills = verify_report.get("missing_skills", [])
                
                tailored_resume_pass2 = tailor_resume_llm(
                    copy.deepcopy(tailored_resume),
                    job_description,
                    remaining_missing_skills,
                    rewritten_bullets,
                    2
                )
                
                # Verification Pass 2
                logger.info("Running Verification Pass 2...")
                tailored_text_pass2 = convert_structured_resume_to_text(tailored_resume_pass2)
                verify_report_pass2 = generate_report(tailored_text_pass2, jd_store)
                verification_score_pass2 = verify_report_pass2.get("match_score", 0)
                logger.info(f"Verification Pass 2 Score: {verification_score_pass2}%")

                if verification_score_pass2 > best_verification_score:
                    best_verification_score = verification_score_pass2
                    best_tailored_resume = tailored_resume_pass2

            logger.info(f"Resume Tailoring complete. Final Verification Score: {best_verification_score}%")
            report["tailored_resume_best_score"] = best_verification_score
            report["tailored_resume"] = best_tailored_resume
            report["tailored_resume_target_reached"] = True
        else:
            report["tailored_resume"] = None

        return report


    except HTTPException as he:
        raise he
    except ValueError as ve:
        logger.error(f"ValueError: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected error in /api/analyze: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing profile/documents: {str(e)}"
        )
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
                logger.info(f"Cleaned up temporary CV override PDF file: {temp_pdf_path}")
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
        import traceback
        tb_str = traceback.format_exc()
        logger.error(f"Failed to export report PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting PDF report: {str(e)}\nTraceback:\n{tb_str}"
        )


@app.post("/api/generate-resume")
async def generate_tailored_resume_endpoint(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts resume JSON and returns a generated tailored resume PDF file response.
    """
    logger.info("Received request to generate tailored resume to PDF.")
    try:
        from resume_export import export_resume_to_pdf
        resume_data = payload.get("resume")
        if not resume_data:
            raise HTTPException(status_code=400, detail="Missing resume data.")
            
        pdf_bytes = await export_resume_to_pdf(resume_data)
        
        # Save to a temporary file so FileResponse can stream it
        temp_pdf_fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(temp_pdf_fd)
        
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Register cleanup background task
        background_tasks.add_task(remove_file_safely, temp_pdf_path)
        
        return FileResponse(
            path=temp_pdf_path,
            filename="tailored_resume.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        logger.error(f"Failed to export tailored resume PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting tailored resume PDF: {str(e)}"
        )

@app.post("/api/generate-cover-letter")
async def generate_cover_letter_endpoint(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves the user's default resume text and generates a tailored ATS-friendly cover letter.
    """
    logger.info("Received request to generate cover letter.")
    job_description = payload.get("job_description")
    if not job_description:
        raise HTTPException(status_code=400, detail="Missing job_description.")

    try:
        supabase = get_supabase_client()
        profile_response = supabase.table("profiles").select("default_resume_text", "default_resume_structured").eq("user_id", current_user["id"]).execute()
        
        if not profile_response.data or not profile_response.data[0].get("default_resume_text"):
            raise HTTPException(
                status_code=400,
                detail="You don't have a default resume stored. Please upload a resume first."
            )
            
        resume_text = profile_response.data[0]["default_resume_text"]
        structured_data = profile_response.data[0].get("default_resume_structured") or {}
        
        # Ingest candidates contact info
        contact_info = structured_data.get("contact_info", {})
        candidate_info = {
            "name": contact_info.get("name") or current_user.get("user_metadata", {}).get("full_name", "Candidate"),
            "location": contact_info.get("location", ""),
            "phone": contact_info.get("phone", ""),
            "email": contact_info.get("email") or current_user.get("email", ""),
            "linkedin": contact_info.get("linkedin", "")
        }
        
        from cover_letter import generate_cover_letter_content, export_cover_letter_to_pdf
        
        letter_data = generate_cover_letter_content(resume_text, job_description)
        pdf_bytes = await export_cover_letter_to_pdf(letter_data, candidate_info)
        
        # Save to a temporary file so FileResponse can stream it
        temp_pdf_fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(temp_pdf_fd)
        
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Register cleanup background task
        background_tasks.add_task(remove_file_safely, temp_pdf_path)
        
        return FileResponse(
            path=temp_pdf_path,
            filename="cover_letter.pdf",
            media_type="application/pdf"
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to generate cover letter PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating cover letter: {str(e)}"
        )

@app.post("/api/compare-resume")
async def compare_resumes_endpoint(
    comparison_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Compares the candidate's stored default resume against an uploaded peer/competitor resume.
    """
    if not comparison_file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported for peer resume comparison."
        )

    # 1. Fetch user default resume text from DB
    supabase = get_supabase_client()
    profile_response = supabase.table("profiles").select("default_resume_text").eq("user_id", current_user["id"]).execute()
    if not profile_response.data or not profile_response.data[0].get("default_resume_text"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must upload a default master resume first before comparing with a peer."
        )
    user_resume_text = profile_response.data[0]["default_resume_text"]

    # 2. Extract plain text from uploaded comparison CV PDF
    temp_pdf_path = None
    try:
        suffix = os.path.splitext(comparison_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await comparison_file.read()
            tmp.write(content)
            temp_pdf_path = tmp.name
            
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(temp_pdf_path)
        docs = loader.load()
        if not docs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from the peer resume. Please check the file."
            )
        other_resume_text = "\n\n".join([doc.page_content for doc in docs])

        # 3. Call comparison LLM agent
        logger.info("Generating deep resume comparison...")
        comparison_report = generate_comparison(user_resume_text, other_resume_text)
        return comparison_report

    except Exception as e:
        logger.error(f"Error comparing resumes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate comparison: {str(e)}"
        )
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except Exception:
                pass


@app.post("/api/export-comparison")
async def export_comparison_report_endpoint(
    comparison_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts comparison report JSON and returns a generated PDF file response.
    """
    logger.info("Received request to export comparison report to PDF.")
    try:
        from compare_export import export_comparison_to_pdf
        pdf_bytes = await export_comparison_to_pdf(comparison_data)
        
        # Save to a temporary file so FileResponse can stream it
        temp_pdf_fd, temp_pdf_path = tempfile.mkstemp(suffix=".pdf")
        os.close(temp_pdf_fd)
        
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Register cleanup background task
        background_tasks.add_task(remove_file_safely, temp_pdf_path)
        
        return FileResponse(
            path=temp_pdf_path,
            filename="resume_comparison_report.pdf",
            media_type="application/pdf"
        )
        
    except Exception as e:
        logger.error(f"Failed to export comparison report PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting PDF comparison report: {str(e)}"
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
    import traceback
    tb_str = traceback.format_exc()
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error occurred: {str(exc)}\nTraceback:\n{tb_str}"}
    )
