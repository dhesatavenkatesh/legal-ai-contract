import {
  AlertTriangle,
  CalendarClock,
  FileText,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import RiskBadge from "../components/RiskBadge";
import { getDashboardSummary } from "../services/api";
import type { DashboardResponse } from "../types";

function DashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<DashboardResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getDashboardSummary();

      setDashboardData(response);
    } catch (loadError) {
      console.error(
        "Dashboard loading failed:",
        loadError,
      );

      setError(
        "Unable to load dashboard information. " +
          "Please check that the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <LoadingSpinner text="Loading dashboard..." />
    );
  }

  if (!dashboardData) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h2>Dashboard</h2>

            <p>
              Monitor contracts, risks, obligations,
              and renewal alerts.
            </p>
          </div>
        </div>

        <div className="error-message">
          {error || "Dashboard data is unavailable."}
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => void loadDashboard()}
        >
          <RefreshCw size={17} />
          Retry
        </button>
      </section>
    );
  }

  const {
    summary,
    recent_contracts: recentContracts,
    contract_overviews: contractOverviews,
  } = dashboardData;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Dashboard</h2>

          <p>
            Monitor contracts, risks, obligations,
            and renewal alerts.
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <Link
            to="/upload"
            className="primary-button"
          >
            <Upload size={17} />
            Upload Contract
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <FileText size={23} />
          </div>

          <div>
            <span>Total Contracts</span>

            <strong>
              {summary.total_contracts}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon danger-icon">
            <AlertTriangle size={23} />
          </div>

          <div>
            <span>High Risks</span>

            <strong>
              {summary.high_risks}
            </strong>

            <small>
              {summary.medium_risks} medium risks
            </small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon warning-icon">
            <ShieldAlert size={23} />
          </div>

          <div>
            <span>Missing Clauses</span>

            <strong>
              {summary.missing_clauses}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon success-icon">
            <ListChecks size={23} />
          </div>

          <div>
            <span>Obligations</span>

            <strong>
              {summary.total_obligations}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon renewal-icon">
            <CalendarClock size={23} />
          </div>

          <div>
            <span>Renewal Alerts</span>

            <strong>
              {summary.renewal_alerts}
            </strong>
          </div>
        </article>
      </div>

      <div className="dashboard-main-grid">
        <article className="content-card">
          <div className="card-heading-row">
            <div>
              <h3>Recent Contracts</h3>

              <p>
                Latest uploaded legal documents.
              </p>
            </div>

            <Link
              to="/contracts"
              className="text-link"
            >
              View all
            </Link>
          </div>

          {recentContracts.length === 0 ? (
            <div className="dashboard-empty-state">
              <FileText size={38} />

              <h3>No contracts uploaded</h3>

              <p>
                Upload a PDF contract to begin
                analysis.
              </p>

              <Link
                to="/upload"
                className="primary-button"
              >
                Upload Contract
              </Link>
            </div>
          ) : (
            <div className="recent-contract-list">
              {recentContracts.map((contract) => (
                <Link
                  key={contract.contract_id}
                  to={`/contracts/${contract.contract_id}`}
                  className="recent-contract-item"
                >
                  <div className="recent-contract-icon">
                    <FileText size={19} />
                  </div>

                  <div className="recent-contract-details">
                    <strong>
                      {contract.filename}
                    </strong>

                    <span>
                      {new Date(
                        contract.created_at,
                      ).toLocaleString()}
                    </span>
                  </div>

                  <span className="status-badge">
                    {contract.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="content-card">
          <div className="card-heading-row">
            <div>
              <h3>Renewal Alerts</h3>

              <p>
                Renewal and expiration conditions.
              </p>
            </div>
          </div>

          {contractOverviews.length === 0 ? (
            <p className="muted-text">
              No renewal information is available.
            </p>
          ) : (
            <div className="dashboard-alert-list">
              {contractOverviews.map((item) => (
                <Link
                  key={item.contract_id}
                  to={`/contracts/${item.contract_id}`}
                  className="dashboard-alert-item"
                >
                  <div className="dashboard-alert-header">
                    <strong>
                      {item.filename}
                    </strong>

                    <RiskBadge
                      severity={
                        item.renewal_alert.level
                      }
                    />
                  </div>

                  <p>
                    {item.renewal_alert.message}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>

      <article className="content-card section-spacing">
        <div className="card-heading-row">
          <div>
            <h3>Contract Risk Overview</h3>

            <p>
              Risk information from recently analysed
              contracts.
            </p>
          </div>
        </div>

        {contractOverviews.length === 0 ? (
          <p className="muted-text">
            No analysed contracts are available.
          </p>
        ) : (
          <div className="dashboard-analysis-table-wrapper">
            <table className="dashboard-analysis-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Overall Risk</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Missing</th>
                  <th>Obligations</th>
                  <th>Renewal</th>
                </tr>
              </thead>

              <tbody>
                {contractOverviews.map((item) => (
                  <tr key={item.contract_id}>
                    <td>
                      <Link
                        to={`/contracts/${item.contract_id}`}
                        className="table-contract-link"
                      >
                        {item.filename}
                      </Link>
                    </td>

                    <td>
                      <RiskBadge
                        severity={item.overall_risk}
                      />
                    </td>

                    <td>
                      {item.risk_summary.high}
                    </td>

                    <td>
                      {item.risk_summary.medium}
                    </td>

                    <td>
                      {item.risk_summary.low}
                    </td>

                    <td>
                      {item.missing_clauses}
                    </td>

                    <td>
                      {item.obligations}
                    </td>

                    <td>
                      {item.automatic_renewal
                        ? "Automatic"
                        : "Manual / None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="dashboard-quick-grid section-spacing">
        <Link
          to="/upload"
          className="dashboard-quick-card"
        >
          <Upload size={23} />

          <div>
            <strong>
              Upload Contract
            </strong>

            <span>
              Process and analyse a new PDF.
            </span>
          </div>
        </Link>

        <Link
          to="/clauses"
          className="dashboard-quick-card"
        >
          <FileText size={23} />

          <div>
            <strong>
              Clause Viewer
            </strong>

            <span>
              Review extracted contract clauses.
            </span>
          </div>
        </Link>

        <Link
          to="/risks"
          className="dashboard-quick-card"
        >
          <AlertTriangle size={23} />

          <div>
            <strong>
              Risk Dashboard
            </strong>

            <span>
              Inspect risky contract language.
            </span>
          </div>
        </Link>

        <Link
          to="/chat"
          className="dashboard-quick-card"
        >
          <ShieldAlert size={23} />

          <div>
            <strong>
              Ask LegalAI
            </strong>

            <span>
              Ask questions with contract sources.
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default DashboardPage;