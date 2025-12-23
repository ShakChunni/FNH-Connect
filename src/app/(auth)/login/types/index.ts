/**
 * Login Page Type Definitions
 * Centralized types for login form, validation, and API communication
 */
import { SessionUser } from "@/types/auth";

export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
  submit?: string;
}

// Sync with global LoginResponse but ensure strict typing for the form handler
export interface LoginResponse {
  success: boolean;
  user?: SessionUser;
  error?: string;
  message?: string;
}

export interface LoginState {
  isLoading: boolean;
  error: string | null;
  errors: LoginFormErrors;
  isSubmitted: boolean;
}

export const INITIAL_LOGIN_STATE: LoginState = {
  isLoading: false,
  error: null,
  errors: {},
  isSubmitted: false,
};

/**
 * Validation rules for login form
 */
export const LOGIN_VALIDATION = {
  username: {
    required: "Username is required",
    minLength: "Username must be at least 3 characters",
    pattern:
      "Username can only contain letters, numbers, hyphens, and underscores",
  },
  password: {
    required: "Password is required",
    minLength: "Password must be at least 8 characters",
  },
} as const;
