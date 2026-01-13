"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useAddToCartStore } from "../store/useAddToCardStore";
import { useAuthStore } from "../store/authStore";

const CartIcon = ({ className = "" }) => {
  const { user } = useAuthStore();
  const { cartCount, fetchCartCount } = useAddToCartStore();

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user, fetchCartCount]);

  if (!user) {
    return null;
  }

  return (
    <Link href="/cart" className={`relative inline-flex ${className}`}>
      <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;