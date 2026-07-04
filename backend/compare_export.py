import datetime
from jinja2 import Template
import asyncio

COMPARE_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Resume Comparison Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --indigo-600: #4f46e5;
            --indigo-700: #4338ca;
            --emerald-600: #10b981;
            --amber-600: #f59e0b;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: var(--slate-700);
            background-color: #ffffff;
            line-height: 1.5;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--slate-100);
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        
        .logo-area {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo-box {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--indigo-600), #8b5cf6);
            border-radius: 10px;
            color: #ffffff;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .logo-text {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 800;
            color: var(--slate-900);
        }
        
        .report-meta {
            text-align: right;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
        }
        
        .title-section {
            margin-bottom: 25px;
        }
        
        .title-section h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            color: var(--slate-900);
            margin-bottom: 6px;
        }
        
        .summary-card {
            background-color: var(--slate-50);
            border: 1px solid var(--slate-100);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 25px;
        }
        
        .summary-card h3 {
            font-size: 14px;
            color: var(--indigo-600);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .summary-card p {
            font-size: 14px;
            color: var(--slate-800);
            line-height: 1.6;
        }
        
        .chart-card {
            background-color: #ffffff;
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 25px;
        }
        
        .chart-card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            color: var(--slate-900);
            margin-bottom: 15px;
            border-bottom: 1px solid var(--slate-100);
            padding-bottom: 8px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .card {
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            padding: 20px;
        }
        
        .card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            color: var(--slate-900);
            margin-bottom: 12px;
            border-bottom: 1px solid var(--slate-100);
            padding-bottom: 8px;
        }
        
        .advantage-item {
            display: flex;
            gap: 10px;
            font-size: 13px;
            margin-bottom: 10px;
        }
        
        .advantage-icon {
            color: var(--emerald-600);
            font-weight: bold;
        }
        
        .gap-item {
            display: flex;
            gap: 10px;
            font-size: 13px;
            margin-bottom: 10px;
        }
        
        .gap-icon {
            color: var(--amber-600);
            font-weight: bold;
        }
        
        .metric-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        
        .metric-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--slate-800);
        }
        
        .metric-bar-container {
            width: 150px;
            height: 8px;
            background-color: var(--slate-100);
            border-radius: 4px;
            overflow: hidden;
            display: inline-block;
            margin-left: 10px;
        }
        
        .metric-bar {
            height: 100%;
            background-color: var(--indigo-600);
            border-radius: 4px;
        }
        
        .footer {
            margin-top: 40px;
            border-top: 1px solid var(--slate-100);
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-area">
            <div class="logo-box">JS</div>
            <div class="logo-text">JobSense</div>
        </div>
        <div class="report-meta">
            DATE: {{ date }}<br>
            REPORT ID: COMP-{{ year }}-RAG
        </div>
    </div>
    
    <div class="title-section">
        <h1>Resume Comparison Analysis</h1>
        <p style="font-size: 13px; color: #64748b;">Deep comparative review between your master resume and a peer benchmark.</p>
    </div>
    
    <div class="summary-card">
        <h3>Executive Summary</h3>
        <p>{{ data.summary }}</p>
    </div>
    
    <!-- 5-Axis Visual Comparison Chart -->
    <div class="chart-card">
        <h3>Visual Axis Comparison</h3>
        <div style="display: flex; justify-content: center; align-items: center; gap: 40px; padding: 10px;">
            <svg width="460" height="200" viewBox="0 0 460 200" style="background-color: var(--slate-50); border-radius: 12px; padding: 15px; border: 1px solid var(--slate-100);">
                <!-- Axis lines -->
                <line x1="55" y1="20" x2="55" y2="160" stroke="#cbd5e1" stroke-width="1.5"/>
                <line x1="55" y1="160" x2="430" y2="160" stroke="#cbd5e1" stroke-width="1.5"/>
                
                <!-- Horizontal gridlines -->
                <line x1="55" y1="90" x2="430" y2="90" stroke="#e2e8f0" stroke-dasharray="4"/>
                <line x1="55" y1="20" x2="430" y2="20" stroke="#e2e8f0" stroke-dasharray="4"/>
                
                <!-- Y Axis Ticks -->
                <text x="45" y="163" font-size="9" fill="#94a3b8" text-anchor="end" font-family="'Inter', sans-serif">0%</text>
                <text x="45" y="93" font-size="9" fill="#94a3b8" text-anchor="end" font-family="'Inter', sans-serif">50%</text>
                <text x="45" y="23" font-size="9" fill="#94a3b8" text-anchor="end" font-family="'Inter', sans-serif">100%</text>
                
                <!-- Category 1: Skills Match -->
                <rect x="75" y="{{ 160 - ((data.user_skills_rating or 75) * 1.4) }}" width="18" height="{{ (data.user_skills_rating or 75) * 1.4 }}" fill="var(--indigo-600)" rx="2"/>
                <rect x="96" y="{{ 160 - ((data.other_skills_rating or 65) * 1.4) }}" width="18" height="{{ (data.other_skills_rating or 65) * 1.4 }}" fill="#94a3b8" rx="2"/>
                <text x="94" y="176" font-size="9.5" font-weight="600" fill="var(--slate-800)" text-anchor="middle" font-family="'Inter', sans-serif">Skills</text>

                <!-- Category 2: Experience Relevance -->
                <rect x="145" y="{{ 160 - ((data.user_experience_rating or 80) * 1.4) }}" width="18" height="{{ (data.user_experience_rating or 80) * 1.4 }}" fill="var(--indigo-600)" rx="2"/>
                <rect x="166" y="{{ 160 - ((data.other_experience_rating or 70) * 1.4) }}" width="18" height="{{ (data.other_experience_rating or 70) * 1.4 }}" fill="#94a3b8" rx="2"/>
                <text x="164" y="176" font-size="9.5" font-weight="600" fill="var(--slate-800)" text-anchor="middle" font-family="'Inter', sans-serif">Experience</text>

                <!-- Category 3: Formatting Quality -->
                <rect x="215" y="{{ 160 - ((data.user_formatting_rating or 85) * 1.4) }}" width="18" height="{{ (data.user_formatting_rating or 85) * 1.4 }}" fill="var(--indigo-600)" rx="2"/>
                <rect x="236" y="{{ 160 - ((data.other_formatting_rating or 75) * 1.4) }}" width="18" height="{{ (data.other_formatting_rating or 75) * 1.4 }}" fill="#94a3b8" rx="2"/>
                <text x="234" y="176" font-size="9.5" font-weight="600" fill="var(--slate-800)" text-anchor="middle" font-family="'Inter', sans-serif">Format</text>

                <!-- Category 4: Grammar Quality -->
                <rect x="285" y="{{ 160 - ((data.user_grammar_rating or 90) * 1.4) }}" width="18" height="{{ (data.user_grammar_rating or 90) * 1.4 }}" fill="var(--indigo-600)" rx="2"/>
                <rect x="306" y="{{ 160 - ((data.other_grammar_rating or 80) * 1.4) }}" width="18" height="{{ (data.other_grammar_rating or 80) * 1.4 }}" fill="#94a3b8" rx="2"/>
                <text x="304" y="176" font-size="9.5" font-weight="600" fill="var(--slate-800)" text-anchor="middle" font-family="'Inter', sans-serif">Grammar</text>

                <!-- Category 5: Overall Strength -->
                <rect x="355" y="{{ 160 - ((data.user_overall_rating or 80) * 1.4) }}" width="18" height="{{ (data.user_overall_rating or 80) * 1.4 }}" fill="var(--indigo-600)" rx="2"/>
                <rect x="376" y="{{ 160 - ((data.other_overall_rating or 72) * 1.4) }}" width="18" height="{{ (data.other_overall_rating or 72) * 1.4 }}" fill="#94a3b8" rx="2"/>
                <text x="374" y="176" font-size="9.5" font-weight="600" fill="var(--slate-800)" text-anchor="middle" font-family="'Inter', sans-serif">Overall</text>
            </svg>
            
            <div style="font-size: 11px; display: flex; flex-direction: column; gap: 8px; font-family: 'Inter', sans-serif;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 14px; height: 14px; background-color: var(--indigo-600); border-radius: 3px;"></div>
                    <span style="font-weight: 600; color: var(--slate-800);">Your Resume</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 14px; height: 14px; background-color: #94a3b8; border-radius: 3px;"></div>
                    <span style="font-weight: 600; color: var(--slate-700);">Peer Resume</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="grid-2">
        <div class="card" style="border-color: #a7f3d0; background-color: #f0fdf4;">
            <h3 style="color: var(--emerald-600);">Your Relative Advantages</h3>
            {% for adv in data.user_advantages %}
                <div class="advantage-item">
                    <span class="advantage-icon">✓</span>
                    <span>{{ adv }}</span>
                </div>
            {% endfor %}
        </div>
        
        <div class="card" style="border-color: #fde68a; background-color: #fffbeb;">
            <h3 style="color: var(--amber-600);">Identified Gaps</h3>
            {% for gap in data.user_gaps %}
                <div class="gap-item">
                    <span class="gap-icon">!</span>
                    <span>{{ gap }}</span>
                </div>
            {% endfor %}
        </div>
    </div>
    
    <div class="grid-2">
        <div class="card">
            <h3>Formatting & Structure</h3>
            <p style="font-size: 12px; line-height: 1.6; color: var(--slate-800); margin-bottom: 15px;">{{ data.formatting_comparison }}</p>
            
            <div class="metric-row">
                <span class="metric-label">Your Formatting Quality</span>
                <div>
                    <span style="font-size: 12px; font-weight: bold; color: var(--indigo-600);">{{ data.user_formatting_rating }}%</span>
                    <div class="metric-bar-container">
                        <div class="metric-bar" style="width: {{ data.user_formatting_rating }}%;"></div>
                    </div>
                </div>
            </div>
            <div class="metric-row">
                <span class="metric-label">Peer Formatting Quality</span>
                <div>
                    <span style="font-size: 12px; font-weight: bold; color: var(--slate-700);">{{ data.other_formatting_rating }}%</span>
                    <div class="metric-bar-container">
                        <div class="metric-bar" style="width: {{ data.other_formatting_rating }}%; background-color: #94a3b8;"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>Grammar & Writing Quality</h3>
            <p style="font-size: 12px; line-height: 1.6; color: var(--slate-800); margin-bottom: 15px;">{{ data.grammar_quality_comparison }}</p>
            
            <div class="metric-row">
                <span class="metric-label">Your Writing Quality</span>
                <div>
                    <span style="font-size: 12px; font-weight: bold; color: var(--indigo-600);">{{ data.user_grammar_rating }}%</span>
                    <div class="metric-bar-container">
                        <div class="metric-bar" style="width: {{ data.user_grammar_rating }}%;"></div>
                    </div>
                </div>
            </div>
            <div class="metric-row">
                <span class="metric-label">Peer Writing Quality</span>
                <div>
                    <span style="font-size: 12px; font-weight: bold; color: var(--slate-700);">{{ data.other_grammar_rating }}%</span>
                    <div class="metric-bar-container">
                        <div class="metric-bar" style="width: {{ data.other_grammar_rating }}%; background-color: #94a3b8;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        JobSense &copy; {{ year }}. Generated securely in your private workspace.
    </div>
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
        from xhtml2pdf import pisa
        import io
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=pdf_buffer)
        if pisa_status.err:
            raise RuntimeError(f"xhtml2pdf also failed: {pisa_status.err}") from playwright_err
        return pdf_buffer.getvalue()

async def export_comparison_to_pdf(comparison_data: dict) -> bytes:
    now = datetime.datetime.now()
    formatted_date = now.strftime("%B %d, %Y")
    
    template = Template(COMPARE_HTML_TEMPLATE)
    html_content = template.render(
        data=comparison_data,
        date=formatted_date,
        year=now.year
    )
    
    pdf_bytes = await asyncio.to_thread(generate_pdf_sync, html_content)
    return pdf_bytes
