import type {
  ApiResponse,
  ApprovalResult,
  CallLog,
  CallResult,
  Crop,
  Interest,
  LoginCredentials,
  LoginData,
  MemberRole,
  Pagination,
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
    if (response.status === 401 && typeof window !== "undefined")
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
  role: MemberRole,
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
export const getCallLogs = () =>
  request<ApiResponse<CallLog[]>>("/api/admin/call-logs");
export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!path.startsWith("/uploads/")) return null;
  // Uploads stay on the backend; only the public backend URL is exposed.
  return `${(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "")}${path}`;
}
