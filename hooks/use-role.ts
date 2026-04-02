import { useState, useEffect } from "react";
import { roleStore } from "@/lib/role-store";
import { trpc } from "@/lib/trpc";

/**
 * 현재 사용자 역할을 반환하는 훅
 * - 서버에서 역할을 조회하여 roleStore에 동기화
 * - roleStore 변경 시 즉시 리렌더링
 */
export function useRole() {
  const [role, setRole] = useState<string>(roleStore.role);

  // roleStore 구독 - 역할 전환 시 즉시 리렌더링
  useEffect(() => {
    const unsubscribe = roleStore.subscribe((newRole) => {
      setRole(newRole);
    });
    return unsubscribe;
  }, []);

  // 서버에서 역할 조회 후 roleStore에 동기화
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 0,
  });

  // 서버 응답이 오면 roleStore 동기화
  useEffect(() => {
    if (meQuery.data?.role) {
      roleStore.setRole(meQuery.data.role);
    }
  }, [meQuery.data?.role]);

  return {
    role,
    isAdmin: role === "admin",
    isPartner: role === "partner",
    isUser: role === "user" || role === undefined,
    isLoading: meQuery.isLoading,
  };
}
