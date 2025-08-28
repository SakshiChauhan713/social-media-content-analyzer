import pdfplumber

def extract_from_pdf(path: str) -> str:
    texts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            texts.append(t.strip())
    return "\n\n".join([t for t in texts if t])
