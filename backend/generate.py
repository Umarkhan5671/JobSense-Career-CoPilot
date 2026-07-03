import os
import json
import re
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import FAISS
from schema import CareerReport


def get_groq_key():
    """Read API key from .env."""
    return os.getenv("GROQ_API_KEY")


def generate_report(cv_store_or_context, jd_store: FAISS) -> dict:
    """
    Cross-query both FAISS stores or use direct database context, and generate a structured career report.
    Uses Groq with Llama 3.3 70B.
    """
    # Verify key first
    api_key = get_groq_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please add it to your .env file.")

    # Step 1 — retrieve relevant chunks from BOTH vector stores
    if isinstance(cv_store_or_context, str):
        cv_context = cv_store_or_context
    else:
        cv_chunks = cv_store_or_context.similarity_search(
            "skills experience projects education background achievements", k=6
        )
        cv_context = "\n\n".join([c.page_content for c in cv_chunks])

    jd_chunks = jd_store.similarity_search(
        "required skills qualifications responsibilities experience", k=6
    )
    jd_context = "\n\n".join([c.page_content for c in jd_chunks])

    # Step 2 — build prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a senior technical recruiter and career coach with 10 years of experience.
Carefully analyse the candidate CV against the job description below.

CV CONTENT:
{cv_context}

JOB DESCRIPTION:
{jd_context}

Return ONLY a valid JSON object with exactly these keys — no markdown, no explanation, just JSON:

{{
  "match_score": <integer 0-100>,
  "score_justification": "<brief 1-2 sentence justification explaining why this score was given based on key matches or gaps>",
  "matched_skills": [<list of specific technologies/skills the candidate has that the JD wants>],
  "missing_skills": [<list of specific skills/technologies the JD requires but candidate lacks>],
  "strengths": [<list of exactly 3 strings — specific strengths to highlight in the interview>],
  "rewritten_bullets": [<list of exactly 3 strings — improved CV bullet points tailored to this JD, starting with strong action verbs>],
  "interview_talking_points": [<list of exactly 5 strings — concrete things to say in the interview>]
}}

Rules:
- Be specific — name actual technologies, not vague categories like "programming"
- rewritten_bullets must start with a strong action verb (Built, Designed, Led, Reduced, Increased)
- match_score must reflect realistic fit based on this strict rubric:
  * 0–40: Very poor match — major skill/experience gaps, most JD requirements are missing.
  * 41–60: Below average — candidate has some relevant background but significant gaps exist.
  * 61–75: Moderate match — a reasonable candidate but missing several important requirements.
  * 76–89: Good match — most requirements are met with minor gaps.
  * 90–100: Excellent match — candidate meets nearly all or all requirements.
- Do not round to a convenient number. Do not give an artificially encouraging score. Score strictly based on what the CV actually demonstrates versus what the JD requires.
- Do NOT wrap in markdown code fences"""),
        ("human", "Generate the career gap analysis report now.")
    ])

    # Step 3 — call Groq
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        temperature=0.2,
        max_tokens=1024,
        api_key=api_key
    )

    chain = prompt | llm
    response = chain.invoke({
        "cv_context": cv_context,
        "jd_context": jd_context
    })

    # Step 4 — parse JSON safely
    raw = response.content.strip()

    # Strip markdown fences if Llama wraps output anyway
    raw = re.sub(r'```(?:json)?|```', '', raw).strip()

    # Extract JSON object if there's extra text around it
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        raw = json_match.group()

    try:
        data = json.loads(raw)
        report = CareerReport(**data)
        return report.model_dump()
    except Exception as e:
        # Return a safe fallback so the UI never crashes
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "strengths": [f"Error generating report: {str(e)}"],
            "rewritten_bullets": [f"Raw response: {raw[:300]}"],
            "interview_talking_points": ["Please try again — Groq occasionally has hiccups"]
        }

def generate_comparison(user_resume_text: str, other_resume_text: str) -> dict:
    """Deep comparison between user default resume text and peer/competitor resume text using Groq."""
    api_key = get_groq_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please add it to your .env file.")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a senior executive recruiter and career strategist.
Compare the Candidate's Master Resume against the Peer/Competitor Resume provided.
Deeply analyze both documents across four dimensions:
1. Relative Strengths/Advantages: Specific qualifications, experiences, or achievements the candidate possesses that outshine the peer.
2. Gaps: Areas where the peer has superior skills, qualifications, or experience.
3. Formatting and Structure: Visual organization, clarity, layout logic, and template quality.
4. Writing and Grammar: Professional tone, action-verb usage, spelling, grammar, and writing impact.

Return ONLY a valid JSON object matching this structure:
{{
  "summary": "<overall summary sentence comparing candidate to peer>",
  "user_advantages": ["<advantage 1>", "<advantage 2>", "<advantage 3>"],
  "user_gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "formatting_comparison": "<detailed formatting comparison paragraph>",
  "grammar_quality_comparison": "<detailed grammar/writing style quality comparison paragraph>",
  "user_formatting_rating": 80,
  "other_formatting_rating": 75,
  "user_grammar_rating": 85,
  "other_grammar_rating": 80,
  "user_skills_rating": 90,
  "other_skills_rating": 85,
  "user_experience_rating": 85,
  "other_experience_rating": 80,
  "user_overall_rating": 85,
  "other_overall_rating": 80
}}

Rules:
- Be highly critical and objective.
- Keep ratings realistic (e.g. 50-95 depending on quality).
- Do not wrap in markdown fences.
"""),
        ("human", "CANDIDATE MASTER RESUME:\n{user_text}\n\nPEER/COMPETITOR RESUME:\n{other_text}")
    ])

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        temperature=0.2,
        max_tokens=1500,
        api_key=api_key
    )

    chain = prompt | llm
    try:
        response = chain.invoke({
            "user_text": user_resume_text,
            "other_text": other_resume_text
        })

        raw = response.content.strip()
        raw = re.sub(r'```(?:json)?|```', '', raw).strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()

        return json.loads(raw)
    except Exception as e:
        return {
            "summary": f"Failed to compare resumes: {str(e)}",
            "user_advantages": ["Error generating advantages"],
            "user_gaps": ["Error generating gaps"],
            "formatting_comparison": "Error analyzing formatting.",
            "grammar_quality_comparison": "Error analyzing writing quality.",
            "user_formatting_rating": 0,
            "other_formatting_rating": 0,
            "user_grammar_rating": 0,
            "other_grammar_rating": 0,
            "user_skills_rating": 0,
            "other_skills_rating": 0,
            "user_experience_rating": 0,
            "other_experience_rating": 0,
            "user_overall_rating": 0,
            "other_overall_rating": 0
        }

