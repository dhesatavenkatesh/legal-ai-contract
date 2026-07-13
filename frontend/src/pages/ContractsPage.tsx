import axios from "axios";
import {
  Eye,
  FileText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  deleteContract,
  getContracts,
} from "../services/api";
import type { Contract } from "../types";

function ContractsPage() {
  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadContracts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getContracts();

      setContracts(response.contracts);
    } catch {
      setError("Unable to load contracts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  async function handleDelete(
    contractId: string,
  ) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this contract?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteContract(contractId);

      setContracts((currentContracts) =>
        currentContracts.filter(
          (contract) =>
            contract.contract_id !== contractId,
        ),
      );
    } catch (deleteError) {
      if (axios.isAxiosError(deleteError)) {
        setError(
          deleteError.response?.data?.detail
            ?? "Unable to delete contract.",
        );
      } else {
        setError("Unable to delete contract.");
      }
    }
  }

  if (isLoading) {
    return (
      <LoadingSpinner text="Loading contracts..." />
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Documents</h2>
          <p>
            View and manage uploaded legal contracts.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadContracts()}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {contracts.length === 0 ? (
        <article className="empty-state">
          <FileText size={42} />
          <h3>No contracts found</h3>
          <p>
            Upload your first legal contract to begin analysis.
          </p>

          <Link
            to="/upload"
            className="primary-button"
          >
            Upload Contract
          </Link>
        </article>
      ) : (
        <div className="contract-table-wrapper">
          <table className="contract-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Text Length</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.contract_id}>
                  <td>
                    <div className="document-cell">
                      <FileText size={20} />

                      <div>
                        <strong>
                          {contract.filename}
                        </strong>

                        <span>
                          {contract.contract_id.slice(0, 12)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="status-badge">
                      {contract.status}
                    </span>
                  </td>

                  <td>
                    {contract.text_length}
                  </td>

                  <td>
                    {new Date(
                      contract.created_at,
                    ).toLocaleString()}
                  </td>

                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/contracts/${contract.contract_id}`}
                        className="icon-button"
                        aria-label="View contract"
                      >
                        <Eye size={18} />
                      </Link>

                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label="Delete contract"
                        onClick={() =>
                          void handleDelete(
                            contract.contract_id,
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ContractsPage;