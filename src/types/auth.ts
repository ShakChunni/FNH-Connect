// Session User Type (subset returned from verify-session API)
// Lightweight user data for client-side rendering
export interface SessionUser {
  id: number; // User ID (Int)
  username: string;
  role: string; // User role
  isActive: boolean;
  staffId: number;
  // Staff details flattened for convenience
  firstName: string;
  lastName: string;
  fullName: string;
  staffRole: string; // Staff table role
  department?: string; // Derived from staff assignments if needed
  specialization?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string; // Staff profile photo URL
}

// Authentication Flow Types
export interface LoginRequest {
  username: string;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VerifySessionRequest {
  // No request body needed, uses httpOnly session cookie
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: SessionUser;
  error?: string;
  details?: any;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
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
  id: string; // CUID (String)
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Device tracking (optional in type if not always fetched)
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  readableFingerprint?: string | null;
  osType?: string | null;
  browserName?: string | null;
  browserVersion?: string | null;
  deviceType?: string | null;
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

// Session device info for activity logging (subset of session data)
export interface SessionDeviceInfo {
  ipAddress: string | null;
  deviceFingerprint: string | null;
  readableFingerprint: string | null;
  deviceType: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osType: string | null;
}

// Authenticated User returned by getAuthenticatedUserForAPI
// Extends SessionUser with session info for activity logging
export interface AuthenticatedUser extends SessionUser {
  sessionId: string;
  sessionDeviceInfo: SessionDeviceInfo;
}
