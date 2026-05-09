"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useAddToCartStore } from "../../store/useAddToCardStore";
import { useAuthStore } from "../../store/authStore";

// ✅ Memoized helper function for price calculation
const calculateFinalPrice = (price, discountValue, discountType) => {
  const basePrice = parseFloat(price || 0);
  const discount = parseFloat(discountValue || 0);

  if (discountType === "percentage" && discount > 0) {
    return basePrice - (basePrice * discount) / 100;
  } else if (discountType === "fixed" && discount > 0) {
    return Math.max(0, basePrice - discount);
  }
  return basePrice;
};

// ✅ Memoized helper for image URL
const getBookImage = (images) => {
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "/placeholder-book.jpg";
    } catch {
      return "/placeholder-book.jpg";
    }
  }
  return Array.isArray(images) && images.length > 0 ? images[0] : "/placeholder-book.jpg";
};

// ✅ Memoized Cart Item Component
const CartItem = memo(({ item, isUpdating, isRemoving, onQuantityChange, onRemove }) => {
  const isProcessing = isUpdating || isRemoving;

  const finalPrice = useMemo(() =>
    calculateFinalPrice(item.book?.price, item.book?.discount_value, item.book?.discount_type),
    [item.book?.price, item.book?.discount_value, item.book?.discount_type]
  );

  const imageUrl = useMemo(() => getBookImage(item.book?.images_url), [item.book?.images_url]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''
        } ${isRemoving ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-start space-x-4">
        {/* Book Image */}
        <div className="relative flex-shrink-0 w-20 h-28">
          <Image
            src={imageUrl}
            alt={item.book?.title || "Book cover"}
            fill
            sizes="(max-width: 768px) 80px, 80px"
            className="object-cover rounded-lg"
          />
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {item.book?.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                by {item.book?.author_name}
              </p>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Hardcover
                </span>
                <span className="text-sm text-green-600 font-medium">
                  ✓ In Stock
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                ${finalPrice.toFixed(2)}
              </div>
              {item.book?.discount_value > 0 && (
                <div className="text-sm text-gray-500 line-through">
                  ${parseFloat(item.book?.price || 0).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onQuantityChange(item, item.quantity - 1)}
                disabled={item.quantity <= 1 || isProcessing}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item, item.quantity + 1)}
                disabled={isProcessing}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onRemove(item)}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <TrashIcon className="w-4 h-4" />
              <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

const ShoppingCart = () => {
  const { user } = useAuthStore();
  const {
    cartItems,
    loading,
    fetchCart,
    updateCartItem,
    removeFromCart,
  } = useAddToCartStore();

  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]); // Remove fetchCart from dependencies

  // ✅ Memoize totals calculation - only recalculate when cartItems change
  const { subtotal, orderTotal } = useMemo(() => {
    const sub = cartItems.reduce((total, item) => {
      const finalPrice = calculateFinalPrice(
        item.book?.price,
        item.book?.discount_value,
        item.book?.discount_type
      );
      return total + (finalPrice * item.quantity);
    }, 0);

    const shippingEstimate = 0; // FREE SHIPPING
    return {
      subtotal: sub,
      orderTotal: sub + shippingEstimate
    };
  }, [cartItems]);

  // ✅ Optimized quantity change with instant feedback
  const handleQuantityChange = useCallback(async (item, newQuantity) => {
    if (newQuantity < 1) return;

    // Prevent multiple updates on same item
    if (updatingItems.has(item.id)) return;

    setUpdatingItems(prev => new Set(prev).add(item.id));

    // ✅ Show toast immediately
    toast.success("Updating quantity...", {
      autoClose: 1000,
      hideProgressBar: true,
    });

    try {
      await updateCartItem(item.book_id, newQuantity);
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [updateCartItem, updatingItems]);

  // ✅ Optimized remove with instant feedback
  const handleRemoveItem = useCallback(async (item) => {
    // Prevent multiple removes on same item
    if (removingItems.has(item.id)) return;

    setRemovingItems(prev => new Set(prev).add(item.id));

    // ✅ Show toast immediately
    toast.success("Removing item...", {
      autoClose: 1000,
      hideProgressBar: true,
    });

    try {
      await removeFromCart(item.id);
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [removeFromCart, removingItems]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Please sign in to view your cart
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#68422f] font-medium">Shopping Cart</span>
            </nav>
            <h1 className="text-3xl font-bold text-[#68422f]">
              Shopping Cart{" "}
              <span className="text-lg font-normal text-gray-500">
                ({cartItems.length} items)
              </span>
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-[#68422f] hover:text-[#8d705b]"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any books to your cart yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isUpdating={updatingItems.has(item.id)}
                  isRemoving={removingItems.has(item.id)}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Order Total
                    </span>
                    <span className="text-2xl font-bold text-[#68422f]">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Apply discount codes at checkout
                  </p>
                </div>

                <Link href="/checkout">
                  <button className="w-full bg-[#68422f] hover:bg-[#8d705b] text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4">
                    Proceed to Checkout →
                  </button>
                </Link>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <LockClosedIcon className="w-4 h-4" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
