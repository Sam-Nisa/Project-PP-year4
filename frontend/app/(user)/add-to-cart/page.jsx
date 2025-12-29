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
    
    // FIX: Assuming 'discount_price' or 'final_price' holds the sale price
    const price = book.discount_price || book.price;
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
        <p className="text-gray-500">Your cart is empty.</p>
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
                    {/* Display effective price */}
                    <p className="text-gray-600">${getEffectivePrice(item.book).toFixed(2)}</p>

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
              Total: <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}