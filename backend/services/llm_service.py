import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)

_client: Groq | None = None


def get_groq_client() -> Groq:
    global _client

    if not GROQ_API_KEY:
        raise ValueError(
            f"GROQ_API_KEY is not configured in {ENV_FILE}"
        )

    if _client is None:
        _client = Groq(
            api_key=GROQ_API_KEY,
        )

    return _client


def generate_contract_answer(
    question: str,
    context: str,
) -> str:
    if not context.strip():
        return (
            "The contract does not clearly specify "
            "this information."
        )

    client = get_groq_client()

    system_prompt = """
You are LegalAI, an AI contract review assistant.

Follow these rules strictly:

1. Answer only from the supplied contract context.
2. Do not use external information.
3. Do not invent names, dates, payment amounts,
   obligations, deadlines or clauses.
4. If the answer is not found in the context, reply:
   "The contract does not clearly specify this information."
5. Mention relevant source numbers using [Source 1],
   [Source 2], and so on.
6. Keep the answer clear and concise.
7. Do not provide final legal advice.
8. If interpretation may require professional review,
   mention that legal review may be appropriate.
"""

    user_prompt = f"""
CONTRACT CONTEXT:

{context}

USER QUESTION:

{question}

Answer using only the contract context.
"""

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        temperature=0,
        max_tokens=600,
    )

    answer = (
        completion
        .choices[0]
        .message
        .content
    )

    if not answer:
        return (
            "The contract does not clearly specify "
            "this information."
        )

    return answer.strip()


def get_llm_status() -> dict:
    return {
        "configured": bool(
            GROQ_API_KEY
        ),
        "model": GROQ_MODEL,
        "env_file": str(ENV_FILE),
    }