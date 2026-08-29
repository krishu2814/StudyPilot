const BASE_URL = "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}

export class ApiError extends Error {
  constructor(public message: string, public status: number = 400) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("studypilot_token");

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: "Failed to parse server response.",
  }));

  if (!response.ok || !data.success) {
    throw new ApiError(data.error || data.message || "An unexpected error occurred", response.status);
  }

  return (data.data !== undefined ? data.data : data) as T;
}
