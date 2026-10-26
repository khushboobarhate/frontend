export type UserRole = "admin" | "farmer" | "buyer";
export type MemberRole = "farmer" | "buyer";
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type Locale = "en" | "hi" | "gu";
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  mobile_number?: string | null;
  age?: number | null;
  nationality?: string | null;
  state?: string | null;
  taluka?: string | null;
  city?: string | null;
  full_address?: string | null;
  land_location?: string | null;
  preferred_language?: string | null;
  photo_url?: string | null;
  is_approved: boolean;
  is_call_available?: boolean;
  must_change_password?: boolean;
  registration_request_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface RegistrationRequest extends Omit<UserProfile, "is_approved"> {
  status: RegistrationStatus;
  approved_login_email?: string | null;
  approved_user_id?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  credentials_email_status?: "pending" | "sent" | "failed";
  credentials_email_sent_at?: string | null;
  is_processing?: boolean;
}
export interface Pagination {
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
}
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
export interface LoginData {
  expiresIn: number;
  must_change_password: boolean;
  user?: UserProfile;
  admin?: UserProfile;
}
export interface LoginCredentials {
  login_id?: string;
  email?: string;
  password: string;
}
export interface ApprovalResult {
  request_id: string;
  user_id: string;
  login_id: string;
  role: MemberRole;
  full_name: string;
  status: RegistrationStatus;
  email_sent: boolean;
  credentials_email_status: "pending" | "sent" | "failed";
  can_resend_credentials: boolean;
}
export interface PersonSummary {
  id: string;
  full_name?: string;
  city?: string | null;
  state?: string | null;
  email?: string;
  mobile_number?: string | null;
  photo_url?: string | null;
  is_call_available?: boolean;
}
export interface Interest {
  id?: string;
  interest_id?: string;
  crop_id: string;
  buyer_id?: string;
  crop_name?: string;
  rating: number;
  notes?: string;
  created_at: string;
  buyer?: PersonSummary;
  crop?: Crop | null;
  farmer?: PersonSummary | null;
}
export interface Crop {
  id: string;
  farmer_id?: string;
  crop_name: string;
  crop_type: "organic" | "inorganic" | "non-organic";
  quantity: number;
  quantity_unit: string;
  price: number;
  description?: string;
  photos: string[];
  status: "available" | "sold" | "archived";
  created_at: string;
  farmer?: PersonSummary;
  average_rating?: number;
  total_ratings?: number;
  interested_buyers_count?: number;
  interested_buyers?: Interest[];
  my_interest?: { rating: number; notes?: string; created_at: string } | null;
}
export interface CallLog {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_role: UserRole;
  receiver_role: UserRole;
  status: string;
  created_at: string;
}
export interface CallResult {
  receiver_name: string;
  receiver_phone: string;
  receiver_role: MemberRole;
  call_status: string;
}
