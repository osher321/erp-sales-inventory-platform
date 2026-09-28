import { apiRequest } from "./httpClient";
import type { LoginResult } from "../types/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiRequest<LoginResult>("/api/auth/login", { method: "POST", body: payload });
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<LoginResult> {
  return apiRequest<LoginResult>("/api/auth/register", { method: "POST", body: payload });
}
