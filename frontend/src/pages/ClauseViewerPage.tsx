import {
  FileSearch,
  Filter,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  getContractClauses,
  getContracts,
} from "../services/api";
import type {
  Clause,
  Contract,
} from "../types";

function ClauseViewerPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [clauses, setClauses] =
    useState<Clause[]>([]);

  const [categoryCounts, setCategoryCounts] =
    useState<Record<string, number>>({});

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedContractId =
    searchParams.get("contractId") ?? "";

  useEffect(() => {
    async function loadContracts() {
      try {
        const response = await getContracts();
        setContracts(response.contracts);
      } catch {
        setError("Unable to load contracts.");
      }
    }

    void loadContracts();
  }, []);

  useEffect(() => {
    async function loadClauses() {
      if (!selectedContractId) {
        setClauses([]);
        setCategoryCounts({});
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response =
          await getContractClauses(
            selectedContractId,
          );

        setClauses(response.clauses);
        setCategoryCounts(
          response.category_counts,
        );
      } catch {
        setError(
          "Unable to load contract clauses.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadClauses();
  }, [selectedContractId]);

  const categories = useMemo(
    () => [
      "all",
      ...Object.keys(categoryCounts),
    ],
    [categoryCounts],
  );

  const filteredClauses = useMemo(() => {
    if (selectedCategory === "all") {
      return clauses;
    }

    return clauses.filter(
      (clause) =>
        clause.clause_type
        === selectedCategory,
    );
  }, [clauses, selectedCategory]);

  function handleContractChange(
    contractId: string,
  ) {
    setSelectedCategory("all");

    if (contractId) {
      setSearchParams({
        contractId,
      });
    } else {
      setSearchParams({});
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Clause Viewer</h2>
          <p>
            Select a contract and review its extracted
            clauses.
          </p>
        </div>
      </div>

      <article className="filter-card">
        <label>
          Contract

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

        <label>
          Clause Category

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value,
              )
            }
            disabled={!selectedContractId}
          >
            {categories.map((category) => (
              <option
                value={category}
                key={category}
              >
                {category.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </article>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner text="Extracting clauses..." />
      ) : !selectedContractId ? (
        <article className="empty-state">
          <FileSearch size={42} />
          <h3>Select a contract</h3>
          <p>
            Choose a document to display its clauses.
          </p>
        </article>
      ) : (
        <>
          <div className="category-summary">
            {Object.entries(
              categoryCounts,
            ).map(([category, count]) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "category-chip active"
                    : "category-chip"
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                <Filter size={14} />
                {category.replace(/_/g, " ")}
                <strong>{count}</strong>
              </button>
            ))}
          </div>

          <div className="clause-list">
            {filteredClauses.map((clause) => (
              <article
                className="clause-card"
                key={clause.clause_number}
              >
                <div className="clause-card-header">
                  <div>
                    <span>
                      Clause {clause.clause_number}
                    </span>

                    <h3>{clause.title}</h3>
                  </div>

                  <span className="clause-type-badge">
                    {clause.clause_type.replace(
                      /_/g,
                      " ",
                    )}
                  </span>
                </div>

                <p>{clause.text}</p>
              </article>
            ))}

            {filteredClauses.length === 0 && (
              <article className="empty-state">
                <FileSearch size={40} />
                <h3>No clauses found</h3>
                <p>
                  No clauses match this category.
                </p>
              </article>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default ClauseViewerPage;