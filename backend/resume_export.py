import datetime
from jinja2 import Template
import asyncio

RESUME_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ resume.contact_info.name }} - Resume</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #111111;
            background-color: #ffffff;
            line-height: 1.4;
            padding: 40px;
            font-size: 10pt;
        }
        
        .header {
            text-align: center;
            margin-bottom: 12px;
        }
        
        .name {
            font-size: 24pt;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
        }
        
        .subtitle {
            font-size: 10pt;
            font-weight: 700;
            color: #333333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        
        .contact-info {
            font-size: 8.5pt;
            color: #444444;
            margin-bottom: 10px;
        }
        
        .contact-info span:not(:last-child)::after {
            content: " | ";
            margin: 0 6px;
            color: #888888;
        }
        
        .header-line {
            border: 0;
            border-top: 1.5px solid #000000;
            margin-bottom: 16px;
        }
        
        .section {
            margin-bottom: 16px;
        }
        
        .section-title {
            font-size: 10.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #000000;
            border-bottom: 1px solid #000000;
            padding-bottom: 2px;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .summary-text {
            font-size: 9.5pt;
            color: #222222;
            text-align: justify;
        }
        
        .experience-item, .education-item {
            margin-bottom: 10px;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 1px;
        }
        
        .item-title {
            font-weight: 700;
            color: #000000;
            font-size: 10pt;
        }
        
        .item-meta {
            font-size: 9pt;
            color: #222222;
            font-weight: 600;
            margin-bottom: 3px;
        }
        
        .item-dates {
            font-size: 9.5pt;
            color: #333333;
            font-weight: 400;
        }
        
        .bullets {
            margin-left: 14px;
            margin-top: 2px;
            font-size: 9pt;
            color: #222222;
            list-style-type: disc;
        }
        
        .bullets li {
            margin-bottom: 2px;
            padding-left: 2px;
        }
        
        .skills-list {
            margin-left: 14px;
            font-size: 9pt;
            color: #222222;
            list-style-type: disc;
        }
        
        .skills-list li {
            margin-bottom: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">{{ resume.contact_info.name }}</div>
        
        {% if resume.contact_info.title %}
            <div class="subtitle">{{ resume.contact_info.title }}</div>
        {% elif resume.work_experience and resume.work_experience[0].title %}
            <div class="subtitle">{{ resume.work_experience[0].title }}</div>
        {% endif %}
        
        <div class="contact-info">
            {% if resume.contact_info.location %}
                <span>{{ resume.contact_info.location }}</span>
            {% endif %}
            {% if resume.contact_info.email %}
                <span>{{ resume.contact_info.email }}</span>
            {% endif %}
            {% if resume.contact_info.phone %}
                <span>{{ resume.contact_info.phone }}</span>
            {% endif %}
            {% if resume.contact_info.linkedin %}
                <span>{{ resume.contact_info.linkedin }}</span>
            {% elif resume.contact_info.github %}
                <span>{{ resume.contact_info.github }}</span>
            {% endif %}
        </div>
        <hr class="header-line" />
    </div>

    {% if resume.professional_summary %}
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary-text">{{ resume.professional_summary }}</div>
    </div>
    {% endif %}

    {% if resume.work_experience %}
    <div class="section">
        <div class="section-title">Work Experience</div>
        {% for exp in resume.work_experience %}
        <div class="experience-item">
            <div class="item-header">
                <span class="item-title">{{ exp.title }}</span>
                <span class="item-dates">{{ exp.dates }}</span>
            </div>
            <div class="item-meta">{{ exp.company }}{% if exp.location %}, {{ exp.location }}{% endif %}</div>
            {% if exp.bullets %}
            <ul class="bullets">
                {% for bullet in exp.bullets %}
                    <li>{{ bullet }}</li>
                {% endfor %}
            </ul>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if resume.education %}
    <div class="section">
        <div class="section-title">Education</div>
        {% for edu in resume.education %}
        <div class="education-item">
            <div class="item-header">
                <span class="item-title">{{ edu.degree }}{% if edu.field %} in {{ edu.field }}{% endif %}</span>
                <span class="item-dates">Graduated: {{ edu.dates }}</span>
            </div>
            <div class="item-meta">{{ edu.institution }}</div>
            {% if edu.details %}
                <p class="summary-text" style="font-size: 9pt; margin-top: 2px;">{{ edu.details }}</p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if resume.skills %}
    <div class="section">
        <div class="section-title">Skills</div>
        <ul class="skills-list">
            {% set categorized = false %}
            {% for skill in resume.skills %}
                {% if ':' in skill %}
                    {# Hack because loop variables inside namespace are not global, but we can check if any contains colon #}
                {% endif %}
            {% endfor %}
            
            {# To make categorization check bulletproof in simple Jinja, we can check if first element contains ':' or just look for colons #}
            {% set first_skill = resume.skills[0] if resume.skills else '' %}
            {% if ':' in first_skill or ':' in resume.skills|join(' ') %}
                {% for skill in resume.skills %}
                    {% if ':' in skill %}
                        {% set parts = skill.split(':') %}
                        <li><strong>{{ parts[0] }}</strong>: {{ parts[1] }}</li>
                    {% else %}
                        <li>{{ skill }}</li>
                    {% endif %}
                {% endfor %}
            {% else %}
                {# Chunk skills into lines if it is a flat list #}
                {% set max_per_line = 6 %}
                {% for i in range(0, resume.skills|length, 6) %}
                    {% set chunk = resume.skills[i:i+6] %}
                    <li>{{ chunk | join(', ') }}</li>
                {% endfor %}
            {% endif %}
        </ul>
    </div>
    {% endif %}

    {% if resume.certifications %}
    <div class="section">
        <div class="section-title">Certifications</div>
        <ul class="skills-list">
            {% for cert in resume.certifications %}
                <li>{{ cert }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}
</body>
</html>
"""

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
        import re
        from xhtml2pdf import pisa
        import io
        
        # Preprocess HTML to replace var(--variable-name) with hardcoded values for xhtml2pdf compatibility
        declarations = re.findall(r"(--[a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)", html)
        var_map = {}
        for name, value in declarations:
            var_map[name.strip()] = value.strip()
            
        processed_html = html
        for name, value in var_map.items():
            pattern = re.compile(r"var\(\s*" + re.escape(name) + r"\s*\)", re.IGNORECASE)
            processed_html = pattern.sub(value, processed_html)
            
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(processed_html, dest=pdf_buffer)
        if pisa_status.err:
            raise RuntimeError(f"xhtml2pdf also failed: {pisa_status.err}") from playwright_err
        return pdf_buffer.getvalue()

async def export_resume_to_pdf(resume_data: dict) -> bytes:
    template = Template(RESUME_HTML_TEMPLATE)
    html_content = template.render(
        resume=resume_data
    )
    
    pdf_bytes = await asyncio.to_thread(generate_pdf_sync, html_content)
    return pdf_bytes
