import fitz
import json

def diagnose_pdf(pdf_path="sample_cv.pdf"):
    print(f"Diagnosing PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    
    for p_idx, page in enumerate(doc):
        print(f"\n--- Page {p_idx} ---")
        page_dict = page.get_text("dict")
        blocks = page_dict.get("blocks", [])
        
        for b_idx, block in enumerate(blocks):
            print(f"\nBlock {b_idx} | Bbox: {[round(c, 1) for c in block['bbox']]} | Type: {block.get('type')}")
            if "lines" in block:
                for l_idx, line in enumerate(block["lines"]):
                    line_text = "".join([span["text"] for span in line["spans"]])
                    print(f"  Line {l_idx} | Bbox: {[round(c, 1) for c in line['bbox']]}")
                    for s_idx, span in enumerate(line["spans"]):
                        print(f"    Span {s_idx} | Font: {span['font']} | Size: {span['size']:.1f} | Color: {span['color']} | Text: {repr(span['text'])}")

if __name__ == "__main__":
    diagnose_pdf()
