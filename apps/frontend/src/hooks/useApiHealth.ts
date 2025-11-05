import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

type HealthResponse = {
  status: string;
  timestamp: string;
};

export function useApiHealth() {
  return useQuery({
    queryKey: ["apiHealth"],
    queryFn: (): Promise<HealthResponse> => apiFetch("/health"),
    staleTime: 60_000
  });
}
