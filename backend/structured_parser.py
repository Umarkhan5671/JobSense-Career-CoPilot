import os
import json
import re
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

class ContactInfo(BaseModel):
    name: str = Field(default="")
    title: str = Field(default="")
    email: str = Field(default="")
    phone: str = Field(default="")
    location: str = Field(default="")
    website: str = Field(default="")
    linkedin: str = Field(default="")
    github: str = Field(default="")

class WorkExperienceEntry(BaseModel):
    title: str = Field(default="")
    company: str = Field(default="")
    location: str = Field(default="")
    dates: str = Field(default="")
    bullets: List[str] = Field(default_factory=list)

class EducationEntry(BaseModel):
    degree: str = Field(default="")
    field: str = Field(default="")
    institution: str = Field(default="")
    dates: str = Field(default="")
    details: str = Field(default="")

class StructuredResume(BaseModel):
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    professional_summary: str = Field(default="")
    work_experience: List[WorkExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

def parse_resume_to_json(resume_text: str) -> dict:
    """Uses Groq Llama 3.3 70B to parse raw resume text into structured JSON."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert system that extracts structured information from resume text.
Your output must be a single, valid JSON object that exactly conforms to the specified schema. 
Do not include any extra text, explanations, or markdown formatting blocks.

JSON Schema format to follow:
{{
  "contact_info": {{
    "name": "<candidate name>",
    "title": "<candidate professional title/specialization, e.g. Senior Software Engineer or pipe-separated SEO | Digital Marketer>",
    "email": "<candidate email>",
    "phone": "<candidate phone>",
    "location": "<candidate city/state/country>",
    "website": "<candidate personal website>",
    "linkedin": "<candidate linkedin url>",
    "github": "<candidate github url>"
  }},
  "professional_summary": "<brief summary paragraph or blank if none>",
  "work_experience": [
    {{
      "title": "<job title>",
      "company": "<company name>",
      "location": "<job location or blank>",
      "dates": "<dates employed e.g. 2020 - Present>",
      "bullets": ["<bullet point 1>", "<bullet point 2>"]
    }}
  ],
  "education": [
    {{
      "degree": "<degree e.g. B.S. or Bachelor>",
      "field": "<field of study e.g. Computer Science>",
      "institution": "<school or university name>",
      "dates": "<graduation date or date range>",
      "details": "<any extra details or blank>"
    }}
  ],
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "certifications": ["<certification 1>", "<certification 2>"]
}}

Rules:
- Be accurate and extract details directly from the provided text.
- Do not make up information that does not exist.
- Ensure the output is strictly valid JSON. Do not wrap it in markdown code fences.
"""),
        ("human", "Structured parse this resume text:\n\n{resume_text}")
    ])

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
        temperature=0.1,
        max_tokens=1800,
        api_key=api_key
    )

    chain = prompt | llm
    try:
        response = chain.invoke({"resume_text": resume_text})
        raw = response.content.strip()
        raw = re.sub(r'```(?:json)?|```', '', raw).strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()
        
        data = json.loads(raw)
        # Validate structure with Pydantic
        structured = StructuredResume(**data)
        return structured.model_dump()
    except Exception as e:
        print(f"Error parsing resume: {e}")
        # Return empty structured structure
        return StructuredResume().model_dump()