import logging
logger = logging.getLogger("jobsense-backend")

def convert_structured_resume_to_text(res: dict) -> str:
    parts = []
    contact = res.get("contact_info", {}) or {}
    parts.append(f"Name: {contact.get('name', '')}")
    parts.append(f"Title: {contact.get('title', '')}")
    parts.append(f"Summary: {res.get('professional_summary', '')}")
    
    parts.append("Work Experience:")
    for exp in res.get("work_experience", []):
        bullets = "\n- ".join(exp.get("bullets", []))
        parts.append(f"Job: {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('dates', '')})\n- {bullets}")
        
    parts.append("Education:")
    for edu in res.get("education", []):
        parts.append(f"Degree: {edu.get('degree', '')} in {edu.get('field', '')} at {edu.get('institution', '')} ({edu.get('dates', '')})")
        
    parts.append(f"Skills: {', '.join(res.get('skills', []) or [])}")
    parts.append(f"Certifications: {', '.join(res.get('certifications', []) or [])}")
    return "\n\n".join(parts)

def tailor_resume_llm(structured_resume: dict, job_description: str, missing_skills: list, rewritten_bullets: list, attempt: int = 1) -> dict:
    """Uses LLM to tailor the structured resume content to better align with the JD, close gaps, and replace weak bullets."""
    api_key = get_groq_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set.")
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a master resume writer. Your job is to tailor the candidate's structured resume to align with the provided Job Description.

Specifically, you must:
1. Swap and replace original work experience bullets with their corresponding improved/rewritten version from the provided list: {rewritten_bullets}. Identify original bullets that match the theme/context of the rewritten ones, and swap them out directly. Do not duplicate bullets.
2. Aggressively incorporate these missing skills/keywords naturally: {missing_skills}. Weave them into the "professional_summary" and relevant experience bullets where they are logically/technically inferable, and append them to the "skills" list.
3. Rewrite the "professional_summary" to front-load the most relevant skills and keywords from the Job Description, establishing candidate authority.
4. Keep the output as a valid JSON object matching the input structure exactly.

IMPORTANT rules:
1. Do NOT fabricate fake jobs or achievements.
2. Ground your edits in the candidate's actual background.
3. Keep the JSON structure exactly as below:

JSON structure:
{{
  "contact_info": {{
    "name": "<name>",
    "title": "<title>",
    "email": "<email>",
    "phone": "<phone>",
    "location": "<location>",
    "website": "<website>"
  }},
  "professional_summary": "<summary>",
  "work_experience": [
    {{
      "title": "<job title>",
      "company": "<company>",
      "dates": "<dates>",
      "bullets": ["<bullet 1>", "<bullet 2>"]
    }}
  ],
  "education": [
    {{
      "degree": "<degree>",
      "field": "<field>",
      "institution": "<institution>",
      "dates": "<dates>"
    }}
  ],
  "skills": ["<skill 1>", "<skill 2>"],
  "certifications": ["<cert 1>", "<cert 2>"]
}}

Do NOT wrap in markdown fences. Do NOT return any markdown, just valid JSON. Any fields in the input that are not related to formatting should be copied verbatim."""),
        ("human", "CANDIDATE STRUCTURED RESUME:\n{resume_json}\n\nJOB DESCRIPTION:\n{jd_text}")
    ])
    
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        temperature=0.25,
        max_tokens=1800,
        api_key=api_key
    )
    
    chain = prompt | llm
    try:
        response = chain.invoke({
            "resume_json": json.dumps(structured_resume),
            "missing_skills": ", ".join(missing_skills),
            "rewritten_bullets": ", ".join(rewritten_bullets),
            "jd_text": job_description
        })
        raw = response.content.strip()
        raw = re.sub(r'```(?:json)?|```', '', raw).strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()
        return json.loads(raw)
    except Exception as e:
        logger.error(f"Tailoring pass failed: {e}")
        return structured_resume
