import axios from "axios";

import type {
  AuthUser,
  ChangePasswordRequest,
  ChatHistoryResponse,
  ChatResponse,
  ClauseResponse,
  Contract,
  ContractAnalysisResponse,
  ContractDetails,
  ContractListResponse,
  DashboardResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RiskResponse,
  SearchResponse,
  UploadContractResponse,
  AdminSummaryResponse,
  AdminUsersResponse,
  AdminUser,
} from "../types";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "legalai_access_token",
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl =
      error.config?.url ?? "";

    const isAuthRequest =
      requestUrl.includes("/auth/login")
      || requestUrl.includes("/auth/register");

    if (
      error.response?.status === 401
      && !isAuthRequest
    ) {
      localStorage.removeItem(
        "legalai_access_token",
      );

      localStorage.removeItem(
        "legalai_user",
      );
    }

    return Promise.reject(error);
  },
);

export async function registerUser(
  payload: RegisterRequest,
): Promise<AuthUser> {
  const response = await api.post<AuthUser>(
    "/auth/register",
    payload,
  );

  return response.data;
}

export async function loginUser(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    payload,
  );

  return response.data;
}

export async function getCurrentUser():
Promise<AuthUser> {
  const response = await api.get<AuthUser>(
    "/auth/me",
  );

  return response.data;
}

export async function uploadContract(
  file: File,
): Promise<UploadContractResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response =
    await api.post<UploadContractResponse>(
      "/contracts/upload",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );

  return response.data;
}

export async function getContracts():
Promise<ContractListResponse> {
  const response =
    await api.get<ContractListResponse>(
      "/contracts/",
    );

  return response.data;
}

export async function getContractById(
  contractId: string,
): Promise<ContractDetails> {
  const response =
    await api.get<ContractDetails>(
      `/contracts/${contractId}`,
    );

  return response.data;
}

export async function deleteContract(
  contractId: string,
): Promise<{
  message: string;
  contract_id?: string;
}> {
  const response = await api.delete<{
    message: string;
    contract_id?: string;
  }>(
    `/contracts/${contractId}`,
  );

  return response.data;
}

export async function indexContract(
  contractId: string,
): Promise<{
  message: string;
  contract_id: string;
  stored_chunk_count: number;
}> {
  const response = await api.post<{
    message: string;
    contract_id: string;
    stored_chunk_count: number;
  }>(
    `/contracts/${contractId}/index`,
  );

  return response.data;
}

export async function getContractClauses(
  contractId: string,
): Promise<ClauseResponse> {
  const response =
    await api.get<ClauseResponse>(
      `/contracts/${contractId}/clauses`,
    );

  return response.data;
}

export async function getContractRisks(
  contractId: string,
): Promise<RiskResponse> {
  const response =
    await api.get<RiskResponse>(
      `/contracts/${contractId}/risks`,
    );

  return response.data;
}

export async function getContractAnalysis(
  contractId: string,
): Promise<ContractAnalysisResponse> {
  const response =
    await api.get<ContractAnalysisResponse>(
      `/contracts/${contractId}/analysis`,
    );

  return response.data;
}

export async function searchContract(
  contractId: string,
  query: string,
  limit = 5,
): Promise<SearchResponse> {
  const response =
    await api.post<SearchResponse>(
      "/search/",
      {
        contract_id: contractId,
        query,
        limit,
      },
    );

  return response.data;
}

export async function askContractQuestion(
  contractId: string,
  question: string,
  sourceLimit = 5,
): Promise<ChatResponse> {
  const response =
    await api.post<ChatResponse>(
      "/chat/",
      {
        contract_id: contractId,
        question,
        source_limit: sourceLimit,
      },
    );

  return response.data;
}

export async function getChatHistory(
  contractId: string,
): Promise<ChatHistoryResponse> {
  const response =
    await api.get<ChatHistoryResponse>(
      `/chat/history/${contractId}`,
    );

  return response.data;
}

export async function clearChatHistory(
  contractId: string,
): Promise<{
  message: string;
  deleted_messages: number;
}> {
  const response = await api.delete<{
    message: string;
    deleted_messages: number;
  }>(
    `/chat/history/${contractId}`,
  );

  return response.data;
}

export async function getDashboardSummary():
Promise<DashboardResponse> {
  const response =
    await api.get<DashboardResponse>(
      "/dashboard/summary",
    );

  return response.data;
}

export default api;
export async function getAdminSummary():
Promise<AdminSummaryResponse> {
  const response =
    await api.get<AdminSummaryResponse>(
      "/admin/summary",
    );

  return response.data;
}


export async function getAdminUsers():
Promise<AdminUsersResponse> {
  const response =
    await api.get<AdminUsersResponse>(
      "/admin/users",
    );

  return response.data;
}


export async function updateAdminUserRole(
  userId: number,
  role: "user" | "admin",
): Promise<{
  message: string;
  user: Pick<
    AdminUser,
    "id" | "name" | "email" | "role"
  >;
}> {
  const response = await api.patch<{
    message: string;
    user: Pick<
      AdminUser,
      "id" | "name" | "email" | "role"
    >;
  }>(
    `/admin/users/${userId}/role`,
    {
      role,
    },
  );

  return response.data;
}


export async function updateAdminUserStatus(
  userId: number,
  isActive: boolean,
): Promise<{
  message: string;
  user: Pick<
    AdminUser,
    "id" | "name" | "email" | "role" | "is_active"
  >;
}> {
  const response = await api.patch<{
    message: string;
    user: Pick<
      AdminUser,
      "id" | "name" | "email" | "role" | "is_active"
    >;
  }>(
    `/admin/users/${userId}/status`,
    {
      is_active: isActive,
    },
  );

  return response.data;
}
export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<{
  message: string;
}> {
  const response = await api.put<{
    message: string;
  }>(
    "/auth/change-password",
    payload,
  );

  return response.data;
}