def split_text_into_chunks(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> list[dict]:
    if not text.strip():
        return []

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than zero"
        )

    if overlap < 0:
        raise ValueError(
            "overlap cannot be negative"
        )

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size"
        )

    normalized_text = " ".join(text.split())

    chunks: list[dict] = []
    start = 0
    chunk_number = 1

    while start < len(normalized_text):
        end = min(
            start + chunk_size,
            len(normalized_text),
        )

        chunk_text = normalized_text[start:end]

        if end < len(normalized_text):
            last_sentence_end = max(
                chunk_text.rfind(". "),
                chunk_text.rfind("? "),
                chunk_text.rfind("! "),
            )

            if last_sentence_end > chunk_size // 2:
                end = start + last_sentence_end + 1
                chunk_text = normalized_text[start:end]

        cleaned_chunk = chunk_text.strip()

        if cleaned_chunk:
            chunks.append(
                {
                    "chunk_number": chunk_number,
                    "text": cleaned_chunk,
                    "start_position": start,
                    "end_position": end,
                }
            )

            chunk_number += 1

        if end >= len(normalized_text):
            break

        start = end - overlap

    return chunks