from rag.vector_store import (
    search_contract_chunks,
)
from services.llm_service import (
    generate_contract_answer,
)


def build_context(
    search_results: list[dict],
) -> str:
    context_sections: list[str] = []

    for index, result in enumerate(
        search_results,
        start=1,
    ):
        metadata = result.get(
            "metadata",
            {},
        )

        filename = metadata.get(
            "filename",
            "contract",
        )

        chunk_number = metadata.get(
            "chunk_number",
            index,
        )

        text = result.get(
            "text",
            "",
        )

        if not text:
            continue

        context_sections.append(
            (
                f"[Source {index}]\n"
                f"File: {filename}\n"
                f"Chunk: {chunk_number}\n"
                f"Text: {text}"
            )
        )

    return "\n\n".join(
        context_sections
    )


def create_source_list(
    search_results: list[dict],
) -> list[dict]:
    sources: list[dict] = []

    for index, result in enumerate(
        search_results,
        start=1,
    ):
        metadata = result.get(
            "metadata",
            {},
        )

        text = result.get(
            "text",
            "",
        )

        if not text:
            continue

        sources.append(
            {
                "source_number": index,
                "filename": metadata.get(
                    "filename",
                ),
                "chunk_number": metadata.get(
                    "chunk_number",
                ),
                "text": text,
                "similarity_score": result.get(
                    "similarity_score",
                ),
            }
        )

    return sources


def answer_contract_question(
    contract_id: str,
    question: str,
    source_limit: int = 5,
) -> dict:
    cleaned_question = question.strip()

    if not cleaned_question:
        raise ValueError(
            "Question cannot be empty"
        )

    search_results = search_contract_chunks(
        contract_id=contract_id,
        query=cleaned_question,
        limit=source_limit,
    )

    if not search_results:
        return {
            "answer": (
                "No indexed contract content was found. "
                "Please index the contract and try again."
            ),
            "sources": [],
        }

    relevant_results = [
        result
        for result in search_results
        if (
            result.get("text")
            and (
                result.get(
                    "similarity_score"
                )
                is None
                or result[
                    "similarity_score"
                ]
                >= 0.10
            )
        )
    ]

    if not relevant_results:
        return {
            "answer": (
                "The contract does not clearly specify "
                "this information."
            ),
            "sources": [],
        }

    context = build_context(
        relevant_results
    )

    if not context:
        return {
            "answer": (
                "The contract does not clearly specify "
                "this information."
            ),
            "sources": [],
        }

    answer = generate_contract_answer(
        question=cleaned_question,
        context=context,
    )

    sources = create_source_list(
        relevant_results
    )

    return {
        "answer": answer,
        "sources": sources,
    }