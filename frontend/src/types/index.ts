export interface Contract {
  contract_id: string;
  filename: string;
  status: string;
  text_length: number;
  created_at: string;
}

export interface ContractListResponse {
  total: number;
  contracts: Contract[];
}

export interface UploadContractResponse {
  message: string;
  contract_id: string;
  filename: string;
  status: string;
  text_length: number;
  stored_chunk_count?: number;
  created_at: string;
}

export interface Clause {
  clause_number: number;
  title: string;
  clause_type: string;
  text: string;
  text_length: number;
}

export interface ClauseResponse {
  contract_id: string;
  filename: string;
  total_clauses: number;
  important_clause_count: number;
  category_counts: Record<string, number>;
  clauses: Clause[];
}

export interface Risk {
  title: string;
  keyword: string;
  severity: "high" | "medium" | "low";
  description: string;
  context: string;
}

export interface RiskResponse {
  contract_id: string;
  filename: string;
  overall_risk: "high" | "medium" | "low";
  total_risks: number;
  risk_summary: {
    high: number;
    medium: number;
    low: number;
  };
  risks: Risk[];
}

export interface SearchResult {
  rank: number;
  text: string;
  metadata: {
    contract_id: string;
    filename: string;
    chunk_number: number;
    start_position?: number;
    end_position?: number;
  };
  distance: number | null;
  similarity_score: number | null;
}

export interface SearchResponse {
  contract_id: string;
  filename: string;
  query: string;
  total_results: number;
  results: SearchResult[];
}

export interface ChatSource {
  source_number: number;
  filename: string;
  chunk_number: number;
  text: string;
  similarity_score: number | null;
}

export interface ChatResponse {
  chat_id: number;
  contract_id: string;
  filename: string;
  question: string;
  answer: string;
  sources: ChatSource[];
  created_at: string;
  disclaimer: string;
}

export interface ContractDetails {
  contract_id: string;
  filename: string;
  status: string;
  text_length: number;
  text_preview: string;
  created_at: string;
}

export interface MissingClause {
  clause_type: string;
  severity: "high" | "medium" | "low";
  message: string;
}

export interface Obligation {
  obligation_number: number;
  party: string;
  trigger: string;
  deadline: string | null;
  text: string;
}

export interface RenewalAlert {
  level: "high" | "medium" | "low";
  message: string;
}

export interface RenewalClause {
  type: string;
  automatic: boolean;
  text: string;
}

export interface ExpirationClause {
  type: string;
  text: string;
  dates: string[];
}

export interface RenewalInformation {
  automatic_renewal: boolean;
  renewal_clauses: RenewalClause[];
  expiration_clauses: ExpirationClause[];
  notice_periods: string[];
  durations: string[];
  dates: string[];
}

export interface ContractSummary {
  short_summary: string;
  key_sections: Record<string, string[]>;
}

export interface ContractStatistics {
  character_count: number;
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  estimated_reading_minutes: number;
}

export interface ContractAnalysisResponse {
  contract: {
    contract_id: string;
    filename: string;
    status: string;
    created_at: string;
  };

  overview: {
    overall_risk: "high" | "medium" | "low";
    total_clauses: number;
    total_risks: number;
    total_missing_clauses: number;
    total_obligations: number;
    obligations_with_deadlines: number;
    automatic_renewal: boolean;
  };

  summary: ContractSummary;
  statistics: ContractStatistics;
  clause_category_counts: Record<string, number>;
  clauses: Clause[];

  risk_summary: {
    high: number;
    medium: number;
    low: number;
  };

  risks: Risk[];
  missing_clauses: MissingClause[];
  obligations: Obligation[];
  renewal_alert: RenewalAlert;
  renewal_information: RenewalInformation;
}
export interface DashboardStats {
  totalContracts: number;
  highRisks: number;
  mediumRisks: number;
  missingClauses: number;
  totalObligations: number;
  renewalAlerts: number;
}
export interface DashboardSummary {
  total_contracts: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  missing_clauses: number;
  total_obligations: number;
  renewal_alerts: number;
}

export interface DashboardContractOverview {
  contract_id: string;
  filename: string;
  status: string;
  created_at: string;
  overall_risk: "high" | "medium" | "low";

  risk_summary: {
    high: number;
    medium: number;
    low: number;
  };

  missing_clauses: number;
  obligations: number;
  automatic_renewal: boolean;

  renewal_alert: {
    level: "high" | "medium" | "low";
    message: string;
  };
}

export interface DashboardResponse {
  summary: DashboardSummary;
  recent_contracts: Contract[];
  contract_overviews: DashboardContractOverview[];
}
export interface ChatHistoryItem {
  chat_id: number;
  question: string;
  answer: string;
  sources: ChatSource[];
  created_at: string;
}

export interface ChatHistoryResponse {
  contract_id: string;
  filename: string;
  total_messages: number;
  history: ChatHistoryItem[];
}
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
export interface AdminSummary {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_contracts: number;
  total_chat_messages: number;
}

export interface AdminSummaryResponse {
  admin: {
    id: number;
    name: string;
    email: string;
  };

  summary: AdminSummary;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  contract_count: number;
}

export interface AdminUsersResponse {
  total: number;
  users: AdminUser[];
}
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}