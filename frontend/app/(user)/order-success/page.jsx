"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";

const OrderSuccessPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          
          {orderId && (
            <p className="text-gray-600 mb-6">
              Your order <span className="font-semibold">#{orderId}</span> has been confirmed.
            </p>
          )}
          
          <p className="text-gray-600 mb-8">
            Thank you for your purchase! You will receive an email confirmation shortly.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5 inline mr-2" />
              Continue Shopping
            </Link>
            
            <p className="text-sm text-gray-500">
              Redirecting to home page in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;