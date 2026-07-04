import os
import json
import re
import datetime
from jinja2 import Template
import asyncio
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

COVER_LETTER_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Cover Letter - {{ name }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        html, body {
            max-height: 297mm; /* A4 height */
            overflow: hidden;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #111111;
            background-color: #ffffff;
            line-height: 1.45;
            padding: 35px 45px;
            font-size: 10pt;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .name {
            font-size: 22pt;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 4px;
        }
        
        .title {
            font-size: 9.5pt;
            font-weight: 500;
            font-style: italic;
            color: #444444;
            margin-bottom: 6px;
        }
        
        .contact-info {
            font-size: 8.5pt;
            color: #555555;
            margin-bottom: 8px;
        }
        
        .contact-info span:not(:last-child)::after {
            content: " • ";
            margin: 0 6px;
            color: #888888;
        }
        
        .header-line {
            border: 0;
            border-top: 1.5px solid #000000;
            margin-bottom: 18px;
        }
        
        .date {
            margin-bottom: 12px;
            font-size: 10pt;
            color: #111111;
        }
        
        .recipient-block {
            margin-bottom: 15px;
            font-size: 10pt;
            line-height: 1.35;
            color: #111111;
        }
        
        .recipient-line {
            margin-bottom: 2px;
        }
        
        .salutation {
            margin-bottom: 12px;
            font-size: 10pt;
            color: #111111;
        }
        
        .body-paragraph {
            margin-bottom: 12px;
            text-align: justify;
            font-size: 10pt;
            color: #111111;
            text-indent: 0;
        }
        
        .closing {
            margin-top: 18px;
            font-size: 10pt;
            color: #111111;
            line-height: 1.35;
        }
        
        .signature-name {
            margin-top: 10px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">{{ name }}</div>
        
        {% if candidate_title %}
            <div class="title">{{ candidate_title }}</div>
        {% endif %}
        
        <div class="contact-info">
            {% if location %}
                <span>{{ location }}</span>
            {% endif %}
            {% if phone %}
                <span>{{ phone }}</span>
            {% endif %}
            {% if email %}
                <span>{{ email }}</span>
            {% endif %}
            {% if linkedin %}
                <span>{{ linkedin }}</span>
            {% endif %}
        </div>
        <hr class="header-line" />
    </div>
    
    <div class="date">{{ current_date }}</div>
    
    <div class="recipient-block">
        {% if recipient_name %}
            <div class="recipient-line">{{ recipient_name }}</div>
        {% endif %}
        {% if recipient_title %}
            <div class="recipient-line">{{ recipient_title }}</div>
        {% endif %}
        {% if recipient_company %}
            <div class="recipient-line">{{ recipient_company }}</div>
        {% endif %}
        {% if recipient_address %}
            <div class="recipient-line" style="white-space: pre-line;">{{ recipient_address }}</div>
        {% endif %}
    </div>
    
    <div class="salutation">Dear {{ recipient_name or 'Hiring Manager' }},</div>
    
    {% for paragraph in body_paragraphs %}
        <p class="body-paragraph">{{ paragraph }}</p>
    {% endfor %}
    
    <div class="closing">
        Sincerely,<br />
        <div class="signature-name">{{ name }}</div>
    </div>
</body>
</html>
"""

def get_groq_key():
    return os.getenv("GROQ_API_KEY")

def generate_cover_letter_content(resume_text: str, jd_text: str) -> dict:
    """Uses Groq Llama 3.3 70B to generate structured cover letter contents."""
    api_key = get_groq_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert resume writer and career coach.
Analyze the candidate's resume and the job description below, and write a professional, highly-tailored, ATS-friendly cover letter.
Ground the cover letter in the candidate's actual experience from their resume (do not invent achievements). Incorporate relevant keywords from the JD naturally to optimize for ATS algorithms.

CRITICAL PAGE LIMIT RULE:
- The cover letter must fit on exactly ONE page.
- You must output exactly THREE body paragraphs.
- The total length of all paragraphs combined must not exceed 250 words. Keep sentences crisp, clean, and high-impact.

Your output must be a single, valid JSON object that exactly conforms to the specified schema. 
Do not include any extra text, explanations, or markdown formatting blocks.

JSON Schema format to follow:
{{
  "recipient_name": "<inferred hiring contact name e.g. John Doe, or 'Hiring Manager' if unknown>",
  "recipient_title": "<inferred title of recipient e.g. HR Director, Lead Developer, or blank if unknown>",
  "recipient_company": "<company name from job description>",
  "recipient_address": "<inferred company address/location if found in job description, otherwise blank>",
  "candidate_title": "<suggested professional title for the candidate, matching their specialization/role in the resume>",
  "body_paragraphs": [
    "<Paragraph 1: Clear, engaging hook. State the role candidate is applying for, interest in the company, and brief summary of matching value (under 60 words).>",
    "<Paragraph 2: Accomplishments from resume that directly resolve the core requirements of the job description. Quantify impact where possible (under 120 words).>",
    "<Paragraph 3: Reiterate interest, align key skills to company needs, include call to action, thank the reader, and close (under 70 words).>"
  ]
}}
"""),
        ("human", "CANDIDATE RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{jd_text}")
    ])

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        temperature=0.3,
        max_tokens=1200,
        api_key=api_key
    )

    chain = prompt | llm
    response = chain.invoke({
        "resume_text": resume_text,
        "jd_text": jd_text
    })

    raw = response.content.strip()
    raw = re.sub(r'```(?:json)?|```', '', raw).strip()
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        raw = json_match.group()

    try:
        return json.loads(raw)
    except Exception as e:
        print(f"Error parsing cover letter JSON: {e}")
        # Fallback structure
        return {
            "recipient_name": "Hiring Manager",
            "recipient_title": "",
            "recipient_company": "",
            "recipient_address": "",
            "candidate_title": "Software Engineer",
            "body_paragraphs": [
                "I am excited to apply for the open position at your company. With my background and matching achievements, I am confident I will be a strong addition to your team.",
                "Throughout my career, I have focused on solving technical challenges and driving business value.",
                "Thank you for your time and consideration. I look forward to hearing from you soon."
            ]
        }

