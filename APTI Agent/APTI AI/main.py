import fitz
import google.generativeai as genai
import json
import time
import os
import sys

# 🔑 SET YOUR GEMINI API KEY
genai.configure(api_key="AIzaSyCRWOP9AAP-_Kr7OqT3XAX9c_DnJ0AnNiE")
MODEL_NAME = os.getenv("APTI_MODEL", "models/gemini-2.0-flash")
model = genai.GenerativeModel(MODEL_NAME)


# -------------------------------
# STEP 1: EXTRACT PDF
# -------------------------------
def extract_pdf(path):
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def extract_pdfs(paths):
    all_text = []
    for path in paths:
        all_text.append(extract_pdf(path))
    return "\n".join(all_text)


# -------------------------------
# STEP 2: CLEAN TEXT
# -------------------------------
def clean_text(text):
    return text.replace("\n", " ").strip()


# -------------------------------
# STEP 3: CHUNK TEXT
# -------------------------------
def chunk_text(text, size=400):
    words = text.split()
    return [" ".join(words[i:i+size]) for i in range(0, len(words), size)]


def is_quota_error(exc):
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg


# -------------------------------
# STEP 4: STRUCTURE USING GEMINI
# -------------------------------
def structure_data(chunks, max_chunks=20):
    structured = []

    prompt_template = """
    Extract:
    - section (Quant/Verbal/DI/LR)
    - topic
    - question
    - solution
    - concept

    Text:
    {chunk}

    Return JSON.
    """

    for i, ch in enumerate(chunks[:max_chunks]):  # keep small for first-run testing
        try:
            prompt = prompt_template.format(chunk=ch)
            res = model.generate_content(prompt)
            data = json.loads(res.text)
            structured.append(data)
            print(f"Structured {i}")
            time.sleep(1)
        except Exception as exc:
            print(f"Skipped structured chunk {i}: {exc}")
            if is_quota_error(exc):
                print("Stopping structured extraction due to Gemini quota/rate limit.")
                break
            continue

    return structured


# -------------------------------
# STEP 5: GEMINI GENERATION
# -------------------------------
def generate_data():
    topics = [
        {"section": "Quant", "topic": "Time and Work"},
        {"section": "Quant", "topic": "Profit and Loss"},
        {"section": "LR", "topic": "Seating Arrangement"},
        {"section": "DI", "topic": "Bar Graph"}
    ]

    types = ["concept", "application", "tricky", "multi-step"]

    dataset = []
    stop_generation = False

    prompt_template = """
    Generate 3 UNIQUE aptitude questions:

    Section: {section}
    Topic: {topic}
    Type: {type}

    Include:
    - Step-by-step solution
    - Beginner explanation
    - Easy, Medium, Hard

    Return JSON:
    [
      {{
        "question": "...",
        "solution": "...",
        "explanation": "...",
        "section": "{section}",
        "topic": "{topic}"
      }}
    ]
    """

    for t in topics:
        if stop_generation:
            break
        for tp in types:
            try:
                prompt = prompt_template.format(
                    section=t["section"],
                    topic=t["topic"],
                    type=tp
                )

                res = model.generate_content(prompt)
                data = json.loads(res.text)
                dataset.extend(data)

                print(f"Generated: {t['topic']} - {tp}")
                time.sleep(1)

            except Exception as exc:
                print(f"Skipped generation for {t['topic']} - {tp}: {exc}")
                if is_quota_error(exc):
                    print("Stopping question generation due to Gemini quota/rate limit.")
                    stop_generation = True
                    break
                continue

    return dataset


# -------------------------------
# STEP 6: CONVERT TO TRAIN FORMAT
# -------------------------------
def convert_format(data):
    formatted = []

    for item in data:
        formatted.append({
            "instruction": item.get("question", ""),
            "input": "",
            "output": item.get("solution", "") + "\n\nExplanation:\n" + item.get("explanation", "")
        })

    return formatted


# -------------------------------
# STEP 7: REMOVE DUPLICATES
# -------------------------------
def remove_duplicates(data):
    seen = set()
    unique = []

    for item in data:
        key = item["instruction"]
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


# -------------------------------
# MAIN EXECUTION
# -------------------------------
def main():
    print("🚀 Starting Pipeline...")
    print(f"Using model: {MODEL_NAME}")

    cli_paths = [p for p in sys.argv[1:] if p.lower().endswith(".pdf")]
    env_paths_raw = os.getenv("APTI_PDF_PATHS", "").strip()
    env_paths = [p.strip() for p in env_paths_raw.split(";") if p.strip()] if env_paths_raw else []

    pdf_paths = cli_paths or env_paths
    if not pdf_paths:
        pdf_paths = [os.getenv("APTI_PDF_PATH", "apti.pdf")]

    chunk_limit = int(os.getenv("APTI_CHUNK_LIMIT", "20"))

    missing_paths = [p for p in pdf_paths if not os.path.exists(p)]
    if missing_paths:
        raise FileNotFoundError(
            "Missing PDF file(s): "
            + ", ".join(missing_paths)
            + ". Place apti.pdf in the project root, pass PDF path(s) as CLI args, "
              "or set APTI_PDF_PATH/APTI_PDF_PATHS."
        )

    # 1. Extract PDF
    raw = extract_pdfs(pdf_paths)

    # 2. Clean
    clean = clean_text(raw)

    # 3. Chunk
    chunks = chunk_text(clean)

    # 4. Structure
    structured = structure_data(chunks, max_chunks=chunk_limit)

    # 5. Generate new data
    generated = generate_data()

    # Combine
    combined = structured + generated

    # 6. Convert format
    final = convert_format(combined)

    # 7. Remove duplicates
    final = remove_duplicates(final)

    if not final:
        raise RuntimeError(
            "No dataset rows were produced. Your Gemini request likely hit quota/rate limits. "
            "Try again later, reduce APTI_CHUNK_LIMIT, or use a key/project with available quota."
        )

    # 8. Save
    with open("final_dataset.json", "w") as f:
        json.dump(final, f, indent=4)

    print("✅ DONE! Dataset saved as final_dataset.json")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"❌ Failed: {exc}")
        print("\nHow to run:")
        print("1) pip install pymupdf google-generativeai")
        print("2) Provide input PDF(s):")
        print("   - Put apti.pdf in the project root, or")
        print("   - Set APTI_PDF_PATH for one file, or")
        print("   - Set APTI_PDF_PATHS as semicolon-separated paths, or")
        print("   - Pass PDF path(s): python main.py file1.pdf file2.pdf")
        print("3) python main.py")
        print("\nFirst run tip: keep APTI_CHUNK_LIMIT small (e.g., 20) for testing.")
        raise