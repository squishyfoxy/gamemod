const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    credentials: "include",
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${message}`
    );
  }

  return (await response.json()) as T;
}
