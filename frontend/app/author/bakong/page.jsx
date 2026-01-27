"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthorBakongPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified payment page
    router.replace("/author/payment");
  }, [router]);

  return (
    <div className="flex-1 p-6 bg-background-dark">
      <div className="mx-auto max-w-4xl flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Redirecting to Payment Settings...</p>
      </div>
    </div>
  );
}