def generate_pdf_sync(html: str) -> bytes:
    import tempfile
    import os
    import pathlib
    import logging
    from playwright.sync_api import sync_playwright
    
    try:
        temp_fd, temp_path = tempfile.mkstemp(suffix=".html")
        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
                f.write(html)
            
            file_uri = pathlib.Path(temp_path).as_uri()
            
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                page = context.new_page()
                page.goto(file_uri)
                page.evaluate("document.fonts.ready")
                pdf_bytes = page.pdf(
                    format="A4",
                    print_background=True,
                    margin={"top": "15mm", "bottom": "15mm", "left": "15mm", "right": "15mm"}
                )
                browser.close()
                return pdf_bytes
        finally:
            try:
                os.remove(temp_path)
            except Exception:
                pass
    except Exception as playwright_err:
        logging.getLogger("jobsense-backend").warning(
            f"Playwright PDF generation failed, falling back to xhtml2pdf: {playwright_err}"
        )
        from xhtml2pdf import pisa
        import io
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=pdf_buffer)
        if pisa_status.err:
            raise RuntimeError(f"xhtml2pdf also failed: {pisa_status.err}") from playwright_err
        return pdf_buffer.getvalue()

async def export_cover_letter_to_pdf(letter_data: dict, candidate_info: dict) -> bytes:
    """Renders cover letter HTML and converts it to PDF using Playwright in a worker thread."""
    template = Template(COVER_LETTER_HTML_TEMPLATE)
    
    current_date = datetime.date.today().strftime("%B %d, %Y")
    
    html_content = template.render(
        name=candidate_info.get("name", "Candidate"),
        candidate_title=letter_data.get("candidate_title", ""),
        location=candidate_info.get("location", ""),
        phone=candidate_info.get("phone", ""),
        email=candidate_info.get("email", ""),
        linkedin=candidate_info.get("linkedin", ""),
        current_date=current_date,
        recipient_name=letter_data.get("recipient_name", ""),
        recipient_title=letter_data.get("recipient_title", ""),
        recipient_company=letter_data.get("recipient_company", ""),
        recipient_address=letter_data.get("recipient_address", ""),
        body_paragraphs=letter_data.get("body_paragraphs", [])
    )
    
    pdf_bytes = await asyncio.to_thread(generate_pdf_sync, html_content)
    return pdf_bytes
