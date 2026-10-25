/* ===== Type definitions for Setu Moolya ===== */

/** User roles in the system */
export type UserRole = 'admin' | 'farmer' | 'buyer';

/** Registration request status */
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

/** Supported locales */
export type Locale = 'en' | 'hi' | 'gu';

/** User profile as returned by the backend */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  mobile_number: string | null;
  nationality: string | null;
  state: string | null;
  taluka: string | null;
  city: string | null;
  full_address: string | null;
  land_location: string | null;
  preferred_language: string | null;
  photo_url: string | null;
  is_approved: boolean;
  registration_request_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Auth session data returned by login endpoints */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
  profile: UserProfile;
}

/** Login credentials */
export interface LoginCredentials {
  login_id?: string;
  email?: string;
  password: string;
}

/** Registration request (pending/approved/rejected) */
export interface RegistrationRequest {
  id: string;
  role: UserRole;
  full_name: string;
  age: number | null;
  mobile_number: string;
  email: string | null;
  nationality: string | null;
  state: string | null;
  taluka: string | null;
  city: string | null;
  full_address: string | null;
  land_location: string | null;
  preferred_language: string | null;
  photo_url: string | null;
  status: RegistrationStatus;
  approved_login_email: string | null;
  approved_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/** OTP send response */
export interface OtpSendResponse {
  success: boolean;
  message: string;
  otp?: string; // Only in dev mode
  provider?: string;
}

/** OTP verify response */
export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  phone_verified_token: string;
}

/** Registration form data */
export interface RegistrationFormData {
  full_name: string;
  age: number;
  mobile_number: string;
  email: string;
  password: string;
  nationality: string;
  state: string;
  taluka: string;
  city: string;
  full_address: string;
  land_location?: string;
  preferred_language: string;
  phone_verified_token: string;
  photo: File;
}

/** Registration response */
export interface RegistrationResponse {
  success: boolean;
  message: string;
  request_id: string;
}

/** Admin dashboard response */
export interface AdminDashboardResponse {
  success: boolean;
  data: RegistrationRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Admin approve response */
export interface AdminApproveResponse {
  success: boolean;
  message: string;
  data: {
    request_id: string;
    user_id: string;
    login_id: string;
    role: UserRole;
    full_name: string;
  };
}

/** Admin users list response */
export interface AdminUsersResponse {
  success: boolean;
  data: UserProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** API error response */
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: string;
}

/** Backend health check response */
export interface HealthCheckResponse {
  status: string;
  supabase_ready?: boolean;
  timestamp?: string;
}
