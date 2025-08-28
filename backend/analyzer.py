import re

def suggest_improvements(text: str) -> list[str]:
    tips = []
    clean = (text or "").strip()

    if len(clean) < 100:
        tips.append("Post is short — add context or story.")

    hashtags = re.findall(r"#\w+", clean)
    if len(hashtags) < 2:
        tips.append("Add 2–3 relevant hashtags.")

    if "?" not in clean:
        tips.append("Ask a question to drive comments.")

    if not re.search(r"(call|join|read|watch|try|download|sign|learn)", clean, re.I):
        tips.append("Include a clear CTA (e.g., Read more / Try it).")

    return tips or ["Looks good! Consider timing and visuals for reach."]
