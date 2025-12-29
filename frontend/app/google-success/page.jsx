"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/authStore";

export default function GoogleSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = searchParams.get("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    sessionStorage.setItem("token", token);

    useAuthStore.getState().initializeStore();

    router.replace("/");
  }, [router, searchParams]);

  return <p className="text-center mt-20">Logging you in...</p>;
}
