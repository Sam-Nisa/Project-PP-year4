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

    const handleGoogleLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Use the dedicated Google login handler
        await useAuthStore.getState().handleGoogleLogin(token);

        // Small delay to ensure state propagates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Redirect to home after successful login
        router.replace("/");
      } catch (error) {
        console.error("Google login failed:", error);
        router.replace("/login?error=google_auth_failed");
      }
    };

    handleGoogleLogin();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>

        {/* Text */}
        <p className="text-lg font-semibold text-gray-700 animate-pulse">
          Logging you in...
        </p>

        {/* Sub text */}
        <p className="text-sm text-gray-500">
          Please wait while we prepare your account
        </p>
      </div>
    </div>
  );
}
