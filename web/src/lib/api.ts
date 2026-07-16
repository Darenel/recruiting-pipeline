import { readAuthSession } from "../auth/storage";

export type Page<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ApiErrorPayload = {
  status: number;
  error?: string;
  message?: string | string[];
  fieldErrors?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const baseURL = "/api/v1";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || payload.error || response.statusText || "Request failed";

    return new ApiError(response.status, message, payload);
  } catch {
    return new ApiError(response.status, response.statusText || "Request failed");
  }
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = readAuthSession();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
