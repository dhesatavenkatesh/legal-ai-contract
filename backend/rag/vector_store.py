from pathlib import Path
from threading import Lock

import chromadb
from sentence_transformers import (
    SentenceTransformer,
)

BACKEND_DIRECTORY = (
    Path(__file__).resolve().parent.parent
)

PROJECT_DIRECTORY = (
    BACKEND_DIRECTORY.parent
)

CHROMA_DIRECTORY = (
    PROJECT_DIRECTORY / "chroma_db"
)

CHROMA_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

COLLECTION_NAME = (
    "legal_contracts_cosine"
)

MODEL_NAME = (
    "sentence-transformers/"
    "all-MiniLM-L6-v2"
)

_client = chromadb.PersistentClient(
    path=str(CHROMA_DIRECTORY)
)

_collection = (
    _client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={
            "description": (
                "Contract chunks for LegalAI "
                "semantic search"
            ),
            "hnsw:space": "cosine",
        },
    )
)

_model: SentenceTransformer | None = None

_model_lock = Lock()


def get_embedding_model() -> SentenceTransformer:
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(
                    MODEL_NAME
                )

    return _model


def create_document_embeddings(
    texts: list[str],
) -> list[list[float]]:
    if not texts:
        return []

    model = get_embedding_model()

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return embeddings.tolist()


def create_query_embedding(
    query: str,
) -> list[float]:
    cleaned_query = query.strip()

    if not cleaned_query:
        raise ValueError(
            "Search query cannot be empty"
        )

    model = get_embedding_model()

    embedding = model.encode(
        cleaned_query,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return embedding.tolist()


def delete_contract_vectors(
    contract_id: str,
) -> None:
    try:
        _collection.delete(
            where={
                "contract_id": contract_id,
            }
        )
    except Exception:
        pass


def store_contract_chunks(
    contract_id: str,
    filename: str,
    chunks: list[dict],
) -> int:
    if not chunks:
        return 0

    delete_contract_vectors(
        contract_id
    )

    documents = [
        chunk["text"]
        for chunk in chunks
        if chunk.get("text")
    ]

    if not documents:
        return 0

    valid_chunks = [
        chunk
        for chunk in chunks
        if chunk.get("text")
    ]

    embeddings = (
        create_document_embeddings(
            documents
        )
    )

    ids = [
        (
            f"{contract_id}_chunk_"
            f"{chunk['chunk_number']}"
        )
        for chunk in valid_chunks
    ]

    metadatas = [
        {
            "contract_id": contract_id,
            "filename": filename,
            "chunk_number": int(
                chunk["chunk_number"]
            ),
            "start_position": int(
                chunk.get(
                    "start_position",
                    0,
                )
            ),
            "end_position": int(
                chunk.get(
                    "end_position",
                    0,
                )
            ),
        }
        for chunk in valid_chunks
    ]

    _collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return len(valid_chunks)


def search_contract_chunks(
    contract_id: str,
    query: str,
    limit: int = 5,
) -> list[dict]:
    cleaned_query = query.strip()

    if not cleaned_query:
        raise ValueError(
            "Search query cannot be empty"
        )

    safe_limit = max(
        1,
        min(limit, 10),
    )

    contract_records = _collection.get(
        where={
            "contract_id": contract_id,
        },
        include=[
            "metadatas",
        ],
    )

    contract_ids = (
        contract_records.get("ids")
        or []
    )

    if not contract_ids:
        return []

    query_embedding = (
        create_query_embedding(
            cleaned_query
        )
    )

    result_count = min(
        safe_limit,
        len(contract_ids),
    )

    results = _collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=result_count,
        where={
            "contract_id": contract_id,
        },
        include=[
            "documents",
            "metadatas",
            "distances",
        ],
    )

    documents = (
        results.get("documents")
        or [[]]
    )[0]

    metadatas = (
        results.get("metadatas")
        or [[]]
    )[0]

    distances = (
        results.get("distances")
        or [[]]
    )[0]

    search_results: list[dict] = []

    for index, document in enumerate(
        documents
    ):
        metadata = (
            metadatas[index]
            if index < len(metadatas)
            else {}
        )

        distance = (
            distances[index]
            if index < len(distances)
            else None
        )

        similarity_score = None

        if distance is not None:
            similarity_score = round(
                max(
                    0.0,
                    min(
                        1.0,
                        1.0
                        - float(distance),
                    ),
                ),
                4,
            )

        search_results.append(
            {
                "rank": index + 1,
                "text": document,
                "metadata": metadata,
                "distance": (
                    round(
                        float(distance),
                        4,
                    )
                    if distance is not None
                    else None
                ),
                "similarity_score": (
                    similarity_score
                ),
            }
        )

    return search_results


def get_vector_store_status() -> dict:
    return {
        "collection_name": (
            COLLECTION_NAME
        ),
        "stored_chunk_count": (
            _collection.count()
        ),
        "storage_path": str(
            CHROMA_DIRECTORY
        ),
        "embedding_model": (
            MODEL_NAME
        ),
    }