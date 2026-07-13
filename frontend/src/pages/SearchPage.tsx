import axios from "axios";
import {
  FileSearch,
  Search,
  Sparkles,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  getContracts,
  searchContract,
} from "../services/api";
import type {
  Contract,
  SearchResult,
} from "../types";

function SearchPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [searchedQuery, setSearchedQuery] =
    useState("");

  const [isLoadingContracts, setIsLoadingContracts] =
    useState(true);

  const [isSearching, setIsSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedContractId =
    searchParams.get("contractId") ?? "";

  useEffect(() => {
    async function loadContracts() {
      try {
        setIsLoadingContracts(true);
        setError("");

        const response = await getContracts();

        setContracts(response.contracts);
      } catch {
        setError("Unable to load contracts.");
      } finally {
        setIsLoadingContracts(false);
      }
    }

    void loadContracts();
  }, []);

  function handleContractChange(
    contractId: string,
  ) {
    setResults([]);
    setSearchedQuery("");
    setError("");

    if (contractId) {
      setSearchParams({
        contractId,
      });
    } else {
      setSearchParams({});
    }
  }

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedContractId) {
      setError("Please select a contract.");
      return;
    }

    if (!query.trim()) {
      setError("Please enter a search question.");
      return;
    }

    try {
      setIsSearching(true);
      setError("");
      setResults([]);

      const response = await searchContract(
        selectedContractId,
        query.trim(),
        5,
      );

      setResults(response.results);
      setSearchedQuery(response.query);
    } catch (searchError) {
      if (axios.isAxiosError(searchError)) {
        setError(
          searchError.response?.data?.detail
            ?? "Semantic search failed.",
        );
      } else {
        setError("Semantic search failed.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  const suggestedQueries = [
    "What is the payment deadline?",
    "How can the agreement be terminated?",
    "Does the contract renew automatically?",
    "What are the confidentiality obligations?",
    "Who is responsible for damages?",
  ];

  if (isLoadingContracts) {
    return (
      <LoadingSpinner text="Loading contracts..." />
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Semantic Search</h2>

          <p>
            Search contract content using natural-language
            questions.
          </p>
        </div>
      </div>

      <form
        className="search-panel"
        onSubmit={handleSearch}
      >
        <label>
          Select Contract

          <select
            value={selectedContractId}
            onChange={(event) =>
              handleContractChange(
                event.target.value,
              )
            }
          >
            <option value="">
              Select a contract
            </option>

            {contracts.map((contract) => (
              <option
                key={contract.contract_id}
                value={contract.contract_id}
              >
                {contract.filename}
              </option>
            ))}
          </select>
        </label>

        <label className="search-input-label">
          Search Question

          <div className="search-input-wrapper">
            <Search size={20} />

            <input
              type="text"
              value={query}
              placeholder="Example: What is the payment deadline?"
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />

            <button
              type="submit"
              className="primary-button"
              disabled={
                isSearching
                || !selectedContractId
                || !query.trim()
              }
            >
              {isSearching
                ? "Searching..."
                : "Search"}
            </button>
          </div>
        </label>
      </form>

      <article className="content-card">
        <h3>
          <Sparkles size={19} />
          Suggested Searches
        </h3>

        <div className="suggestion-list">
          {suggestedQueries.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-button"
              onClick={() =>
                setQuery(suggestion)
              }
            >
              {suggestion}
            </button>
          ))}
        </div>
      </article>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isSearching ? (
        <LoadingSpinner text="Searching contract..." />
      ) : searchedQuery && results.length === 0 ? (
        <article className="empty-state section-spacing">
          <FileSearch size={42} />

          <h3>No relevant results</h3>

          <p>
            Try using different words or a more specific
            question.
          </p>
        </article>
      ) : results.length > 0 ? (
        <div className="search-results section-spacing">
          <div className="search-results-heading">
            <div>
              <h3>Search Results</h3>

              <p>
                Results for “{searchedQuery}”
              </p>
            </div>

            <span>
              {results.length} results
            </span>
          </div>

          {results.map((result) => (
            <article
              className="search-result-card"
              key={`${result.metadata.chunk_number}-${result.rank}`}
            >
              <div className="search-result-header">
                <div>
                  <span>
                    Result {result.rank}
                  </span>

                  <h3>
                    Chunk{" "}
                    {result.metadata.chunk_number}
                  </h3>
                </div>

                <div className="similarity-score">
                  <span>Similarity</span>

                  <strong>
                    {result.similarity_score
                      !== null
                      ? `${Math.round(
                          result.similarity_score
                          * 100,
                        )}%`
                      : "N/A"}
                  </strong>
                </div>
              </div>

              <p>{result.text}</p>

              <div className="search-result-footer">
                <span>
                  File:{" "}
                  {result.metadata.filename}
                </span>

                {result.distance !== null && (
                  <span>
                    Distance:{" "}
                    {result.distance.toFixed(4)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="empty-state section-spacing">
          <Search size={42} />

          <h3>Search your contract</h3>

          <p>
            Select a contract and enter a natural-language
            question.
          </p>
        </article>
      )}
    </section>
  );
}

export default SearchPage;