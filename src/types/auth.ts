// Hospital Staff User Type
export interface HospitalStaff {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string; // Doctor, Nurse, PIC, Admin, etc.
  specialization?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session User Type (subset returned from verify-session API)
// Lightweight user data for client-side rendering
export interface SessionUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string; // Staff hospital role (Doctor, Nurse, PIC, Admin, etc.)
  systemRole: string; // User system role (sysAdmin, staff, etc.) for permissions
  specialization?: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
  department?: string;
}

// Authentication Flow Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface VerifySessionRequest {
  // No request body needed, uses httpOnly session cookie
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: SessionUser;
  error?: string;
}

export interface VerifySessionResponse {
  success: boolean;
  valid: boolean;
  user?: SessionUser;
  error?: string;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

// Session Types (from database Session model)
export interface Session {
  id: number;
  userId: number;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  readableFingerprint: string;
  osType: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Device Detection Info
export interface DeviceInfo {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  readableFingerprint: string;
  osType: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  deviceString: string;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
