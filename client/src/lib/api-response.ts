type ApiErrorBody = {
  error?: unknown;
  message?: unknown;
};

export async function readApiResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function getApiErrorMessage(
  response: Response,
  body: ApiErrorBody | null,
  fallback: string,
): string {
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error;
  }

  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }

  if (response.status === 0) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  if (response.status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  if (response.status === 404) {
    return "This service is unavailable right now. Please try again later.";
  }

  if (response.status === 409) {
    return "These details are already in use. Please check them and try again.";
  }

  if (response.status >= 400) {
    return "Please check your details and try again.";
  }

  return fallback;
}

export function getNetworkErrorMessage(fallback: string): string {
  return `We couldn't connect to the service. ${fallback}`;
}