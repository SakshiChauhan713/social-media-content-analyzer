from PIL import Image
import pytesseract

# If Tesseract isn't on PATH (Windows), uncomment and set the path:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_from_image(path: str) -> str:
    img = Image.open(path)
    if img.mode not in ("L", "RGB"):
        img = img.convert("RGB")
    gray = img.convert("L")
    text = pytesseract.image_to_string(gray, lang="eng")
    return text.strip()
