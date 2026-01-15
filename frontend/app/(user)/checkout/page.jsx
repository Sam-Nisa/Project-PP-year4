"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LockClosedIcon, XMarkIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useAddToCartStore } from "../../store/useAddToCardStore";
import { useAuthStore } from "../../store/authStore";
import { QRCodeSVG } from "qrcode.react";

const CheckoutPage = () => {
  const { user } = useAuthStore();
  const { cartItems, fetchCart } = useAddToCartStore();

  // Calculate subtotal from cart items
  const subtotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.book?.price || 0);
    const discountValue = parseFloat(item.book?.discount_value || 0);
    const discountType = item.book?.discount_type;

    let finalPrice = price;
    if (discountType === "percentage" && discountValue > 0) {
      finalPrice = price - (price * discountValue) / 100;
    } else if (discountType === "fixed" && discountValue > 0) {
      finalPrice = Math.max(0, price - discountValue);
    }

    return total + (finalPrice * item.quantity);
  }, 0);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    paymentMethod: "bakong", // Default to Bakong
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // QR Code Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
      }));
    }
  }, [user, fetchCart]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const shippingCost = 0; // FREE SHIPPING
  const discountAmount = appliedDiscount ? (appliedDiscount.discount_amount || 0) : 0;
  const totalAmount = subtotal + shippingCost - discountAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      alert("Please enter a discount code");
      return;
    }

    setIsApplyingDiscount(true);
    
    try {
      const { request } = await import("../../utils/request");
      const { useAuthStore } = await import("../../store/authStore");
      
      const token = useAuthStore.getState().token;
      
      const response = await request(
        "/api/discount-codes/validate",
        "POST",
        {
          code: discountCode,
          subtotal: subtotal
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAppliedDiscount(response.discount_code);
      alert("Discount code applied successfully!");
      
    } catch (error) {
      console.error("Discount validation error:", error);
      alert(error.response?.data?.error || "Invalid discount code");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  // Generate QR Code for Bakong Payment
  const generateQRCode = async (orderId) => {
    try {
      const { request } = await import("../../utils/request");
      const { useAuthStore } = await import("../../store/authStore");
      const token = useAuthStore.getState().token;

      const response = await request(
        "/api/bakong/generate-qr",
        "POST",
        { 
          order_id: orderId, 
          currency: "USD" 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.success) {
        setQrData(response.data);
        startPaymentStatusCheck(orderId);
      } else {
        alert(response.message || "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  // Check payment status
  const checkPaymentStatus = async (orderId) => {
    if (checkingPayment) return;
    
    setCheckingPayment(true);
    try {
      const { request } = await import("../../utils/request");
      const { useAuthStore } = await import("../../store/authStore");
      const token = useAuthStore.getState().token;

      const response = await request(
        `/api/bakong/payment-status/${orderId}`,
        "GET",
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.success && response.data?.order_status === "paid") {
        setPaymentStatus("completed");
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${orderId}`;
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    } finally {
      setCheckingPayment(false);
    }
  };

  // Start automatic payment status checking
  const startPaymentStatusCheck = (orderId) => {
    const interval = setInterval(() => {
      if (paymentStatus !== "completed") {
        checkPaymentStatus(orderId);
      } else {
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds

    // Store interval ID to clear on unmount
    return () => clearInterval(interval);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { request } = await import("../../utils/request");
      const { useAuthStore } = await import("../../store/authStore");

      const token = useAuthStore.getState().token;

      const orderData = {
        payment_method: formData.paymentMethod,
        discount_code: appliedDiscount?.code || null,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zip_code: formData.zipCode,
        }
      };

      const response = await request(
        "/api/orders",
        "POST",
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Handle based on payment method
      if (formData.paymentMethod === 'bakong') {
        // Show QR modal for Bakong payment
        setCurrentOrder(response.order);
        setShowQRModal(true);
        await generateQRCode(response.order.id);
      } else {
        // Redirect for other payment methods
        window.location.href = `/order-success?orderId=${response.order.id}`;
      }

    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.response?.data?.error || "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Please sign in to checkout
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/add-to-cart"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bakong"
                      checked={formData.paymentMethod === "bakong"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <span className="font-medium">Bakong QR</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === "paypal"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span>PayPal</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {/* Discount Code */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Discount Code
                </h2>
                {appliedDiscount ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                            {appliedDiscount.code}
                          </span>
                          <span className="text-sm text-green-600">Applied!</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">{appliedDiscount.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Enter discount code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyDiscount())}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim() || isApplyingDiscount}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isApplyingDiscount ? "Applying..." : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${isSubmitting
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
              >
                {isSubmitting ? "Processing..." : "Complete Order"}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={(() => {
                      const images = item.book?.images_url;
                      if (typeof images === 'string') {
                        try {
                          const parsed = JSON.parse(images);
                          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "/placeholder-book.jpg";
                        } catch {
                          return "/placeholder-book.jpg";
                        }
                      }
                      return Array.isArray(images) && images.length > 0 ? images[0] : "/placeholder-book.jpg";
                    })()}
                    alt={item.book?.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.book?.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {item.book?.author_name}
                    </p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(() => {
                        const price = parseFloat(item.book?.price || 0);
                        const discountValue = parseFloat(item.book?.discount_value || 0);
                        const discountType = item.book?.discount_type;

                        let finalPrice = price;
                        if (discountType === "percentage" && discountValue > 0) {
                          finalPrice = price - (price * discountValue) / 100;
                        } else if (discountType === "fixed" && discountValue > 0) {
                          finalPrice = Math.max(0, price - discountValue);
                        }

                        return (finalPrice * item.quantity).toFixed(2);
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              {appliedDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span >Discount ({appliedDiscount.code})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3">
                <span>Total</span>
                <span className="text-teal-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-6">
              <LockClosedIcon className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {paymentStatus === "completed" ? "Payment Successful!" : "Scan to Pay"}
              </h2>
              {paymentStatus !== "completed" && (
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrData(null);
                    setPaymentStatus("pending");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {paymentStatus === "completed" ? (
                // Success State
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h3>
                  <p className="text-gray-600 mb-4">
                    Your payment has been successfully processed.
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirecting to order details...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
                </div>
              ) : qrData ? (
                // QR Code Display
                <div className="text-center">
                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-xl inline-block shadow-inner border-4 border-gray-100 mb-6">
                    <QRCodeSVG 
                      value={qrData.qr_string} 
                      size={240}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
                    <p className="text-4xl font-bold text-blue-600">
                      ${parseFloat(qrData.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Order #{qrData.bill_number}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <ClockIcon className="w-5 h-5 text-blue-600 animate-pulse" />
                      <p className="text-sm font-medium text-blue-800">
                        Waiting for payment...
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Checking status automatically
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 text-left">
                    <h4 className="font-semibold text-gray-900 mb-3 text-center">How to Pay</h4>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                          1
                        </span>
                        <span>Open your Bakong app</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                          2
                        </span>
                        <span>Tap "Scan QR" or camera icon</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                          3
                        </span>
                        <span>Scan the QR code above</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                          4
                        </span>
                        <span>Confirm payment in your app</span>
                      </li>
                    </ol>
                  </div>

                  {/* Manual Check Button */}
                  <button
                    onClick={() => checkPaymentStatus(currentOrder.id)}
                    disabled={checkingPayment}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {checkingPayment ? "Checking..." : "Check Payment Status"}
                  </button>
                </div>
              ) : (
                // Loading State
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating QR code...</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {paymentStatus !== "completed" && qrData && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
                <p className="text-xs text-gray-500 text-center">
                  This page will automatically update when payment is received
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;