import fitz

def render_pdf(pdf_path, img_path):
    print(f"Rendering {pdf_path} to {img_path}...")
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        pix.save(img_path)
        doc.close()
        print(f"Rendered successfully!")
    except Exception as e:
        print(f"Failed to render {pdf_path}: {e}")

if __name__ == "__main__":
    render_pdf("sample_cv.pdf", "sample_cv_before.png")
    render_pdf("sample_cv_updated_inplace.pdf", "sample_cv_after.png")
