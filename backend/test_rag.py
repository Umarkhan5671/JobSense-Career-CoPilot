import os
import fitz
import json
from dotenv import load_dotenv

# Load env file if it exists
load_dotenv()

def create_sample_pdf(filename="sample_cv.pdf"):
    """Create a sample resume PDF with multiple distinct layout blocks using PyMuPDF."""
    print(f"Creating block-structured sample CV PDF at: {filename}...")
    doc = fitz.open()
    page = doc.new_page()
    
    # We will write paragraph by paragraph to create multiple distinct text blocks
    y = 50
    def write_block(text, is_header=False, font_size=10, vertical_gap=8):
        nonlocal y
        font_name = "Helvetica-Bold" if is_header else "Helvetica"
        color = (0.11, 0.16, 0.42) if is_header else (0.1, 0.1, 0.1)
        
        # Use a tall trial box height to avoid clipping
        trial_height = 200
        rect = fitz.Rect(50, y, 550, y + trial_height)
        
        res = page.insert_textbox(rect, text.strip(), fontsize=font_size, fontname=font_name, color=color)
        
        # Calculate actual height used
        used_height = trial_height - res
        y += used_height + vertical_gap

    # Header block
    write_block("John Doe\nSenior Software Engineer\nEmail: john.doe@example.com | GitHub: github.com/johndoe | Phone: (555) 019-2834", False, 9.5, 12)
    
    # Summary
    write_block("SUMMARY", True, 12, 6)
    write_block("Passionate Full-Stack Engineer with 5+ years of experience building scalable web applications. Specialized in Python (Django, FastAPI), JavaScript (React, Node.js), and cloud architectures (AWS).", False, 9.5, 12)
    
    # Skills
    write_block("SKILLS", True, 12, 6)
    write_block("Python, Django, FastAPI, PostgreSQL, Redis, REST APIs, JavaScript, React, Tailwind CSS, HTML5, CSS3, Git, Docker, AWS (S3, EC2, RDS), CI/CD (GitHub Actions)", False, 9.5, 30)
    
    # Experience
    write_block("EXPERIENCE", True, 12, 6)
    write_block("Lead Software Engineer | TechCorp Inc. | 2022 - Present", False, 9.5, 4)
    write_block("- Designed and built a real-time analytics dashboard using FastAPI and React, reducing page load time by 40%.", False, 9.5, 4)
    write_block("- Migrated legacy monolithic backend to a Django-based microservices architecture, improving system scalability.", False, 9.5, 4)
    write_block("- Mentored 4 junior developers and established code review practices to improve code quality.", False, 9.5, 4)
    write_block("- Managed PostgreSQL database performance optimization, reducing query times by 25%.", False, 9.5, 12)
    
    # Education
    write_block("EDUCATION", True, 12, 6)
    write_block("B.S. in Computer Science | University of Technology | 2016 - 2020", False, 9.5, 8)
    
    doc.save(filename)
    doc.close()
    print("Block-structured sample CV PDF created successfully!")


def run_pipeline_test():
    """Test the complete RAG backend pipeline locally if GROQ_API_KEY is available."""
    cv_filename = "sample_cv.pdf"
    if not os.path.exists(cv_filename):
        create_sample_pdf(cv_filename)

    job_description = """
Job Title: Senior Full-Stack Developer (Python & React)
Location: Remote

We are looking for a Senior Full-Stack Developer to join our team. You will lead the development of our AI-driven SaaS platform.

Requirements:
- Strong experience with Python (FastAPI or Django)
- Expertise in React.js and modern styling (Tailwind CSS)
- Experience with relational databases, specifically PostgreSQL
- Proficiency with Docker containerization
- Good understanding of cloud platforms like AWS
- Excellent communication skills and leadership potential

Nice to have:
- Experience with Vector Databases (FAISS, Chroma) or RAG systems
- Experience with Groq or Llama models
"""

    print("\n" + "="*50)
    print("TESTING INGESTION PIPELINE")
    print("="*50)
    
    from ingest import ingest_pdf, ingest_text
    from generate import generate_report
    
    try:
        print("1. Ingesting CV PDF...")
        cv_store = ingest_pdf(cv_filename)
        print("   -> CV FAISS store built successfully.")
        
        print("2. Ingesting Job Description...")
        jd_store = ingest_text(job_description)
        print("   -> JD FAISS store built successfully.")
        
        # Check for API Key
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            print("\nWARNING: GROQ_API_KEY is not configured in backend/.env.")
            print("Cannot run LLM generation test. Ingestion is fully functional.")
            return False
            
        print("3. Querying Groq Llama 3.3 model...")
        report = generate_report(cv_store, jd_store)
        print(json.dumps(report, indent=2))
        
        print("\n" + "="*50)
        print("TESTING PDF CAREER REPORT EXPORT")
        print("="*50)
        from report_export import export_report_to_pdf
        import asyncio
        
        output_pdf = "jobsense_career_report.pdf"
        print(f"Generating career report PDF using Playwright -> {output_pdf}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        pdf_bytes = loop.run_until_complete(export_report_to_pdf(report))
        
        with open(output_pdf, "wb") as f:
            f.write(pdf_bytes)
            
        print(f"   -> Success: True")
        assert os.path.exists(output_pdf), "PDF report output was not created!"
        
        # Open and check page count
        doc = fitz.open(output_pdf)
        print(f"   -> Output PDF page count: {len(doc)}")
        assert len(doc) > 0, "Generated PDF report has no pages!"
        doc.close()
        print("   -> PDF report opens and is valid.")
        
        print("\n" + "="*50)
        print("PDF REPORT EXPORT TEST COMPLETED SUCCESSFULLY!")
        print("="*50)
        return True
        
    except Exception as e:
        print(f"\nPipeline execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    run_pipeline_test()
