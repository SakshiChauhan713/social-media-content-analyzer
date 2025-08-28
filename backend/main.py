from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pdfminer.high_level import extract_text
from PIL import Image
import pytesseract, io, os
from analyzer import suggest_improvements

# If Tesseract isn't on PATH, set this env var before running OR hardcode here:
# os.environ["TESSERACT_EXE"] = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSERACT_EXE = os.getenv("TESSERACT_EXE")
if TESSERACT_EXE:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE

app = FastAPI(title="Social Media Content Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

SUPPORTED_IMAGES = (".png",".jpg",".jpeg",".webp",".tiff",".bmp")

@app.get("/")
def root():
    return {"ok": True, "service": "content-analyzer", "routes": ["/extract","/analyze"]}

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    """
    Accepts: PDF or image
    Returns: extracted text (PDF: pdfminer; image: Tesseract OCR)
    """
    raw = await file.read()
    name = (file.filename or "").lower()
    if name.endswith(".pdf"):
        text = extract_text(io.BytesIO(raw)) or ""
        return {"filename": file.filename, "kind": "pdf", "text": text.strip()}
    if name.endswith(SUPPORTED_IMAGES):
        img = Image.open(io.BytesIO(raw))
        text = pytesseract.image_to_string(img) or ""
        return {"filename": file.filename, "kind": "image", "text": text.strip()}
    return {"error": "Unsupported file. Provide a .pdf or image."}

class AnalyzeIn(BaseModel):
    text: str

@app.post("/analyze")
def analyze(payload: AnalyzeIn):
    tips = suggest_improvements(payload.text)
    return {"length": len(payload.text or ""), "suggestions": tips}
