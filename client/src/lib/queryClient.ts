import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabaseStorage } from "./supabase-client";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const endpoint = queryKey[0] as string;
      
      // Route to Supabase client methods based on endpoint
      if (endpoint === '/api/service-types') {
        return await supabaseStorage.getServiceTypes() as T;
      }
      if (endpoint === '/api/common-items') {
        const serviceTypeId = queryKey[1] as string;
        return await supabaseStorage.getCommonItems(serviceTypeId) as T;
      }
      if (endpoint === '/api/orders') {
        return await supabaseStorage.getOrders() as T;
      }
      if (endpoint === '/api/profiles') {
        const params = queryKey[1] as { search?: string };
        return await supabaseStorage.getProfiles(params?.search) as T;
      }
      if (endpoint === '/api/service-questions') {
        const serviceTypeId = queryKey[1] as string;
        return await supabaseStorage.getServiceQuestions(serviceTypeId) as T;
      }
      if (endpoint === '/api/dashboard/metrics') {
        return await supabaseStorage.getDashboardMetrics() as T;
      }
      if (endpoint === '/api/dashboard/recent-orders') {
        return await supabaseStorage.getRecentOrdersRequiringAttention() as T;
      }
      
      // Fallback to regular fetch for other endpoints
      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
