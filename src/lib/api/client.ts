import type {
  ApiResponse,
  ApprovalResult,
  CallLog,
  CallRequest,
  CallResult,
  Crop,
  CropAnalysisResult,
  FarmerCallRequestsData,
  Interest,
  LoginCredentials,
  LoginData,
  MarketDataCrop,
  MemberRole,
  Pagination,
  ProfitResult,
  RegionalComparisonItem,
  RegistrationRequest,
  RegistrationStatus,
  UserProfile,
  UserRole,
} from "@/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api/backend${endpoint}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError("Please check your connection and try again.", 0);
  }
  const data = await response.json().catch(() => ({
    message: "We couldn’t complete that request. Please try again.",
  }));
  if (!response.ok) {
    if (
      response.status === 401 &&
      !endpoint.endsWith("/login") &&
      typeof window !== "undefined"
    )
      window.dispatchEvent(new Event("sm:session-expired"));
    throw new ApiRequestError(
      data.message || "Please try again.",
      response.status,
      data.code,
    );
  }
  return data;
}

export const signIn = (role: UserRole, credentials: LoginCredentials) =>
  request<ApiResponse<LoginData>>(`/api/${role}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const registerAccount = (role: MemberRole, data: FormData) =>
  request<
    ApiResponse<{
      request_id: string;
      email: string;
      full_name: string;
      status: RegistrationStatus;
    }>
  >(`/api/${role}/register`, { method: "POST", body: data });

export const forgotPassword = (role: MemberRole, email: string) =>
  request<ApiResponse<never>>(`/api/${role}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (
  role: MemberRole,
  token_hash: string,
  password: string,
) =>
  request<ApiResponse<never>>(`/api/${role}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token_hash, password }),
  });

export const changePassword = (
  role: UserRole,
  current_password: string,
  password: string,
) =>
  request<ApiResponse<never>>(`/api/${role}/change-password`, {
    method: "POST",
    body: JSON.stringify({ current_password, password }),
  });

const query = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") q.set(key, String(value));
  });
  return q.toString();
};

export const getRequests = (params: {
  role?: MemberRole;
  status?: RegistrationStatus | "all";
  page?: number;
  limit?: number;
}) =>
  request<
    ApiResponse<{
      requests: RegistrationRequest[];
      pending_requests?: RegistrationRequest[];
      pagination: Pagination;
    }>
  >(`/api/admin/requests?${query(params)}`);

export const getRequestDetail = (id: string) =>
  request<ApiResponse<RegistrationRequest>>(
    `/api/admin/requests/${encodeURIComponent(id)}`,
  );

export const approveRequest = (id: string) =>
  request<ApiResponse<ApprovalResult>>(
    `/api/admin/requests/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );

export const resendCredentials = (id: string) =>
  request<ApiResponse<ApprovalResult>>(
    `/api/admin/requests/${encodeURIComponent(id)}/send-credentials`,
    { method: "POST" },
  );

export const rejectRequest = (id: string, reason: string) =>
  request<ApiResponse<unknown>>(
    `/api/admin/requests/${encodeURIComponent(id)}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );

export const correctEmail = (id: string, email: string) =>
  request<ApiResponse<RegistrationRequest>>(
    `/api/admin/requests/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ email }) },
  );

export const getUsers = (role: MemberRole, page = 1) =>
  request<
    ApiResponse<{
      users: UserProfile[];
      total: number;
      page: number;
      totalPages: number;
    }>
  >(`/api/admin/users?${query({ role, page, limit: 20 })}`);

export const getCrops = (
  role: UserRole,
  params: { crop_type?: string; search?: string } = {},
) => request<ApiResponse<Crop[]>>(`/api/${role}/crops?${query(params)}`);

export const getCrop = (role: MemberRole, id: string) =>
  request<ApiResponse<Crop>>(`/api/${role}/crops/${encodeURIComponent(id)}`);

export const createCrop = (data: FormData) =>
  request<ApiResponse<Crop>>("/api/farmer/crops", {
    method: "POST",
    body: data,
  });

