"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const STORAGE_KEY = "credit_risk_user";

export interface User {
  name: string;
  email: string;
  role: "borrower" | "analyst" | "admin";
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      router.replace("/auth/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.name && parsed?.email && parsed?.role) {
        setUser({
          name: parsed.name,
          email: parsed.email,
          role: parsed.role,
        });
      } else {
        router.replace("/auth/login");
      }
    } catch {
      router.replace("/auth/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { user, isLoading };
}
