import type {
  AuthSession,
  LoginCredentials,
  OtpSendResponse,
  OtpVerifyResponse,
  RegistrationResponse,
  AdminDashboardResponse,
  AdminApproveResponse,
  AdminUsersResponse,
  UserProfile,
  HealthCheckResponse,
  RegistrationRequest,
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export class ApiRequestError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)sm_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Could not connect to the backend.',
      0
    );
  }

  const contentType = response.headers.get('content-type');
  const data: unknown = contentType?.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorData = data as { error?: string; message?: string } | null;
    throw new ApiRequestError(
      errorData?.message || errorData?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
}

export function checkHealth(): Promise<HealthCheckResponse> {
  return request<HealthCheckResponse>('/health');
}

export function sendOtp(phone: string): Promise<OtpSendResponse> {
  return request<OtpSendResponse>('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, otp: string): Promise<OtpVerifyResponse> {
  return request<OtpVerifyResponse>('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}

export function verifyWidgetOtp(phone: string, accessToken: string): Promise<OtpVerifyResponse> {
  return request<OtpVerifyResponse>('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, access_token: accessToken }),
  });
}

async function login(endpoint: string, credentials: LoginCredentials): Promise<AuthSession> {
  return request<AuthSession>(endpoint, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function farmerLogin(credentials: LoginCredentials): Promise<AuthSession> {
  return login('/api/farmer/login', credentials);
}

export async function farmerRegister(formData: FormData): Promise<RegistrationResponse> {
  const response = await request<{
    success: boolean;
    message: string;
    data: { request_id: string };
  }>('/api/farmer/register', { method: 'POST', body: formData });
  return { success: response.success, message: response.message, request_id: response.data.request_id };
}

export async function getFarmerProfile(): Promise<{ success: boolean; profile: UserProfile }> {
  const response = await request<{ success: boolean; data: UserProfile }>('/api/farmer/profile');
  return { success: response.success, profile: response.data };
}

export function buyerLogin(credentials: LoginCredentials): Promise<AuthSession> {
  return login('/api/buyer/login', credentials);
}

export async function buyerRegister(formData: FormData): Promise<RegistrationResponse> {
  const response = await request<{
    success: boolean;
    message: string;
    data: { request_id: string };
  }>('/api/buyer/register', { method: 'POST', body: formData });
  return { success: response.success, message: response.message, request_id: response.data.request_id };
}

export async function getBuyerProfile(): Promise<{ success: boolean; profile: UserProfile }> {
  const response = await request<{ success: boolean; data: UserProfile }>('/api/buyer/profile');
  return { success: response.success, profile: response.data };
}

export function adminLogin(credentials: LoginCredentials): Promise<AuthSession> {
  return login('/api/admin/login', credentials);
}

export async function getAdminProfile(): Promise<{ success: boolean; profile: UserProfile }> {
  const response = await request<{ success: boolean; data: UserProfile }>('/api/admin/profile');
  return { success: response.success, profile: response.data };
}

export async function getAdminDashboard(params?: {
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AdminDashboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  const response = await request<{
    success: boolean;
    data: {
      pending_requests: RegistrationRequest[];
      pagination: AdminDashboardResponse['pagination'];
    };
  }>(`/api/admin/dashboard${query ? `?${query}` : ''}`);
  return {
    success: response.success,
    data: response.data.pending_requests,
    pagination: response.data.pagination,
  };
}

export function getRequestDetail(
  requestId: string
): Promise<{ success: boolean; data: RegistrationRequest }> {
  return request(`/api/admin/requests/${encodeURIComponent(requestId)}`);
}

export function approveRequest(requestId: string): Promise<AdminApproveResponse> {
  return request(`/api/admin/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
  });
}

export function rejectRequest(requestId: string): Promise<{ success: boolean; message: string }> {
  return request(`/api/admin/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
  });
}

export async function getAdminUsers(params?: {
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  const response = await request<{
    success: boolean;
    data: { users: UserProfile[]; total: number; page: number; totalPages: number };
  }>(`/api/admin/users${query ? `?${query}` : ''}`);
  return {
    success: response.success,
    data: response.data.users,
    pagination: {
      total: response.data.total,
      page: response.data.page,
      limit: params?.limit ?? 20,
      totalPages: response.data.totalPages,
    },
  };
}
