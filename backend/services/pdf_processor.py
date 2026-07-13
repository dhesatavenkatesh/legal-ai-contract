from pathlib import Path

import fitz


def extract_text_from_pdf(file_path: str) -> str:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    document = fitz.open(file_path)
    extracted_pages: list[str] = []

    try:
        for page_number, page in enumerate(document, start=1):
            page_text = page.get_text("text").strip()

            if page_text:
                extracted_pages.append(
                    f"\n--- Page {page_number} ---\n{page_text}"
                )
    finally:
        document.close()

    return "\n".join(extracted_pages).strip()