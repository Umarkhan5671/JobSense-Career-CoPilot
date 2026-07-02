import datetime
from jinja2 import Template
from playwright.sync_api import sync_playwright
import asyncio

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JobSense Career Report</title>
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
            
            --indigo-50: #e0e7ff;
            --indigo-100: #c7d2fe;
            --indigo-600: #4f46e5;
            --indigo-700: #4338ca;
            
            {% if data.match_score >= 75 %}
                --score-color: #10b981;
                --score-bg: #ecfdf5;
                --score-text: #047857;
            {% elif data.match_score >= 50 %}
                --score-color: #f59e0b;
                --score-bg: #fef3c7;
                --score-text: #b45309;
            {% else %}
                --score-color: #ef4444;
                --score-bg: #fff1f2;
                --score-text: #be123c;
            {% endif %}
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
            margin-bottom: 30px;
        }
        
        .logo-area h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: var(--indigo-600);
        }
        
        .logo-area p {
            font-size: 12px;
            color: var(--slate-800);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .meta-area {
            text-align: right;
            font-size: 13px;
            color: var(--slate-800);
        }
        
        .meta-area .date {
            font-weight: 600;
        }
        
        .score-card {
            display: flex;
            align-items: center;
            gap: 30px;
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            padding: 24px;
            background-color: var(--slate-50);
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .score-circle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background-color: var(--score-bg);
            border: 4px solid var(--score-color);
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: var(--score-text);
        }
        
        .score-info h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: var(--slate-900);
            margin-bottom: 4px;
        }
        
        .score-info p {
            font-size: 14px;
            color: var(--slate-800);
        }
        
        .grid-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .card {
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            padding: 24px;
            background-color: #ffffff;
            page-break-inside: avoid;
        }
        
        .card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: var(--slate-900);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--slate-100);
        }
        
        .chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .chip {
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 8px;
        }
        
        .chip.matched {
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        
        .chip.missing {
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
        
        .full-card {
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            padding: 24px;
            background-color: #ffffff;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .full-card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: var(--slate-900);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--slate-100);
        }
        
        .list-items {
            list-style: none;
        }
        
        .list-items li {
            position: relative;
            font-size: 14px;
            padding-left: 20px;
            margin-bottom: 10px;
            color: var(--slate-700);
        }
        
        .list-items li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--indigo-600);
            font-weight: bold;
            font-size: 18px;
            line-height: 1;
            top: -1px;
        }
        
        .numbered-items {
            list-style: none;
            counter-reset: item-counter;
        }
        
        .numbered-items li {
            position: relative;
            font-size: 14px;
            padding-left: 28px;
            margin-bottom: 12px;
            color: var(--slate-700);
            counter-increment: item-counter;
        }
        
        .numbered-items li::before {
            content: counter(item-counter);
            position: absolute;
            left: 0;
            top: 2px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: var(--indigo-50);
            color: var(--indigo-700);
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .footer {
            border-top: 1px solid var(--slate-100);
            padding-top: 15px;
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-area">
            <h1>JobSense</h1>
            <p>AI Career Coach</p>
        </div>
        <div class="meta-area">
            <div class="date">{{ date }}</div>
            <div>Career Analysis Report</div>
        </div>
    </div>
    
    <div class="score-card">
        <div class="score-circle">{{ data.match_score }}%</div>
        <div class="score-info">
            <h2>Match Analysis</h2>
            <p>Your qualifications have been cross-referenced with the job description. The candidate has a <strong>{{ data.match_score }}%</strong> match rate for this role.</p>
        </div>
    </div>
    
    <div class="grid-container">
        <div class="card">
            <h3>Matched Skills</h3>
            <div class="chips">
                {% for skill in data.matched_skills %}
                    <span class="chip matched">{{ skill }}</span>
                {% endfor %}
            </div>
        </div>
        <div class="card">
            <h3>Missing Skills</h3>
            <div class="chips">
                {% for skill in data.missing_skills %}
                    <span class="chip missing">{{ skill }}</span>
                {% endfor %}
            </div>
        </div>
    </div>
    
    <div class="full-card">
        <h3>Key Strengths</h3>
        <ul class="list-items">
            {% for strength in data.strengths %}
                <li>{{ strength }}</li>
            {% endfor %}
        </ul>
    </div>
    
    <div class="full-card">
        <h3>Interview Talking Points</h3>
        <ol class="numbered-items">
            {% for point in data.interview_talking_points %}
                <li>{{ point }}</li>
            {% endfor %}
        </ol>
    </div>
    
    <div class="full-card">
        <h3>Suggested Resume Bullet Revisions</h3>
        <ol class="numbered-items">
            {% for bullet in data.rewritten_bullets %}
                <li>{{ bullet }}</li>
            {% endfor %}
        </ol>
    </div>
    
    <div class="footer">
        JobSense Career Coach &copy; {{ year }}. Disclaimer: This analysis is AI-generated for guidance purposes. Verify details independently.
    </div>
</body>
</html>
"""

def generate_pdf_sync(html: str) -> bytes:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.set_content(html)
        page.evaluate("document.fonts.ready")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "15mm", "bottom": "15mm", "left": "15mm", "right": "15mm"}
        )
        browser.close()
        return pdf_bytes

async def export_report_to_pdf(report_data: dict) -> bytes:
    now = datetime.datetime.now()
    formatted_date = now.strftime("%B %d, %Y")
    
    template = Template(HTML_TEMPLATE)
    html_content = template.render(
        data=report_data,
        date=formatted_date,
        year=now.year
    )
    
    pdf_bytes = await asyncio.to_thread(generate_pdf_sync, html_content)
    return pdf_bytes
