import { ApiError, postJson, type AuthResponse } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Neuspjelo učitavanje korisnika.");
  }

  const payload = (await response.json()) as AuthResponse;
  return payload.user;
};

export const loginUser = (input: { email: string; password: string }) =>
  postJson<AuthResponse>("/api/auth/login", input);

export const registerUser = (input: {
  email: string;
  password: string;
  passwordConfirmation: string;
}) => postJson<AuthResponse>("/api/auth/register", input);

export const logoutUser = async () => {
  try {
    await postJson<{ ok: true }>("/api/auth/logout", {});
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return;
    }
    throw error;
  }
};
