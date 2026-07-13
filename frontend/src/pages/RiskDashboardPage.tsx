import {
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import LoadingSpinner from "../components/LoadingSpinner";
import RiskBadge from "../components/RiskBadge";
import {
  getContractRisks,
  getContracts,
} from "../services/api";
import type {
  Contract,
  RiskResponse,
} from "../types";

function RiskDashboardPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [riskData, setRiskData] =
    useState<RiskResponse | null>(null);

  const [selectedSeverity, setSelectedSeverity] =
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
    async function loadRisks() {
      if (!selectedContractId) {
        setRiskData(null);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response =
          await getContractRisks(
            selectedContractId,
          );

        setRiskData(response);
      } catch {
        setError(
          "Unable to load contract risks.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadRisks();
  }, [selectedContractId]);

  const chartData = useMemo(() => {
    if (!riskData) {
      return [];
    }

    return [
      {
        name: "High",
        value: riskData.risk_summary.high,
      },
      {
        name: "Medium",
        value: riskData.risk_summary.medium,
      },
      {
        name: "Low",
        value: riskData.risk_summary.low,
      },
    ];
  }, [riskData]);

  const filteredRisks = useMemo(() => {
    if (!riskData) {
      return [];
    }

    if (selectedSeverity === "all") {
      return riskData.risks;
    }

    return riskData.risks.filter(
      (risk) =>
        risk.severity === selectedSeverity,
    );
  }, [riskData, selectedSeverity]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Risk Dashboard</h2>
          <p>
            Review detected legal and contractual
            risks.
          </p>
        </div>
      </div>

      <article className="filter-card">
        <label>
          Contract

          <select
            value={selectedContractId}
            onChange={(event) => {
              setSelectedSeverity("all");

              const value = event.target.value;

              if (value) {
                setSearchParams({
                  contractId: value,
                });
              } else {
                setSearchParams({});
              }
            }}
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
          Severity

          <select
            value={selectedSeverity}
            onChange={(event) =>
              setSelectedSeverity(
                event.target.value,
              )
            }
            disabled={!riskData}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">
              Medium
            </option>
            <option value="low">Low</option>
          </select>
        </label>
      </article>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner text="Analysing risks..." />
      ) : !riskData ? (
        <article className="empty-state">
          <ShieldAlert size={42} />
          <h3>Select a contract</h3>
          <p>
            Choose a document to display its risks.
          </p>
        </article>
      ) : (
        <>
          <div className="stat-grid">
            <article className="stat-card">
              <div className="stat-icon">
                <AlertTriangle size={22} />
              </div>

              <div>
                <span>High Risks</span>
                <strong>
                  {riskData.risk_summary.high}
                </strong>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">
                <ShieldAlert size={22} />
              </div>

              <div>
                <span>Medium Risks</span>
                <strong>
                  {riskData.risk_summary.medium}
                </strong>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">
                <CheckCircle size={22} />
              </div>

              <div>
                <span>Low Risks</span>
                <strong>
                  {riskData.risk_summary.low}
                </strong>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon">
                <ShieldAlert size={22} />
              </div>

              <div>
                <span>Overall Risk</span>
                <strong className="capitalize">
                  {riskData.overall_risk}
                </strong>
              </div>
            </article>
          </div>

          <div className="dashboard-grid">
            <article className="content-card chart-card">
              <h3>Risk Distribution</h3>

              <div className="chart-container">
                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      <Cell fill="#dc3545" />
                      <Cell fill="#f0a020" />
                      <Cell fill="#2fa56b" />
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="content-card">
              <h3>Risk Overview</h3>

              <p className="muted-text">
                The analysis detected{" "}
                <strong>
                  {riskData.total_risks}
                </strong>{" "}
                potentially risky contract terms.
              </p>

              <div className="risk-summary-box">
                <RiskBadge
                  severity={
                    riskData.overall_risk
                  }
                />

                <p>
                  Overall contract risk is classified
                  as {riskData.overall_risk}.
                </p>
              </div>
            </article>
          </div>

          <div className="risk-list section-spacing">
            {filteredRisks.map(
              (risk, index) => (
                <article
                  className="risk-card"
                  key={`${risk.title}-${index}`}
                >
                  <div className="risk-card-header">
                    <div>
                      <span>
                        Risk {index + 1}
                      </span>

                      <h3>{risk.title}</h3>
                    </div>

                    <RiskBadge
                      severity={risk.severity}
                    />
                  </div>

                  <p>{risk.description}</p>

                  <div className="risk-context">
                    <strong>
                      Contract context
                    </strong>

                    <p>{risk.context}</p>
                  </div>
                </article>
              ),
            )}

            {filteredRisks.length === 0 && (
              <article className="empty-state">
                <CheckCircle size={42} />
                <h3>No matching risks</h3>
                <p>
                  No risks were detected for this
                  severity.
                </p>
              </article>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default RiskDashboardPage;