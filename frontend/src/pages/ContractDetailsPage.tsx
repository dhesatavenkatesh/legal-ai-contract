import {
  AlertTriangle,
  CalendarClock,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  MessageSquare,
  Search,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import RiskBadge from "../components/RiskBadge";
import {
  getContractAnalysis,
  getContractById,
} from "../services/api";
import type {
  ContractAnalysisResponse,
  ContractDetails,
} from "../types";

function ContractDetailsPage() {
  const { contractId } = useParams();

  const [contract, setContract] =
    useState<ContractDetails | null>(null);

  const [analysis, setAnalysis] =
    useState<ContractAnalysisResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      if (!contractId) {
        setError("Contract ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [contractData, analysisData] =
          await Promise.all([
            getContractById(contractId),
            getContractAnalysis(contractId),
          ]);

        setContract(contractData);
        setAnalysis(analysisData);
      } catch {
        setError(
          "Unable to load contract analysis.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [contractId]);

  if (isLoading) {
    return (
      <LoadingSpinner text="Loading contract analysis..." />
    );
  }

  if (error || !contract || !analysis) {
    return (
      <div className="error-message">
        {error || "Contract not found."}
      </div>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>{contract.filename}</h2>

          <p>
            Uploaded{" "}
            {new Date(
              contract.created_at,
            ).toLocaleString()}
          </p>
        </div>

        <RiskBadge
          severity={
            analysis.overview.overall_risk
          }
        />
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <FileSearch size={22} />
          </div>

          <div>
            <span>Total Clauses</span>
            <strong>
              {analysis.overview.total_clauses}
            </strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Detected Risks</span>
            <strong>
              {analysis.overview.total_risks}
            </strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <ListChecks size={22} />
          </div>

          <div>
            <span>Obligations</span>
            <strong>
              {analysis.overview.total_obligations}
            </strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <CalendarClock size={22} />
          </div>

          <div>
            <span>Automatic Renewal</span>
            <strong>
              {analysis.overview.automatic_renewal
                ? "Yes"
                : "No"}
            </strong>
          </div>
        </article>
      </div>

      <div className="contract-action-grid">
        <Link
          to={`/clauses?contractId=${contract.contract_id}`}
          className="action-card"
        >
          <FileSearch size={25} />
          <strong>View Clauses</strong>
          <span>
            Review extracted contract clauses
          </span>
        </Link>

        <Link
          to={`/risks?contractId=${contract.contract_id}`}
          className="action-card"
        >
          <Gauge size={25} />
          <strong>Risk Dashboard</strong>
          <span>
            Review high and medium risks
          </span>
        </Link>

        <Link
          to={`/search?contractId=${contract.contract_id}`}
          className="action-card"
        >
          <Search size={25} />
          <strong>Search Contract</strong>
          <span>
            Run semantic document searches
          </span>
        </Link>

        <Link
          to={`/chat?contractId=${contract.contract_id}`}
          className="action-card"
        >
          <MessageSquare size={25} />
          <strong>Ask LegalAI</strong>
          <span>
            Ask grounded contract questions
          </span>
        </Link>
      </div>

      <div className="dashboard-grid">
        <article className="content-card">
          <h3>Contract Summary</h3>

          <p className="summary-text">
            {analysis.summary.short_summary}
          </p>
        </article>

        <article className="content-card">
          <h3>Document Statistics</h3>

          <div className="detail-list">
            <div>
              <span>Words</span>
              <strong>
                {analysis.statistics.word_count}
              </strong>
            </div>

            <div>
              <span>Sentences</span>
              <strong>
                {analysis.statistics.sentence_count}
              </strong>
            </div>

            <div>
              <span>Paragraphs</span>
              <strong>
                {analysis.statistics.paragraph_count}
              </strong>
            </div>

            <div>
              <span>Reading time</span>
              <strong>
                {
                  analysis.statistics
                    .estimated_reading_minutes
                }{" "}
                min
              </strong>
            </div>
          </div>
        </article>
      </div>

      <article className="content-card section-spacing">
        <h3>
          <FileText size={19} />
          Text Preview
        </h3>

        <div className="text-preview">
          {contract.text_preview}
        </div>
      </article>

      <div className="dashboard-grid section-spacing">
        <article className="content-card">
          <h3>Missing Clauses</h3>

          {analysis.missing_clauses.length === 0 ? (
            <p className="success-text">
              No required clauses appear to be missing.
            </p>
          ) : (
            <div className="stack-list">
              {analysis.missing_clauses.map(
                (clause) => (
                  <div
                    className="list-card"
                    key={clause.clause_type}
                  >
                    <div className="list-card-header">
                      <strong>
                        {clause.clause_type.replace(
                          /_/g,
                          " ",
                        )}
                      </strong>

                      <RiskBadge
                        severity={clause.severity}
                      />
                    </div>

                    <p>{clause.message}</p>
                  </div>
                ),
              )}
            </div>
          )}
        </article>

        <article className="content-card">
          <h3>Renewal Information</h3>

          <div className="renewal-alert">
            <RiskBadge
              severity={
                analysis.renewal_alert.level
              }
            />

            <p>
              {analysis.renewal_alert.message}
            </p>
          </div>

          <div className="detail-list">
            <div>
              <span>Automatic renewal</span>
              <strong>
                {
                  analysis.renewal_information
                    .automatic_renewal
                    ? "Detected"
                    : "Not detected"
                }
              </strong>
            </div>

            <div>
              <span>Notice periods</span>
              <strong>
                {
                  analysis.renewal_information
                    .notice_periods.length
                }
              </strong>
            </div>

            <div>
              <span>Detected dates</span>
              <strong>
                {
                  analysis.renewal_information
                    .dates.length
                }
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ContractDetailsPage;