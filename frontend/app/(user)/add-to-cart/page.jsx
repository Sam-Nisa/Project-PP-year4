"use client";

import { useEffect } from "react";
import { useAddToCartStore } from "../../store/useAddToCardStore";

export default function CartPage() {
  const {
    cartItems,
    fetchCart,
    removeFromCart,
    updateCartItem,
    loading,
    error,
  } = useAddToCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  // Discount/Price Helper
  const getEffectivePrice = (book) => {
    // Added check to ensure book exists
    if (!book) return 0;

    // FIX: Assuming 'discounted_price' or 'final_price' holds the sale price
    const price = book.discounted_price || book.price;
    return parseFloat(price ?? 0);
  };

  const handleIncrease = (item) => {
    updateCartItem(item.book_id, item.quantity + 1);
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      updateCartItem(item.book_id, item.quantity - 1);
    } else {
      // Use the Cart Item ID (item.id) for removal
      handleRemove(item.id);
    }
  };

  const handleRemove = (cartItemId) => {
    // cartItemId is the unique ID of the cart record (item.id)
    removeFromCart(cartItemId);
  };

  // FIX: Calculate total using defensive checks
  const totalPrice = cartItems.reduce((sum, i) => {
    // Check if item or item.book is undefined/null
    if (!i || !i.book) {
      console.warn("Skipping malformed cart item:", i);
      return sum;
    }
    const price = getEffectivePrice(i.book);
    return sum + price * i.quantity;
  }, 0);

  if (loading) return <p className="text-center py-10">Loading...</p>;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center py-10 text-xl text-red-600 border border-red-300 bg-red-50 rounded-lg">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl shadow-md">
          {/* Icon */}
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-50 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7m12-7l2 7M9 21h.01M15 21h.01"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-center max-w-md mb-6">
            Looks like you haven’t added any books yet. Start exploring and find
            something you’ll love 📚
          </p>

          {/* Action Button */}
          <a
            href="/"
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium
                        hover:bg-blue-700 transition shadow-lg"
          >
            Browse Books
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => {
            // FIX: Defensive check before rendering each item
            if (!item || !item.book || !item.id) {
              // If data is bad, skip rendering this one item
              console.error("Skipping render of malformed item:", item);
              return null;
            }

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow"
              >
                <img
                  src={item.book.cover_image_url}
                  className="w-20 h-28 object-cover rounded"
                  alt="Book Cover"
                />

                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.book.title}</h2>
                 <div className="flex items-center gap-2">
                {item.book.discount_value > 0 ? (
                  <>
                    <p className="text-gray-600 line-through text-sm">
                      ${parseFloat(item.book.price).toFixed(2)}
                    </p>
                    <p className="text-green-600 font-semibold">
                      ${parseFloat(item.book.discounted_price).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">
                    ${parseFloat(item.book.price).toFixed(2)}
                  </p>
                )}
              </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="px-3 py-1 border rounded"
                      onClick={() => handleDecrease(item)}
                    >
                      -
                    </button>
                    <span className="px-4">{item.quantity}</span>
                    <button
                      className="px-3 py-1 border rounded"
                      onClick={() => handleIncrease(item)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  // We pass item.id (Cart Item ID) for removal
                  onClick={() => handleRemove(item.id)}
                  className="text-red-500 font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })}

          {/* Total Section */}
          <div className="text-right mt-4">
            <h2 className="text-xl font-bold">
              Total:{" "}
              <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