export const deleteCrop = (id: string) =>
  request<ApiResponse<never>>(`/api/farmer/crops/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getInterests = (role: MemberRole) =>
  request<ApiResponse<Interest[]>>(`/api/${role}/interests`);

export const expressInterest = (id: string, rating: number, notes: string) =>
  request<ApiResponse<unknown>>(
    `/api/buyer/crops/${encodeURIComponent(id)}/interest`,
    { method: "POST", body: JSON.stringify({ rating, notes }) },
  );

export const setAvailability = (role: MemberRole, is_call_available: boolean) =>
  request<ApiResponse<{ is_call_available: boolean }>>(
    `/api/${role}/availability`,
    { method: "PATCH", body: JSON.stringify({ is_call_available }) },
  );

export const initiateCall = (
  role: MemberRole,
  receiver_id: string,
  crop_id?: string,
) =>
  request<ApiResponse<CallResult>>(`/api/${role}/calls/initiate`, {
    method: "POST",
    body: JSON.stringify({
      [role === "buyer" ? "farmer_id" : "buyer_id"]: receiver_id,
      crop_id,
    }),
  });

export const updateProfile = (
  role: UserRole,
  data: { preferred_language?: string; ai_onboarding_completed?: boolean },
) =>
  request<ApiResponse<UserProfile>>(`/api/${role}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const getCallLogs = () =>
  request<ApiResponse<CallLog[]>>("/api/admin/call-logs");

// ================================================================
// BUYER-FARMER CALL APPROVAL SYSTEM APIS
// ================================================================

export const createCallRequest = (data: {
  farmer_id?: string;
  crop_id?: string;
  buyer_note?: string;
}) =>
  request<ApiResponse<CallRequest>>("/api/buyer/calls/request", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getBuyerCallRequests = (status?: string) =>
  request<ApiResponse<CallRequest[]>>(
    `/api/buyer/calls/requests${status ? `?status=${status}` : ""}`,
  );

export const getBuyerCallRequestDetail = (id: string) =>
  request<ApiResponse<CallRequest>>(`/api/buyer/calls/requests/${id}`);

export const getFarmerCallRequests = (status?: string) =>
  request<ApiResponse<FarmerCallRequestsData>>(
    `/api/farmer/calls/requests${status ? `?status=${status}` : ""}`,
  );

export const approveCallRequest = (id: string) =>
  request<ApiResponse<CallRequest>>(`/api/farmer/calls/requests/${id}/approve`, {
    method: "POST",
  });

export const rejectCallRequest = (id: string, rejection_reason?: string) =>
  request<ApiResponse<CallRequest>>(`/api/farmer/calls/requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason }),
  });

// ================================================================
// FARMER AI AGENT APIS
// ================================================================

export const askFarmerAi = (
  message: string,
  language: string,
  conversationHistory: { role: string; content: string }[] = [],
) =>
  request<
    ApiResponse<{
      reply: string;
      language: string;
      marketData?: MarketDataCrop | null;
      modelUsed?: string;
    }>
  >("/api/farmer/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, language, conversationHistory }),
  });

export const analyzeCropPhoto = (formData: FormData) =>
  request<ApiResponse<CropAnalysisResult>>("/api/farmer/ai/crop-analysis", {
    method: "POST",
    body: formData,
  });

export const transcribeVoiceRecording = (formData: FormData) =>
  request<ApiResponse<{ text: string; language: string }>>(
    "/api/farmer/ai/transcribe",
    {
      method: "POST",
      body: formData,
    },
  );

export const getMarketIntelligence = (crop = "wheat", state?: string) =>
  request<ApiResponse<{ crop: MarketDataCrop; regionalComparison: RegionalComparisonItem[] }>>(
    `/api/farmer/ai/market-intelligence?${new URLSearchParams({
      crop,
      ...(state ? { state } : {}),
    }).toString()}`,
  );

export const calculateCropProfit = (data: {
  quantity: number;
  sellingPrice: number;
  productionCost?: number;
  transportCost?: number;
  handlingCost?: number;
  otherExpenses?: number;
  quantityUnit?: string;
  cropName?: string;
}) =>
  request<ApiResponse<ProfitResult>>("/api/farmer/ai/calculate-profit", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAiOnboarding = (completed: boolean) =>
  request<ApiResponse<{ ai_onboarding_completed: boolean }>>(
    "/api/farmer/ai/onboarding",
    {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    },
  );

export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!path.startsWith("/uploads/")) return null;
  return `${(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "")}${path}`;
}
