"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LockClosedIcon, XMarkIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
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
    country: "",
    zipCode: "", // Add zip code field
    paymentMethod: "bakong", // Default to Bakong
  });

  const [errors, setErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // QR Code Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, completed, failed
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckCount, setPaymentCheckCount] = useState(0);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentIntervalId, setPaymentIntervalId] = useState(null);

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
      console.log("Generating QR code for order:", orderId);
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

      console.log("QR generation response:", response);

      if (response.success) {
        setQrData(response.data);
        setPaymentStatus("pending");
        setPaymentError(null);
        setPaymentCheckCount(0);
        console.log("Starting payment status check...");
        startPaymentStatusCheck(orderId);
      } else {
        console.error("QR generation failed:", response);
        setPaymentStatus("failed");
        setPaymentError(response.message || "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR:", error);
      setPaymentStatus("failed");
      setPaymentError(error.response?.data?.message || "Failed to generate QR code. Please try again.");
    }
  };

  // Check payment status
  const checkPaymentStatus = async (orderId) => {
    if (checkingPayment) {
      console.log("Already checking payment, skipping...");
      return;
    }
    
    setCheckingPayment(true);
    setPaymentCheckCount(prev => {
      const newCount = prev + 1;
      console.log(`Checking payment status (attempt ${newCount})...`);
      return newCount;
    });
    
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

      console.log("Payment status response:", response);

      if (response.success && response.data?.payment_status === "completed") {
        console.log("✅ Payment confirmed!");
        setPaymentStatus("completed");
        setPaymentError(null);
        stopPaymentStatusCheck();
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${orderId}`;
        }, 2000);
      } else if (paymentCheckCount >= 60) {
        // After 60 checks (5 minutes), consider it failed
        console.log("❌ Payment timeout after 60 checks");
        setPaymentStatus("failed");
        setPaymentError("Payment timeout. Please try again or contact support.");
        stopPaymentStatusCheck();
      } else {
        console.log("⏳ Payment still pending...");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      
      // Handle case where order was deleted due to expiration
      if (error.response?.status === 410) {
        console.log("❌ Order expired and was deleted");
        setPaymentStatus("failed");
        setPaymentError("Payment expired. The order has been cancelled. Please try again.");
        stopPaymentStatusCheck();
        return;
      }
      
      // Don't set as failed immediately for other errors, might be network issue
      if (paymentCheckCount >= 60) {
        console.log("❌ Payment check failed after 60 attempts");
        setPaymentStatus("failed");
        setPaymentError("Unable to verify payment status. Please contact support.");
        stopPaymentStatusCheck();
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  // Start automatic payment status checking
  const startPaymentStatusCheck = (orderId) => {
    // Clear any existing interval
    if (paymentIntervalId) {
      clearInterval(paymentIntervalId);
    }

    // Check immediately first time
    checkPaymentStatus(orderId);

    // Then check every 5 seconds
    const interval = setInterval(() => {
      checkPaymentStatus(orderId);
    }, 5000);

    setPaymentIntervalId(interval);
  };

  // Stop payment checking
  const stopPaymentStatusCheck = () => {
    if (paymentIntervalId) {
      clearInterval(paymentIntervalId);
      setPaymentIntervalId(null);
    }
  };

  // Effect to stop checking when payment is completed or failed
  useEffect(() => {
    if (paymentStatus === "completed" || paymentStatus === "failed") {
      stopPaymentStatusCheck();
    }
  }, [paymentStatus]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (paymentIntervalId) {
        clearInterval(paymentIntervalId);
      }
    };
  }, [paymentIntervalId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { request } = await import("../../utils/request");
      const { useAuthStore } = await import("../../store/authStore");

      const token = useAuthStore.getState().token;

      const orderData = {
        payment_method: 'bakong', // Always use Bakong
        discount_code: appliedDiscount?.code || null,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zip_code: formData.zipCode, // Add zip code
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

      // Always show QR modal for Bakong payment
      setCurrentOrder(response.order);
      setShowQRModal(true);
      await generateQRCode(response.order.id);

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
                    disabled
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
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border 
                      ${errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}
                      focus:ring-2 focus:border-transparent`}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                  )}

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
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


                <div className="grid grid-cols-2 gap-4">
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
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
                <div className="mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
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
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code <span className="text-red-500">*</span>
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
                  <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bakong"
                        checked={true}
                        readOnly
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="font-medium text-blue-800">Bakong QR Payment</span>
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Only Available</span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mt-2 ml-6">
                      Secure instant payment via Cambodia's national payment system
                    </p>
                  </div>
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

            {/* Payment Method Info */}
            {cartItems.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm font-medium text-blue-800">Bakong Payment</p>
                </div>
                {appliedDiscount ? (
                  <div>
                    <p className="text-sm text-blue-700">
                      Payment will go to <strong>Admin Account</strong> (discount applied)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Merchant: NISA SAM • Account: nisa_sam@bkrt
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-blue-700">
                      Payment destination will be determined based on book author
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      • Author books → Author's account<br/>
                      • Admin books → Admin account (nisa_sam@bkrt)
                    </p>
                  </div>
                )}
              </div>
            )}

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
                {paymentStatus === "completed" 
                  ? "Payment Successful!" 
                  : paymentStatus === "failed"
                  ? "Payment Failed"
                  : "Scan to Pay"}
              </h2>
              {paymentStatus !== "completed" && (
                <button
                  onClick={() => {
                    console.log("Closing QR modal");
                    stopPaymentStatusCheck();
                    setShowQRModal(false);
                    setQrData(null);
                    setPaymentStatus("pending");
                    setPaymentError(null);
                    setPaymentCheckCount(0);
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
                  <div className="mb-6">
                    <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto animate-bounce" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h3>
                  <p className="text-lg text-gray-600 mb-2">
                    Your payment has been confirmed.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Order #{qrData?.bill_number}
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Payment processed successfully
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Amount: ${parseFloat(qrData?.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Redirecting to order details...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : paymentStatus === "failed" ? (
                // Failed State
                <div className="text-center py-8">
                  <div className="mb-6">
                    <XCircleIcon className="w-24 h-24 text-red-500 mx-auto" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h3>
                  <p className="text-lg text-gray-600 mb-2">
                    {paymentError || "We couldn't process your payment."}
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                      ✗ Payment was not completed
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Please try again or use a different payment method
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        console.log("Retrying payment...");
                        setPaymentStatus("pending");
                        setPaymentError(null);
                        setPaymentCheckCount(0);
                        setQrData(null);
                        generateQRCode(currentOrder.id);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => {
                        console.log("Choosing different payment method");
                        stopPaymentStatusCheck();
                        setShowQRModal(false);
                        setQrData(null);
                        setPaymentStatus("pending");
                        setPaymentError(null);
                        setPaymentCheckCount(0);
                      }}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Choose Different Payment Method
                    </button>
                    <button
                      onClick={() => {
                        console.log("Viewing orders");
                        stopPaymentStatusCheck();
                        window.location.href = `/profile/${user.id}/orders`;
                      }}
                      className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
                    >
                      View My Orders
                    </button>
                  </div>
                </div>
              ) : qrData ? (
                // QR Code Display (Pending State)
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

                  {/* Account Payment Info */}
                  {qrData.merchant_name && qrData.author_account && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-medium text-green-800">
                          {qrData.account_type === 'admin' 
                            ? 'Payment goes to Admin Account' 
                            : 'Payment goes to Author Account'}
                        </p>
                      </div>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{qrData.merchant_name}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Account: {qrData.author_account}
                      </p>
                      {qrData.reason && (
                        <p className="text-xs text-green-600 mt-1">
                          {qrData.reason === 'discount_code_applied' && '(Discount code applied)'}
                          {qrData.reason === 'book_created_by_admin' && '(Book created by admin)'}
                          {qrData.reason === 'regular_author_payment' && '(Author payment)'}
                          {qrData.reason === 'author_account_not_configured' && '(Author account not configured - using admin account)'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <ClockIcon className="w-5 h-5 text-blue-600 animate-pulse" />
                      <p className="text-sm font-medium text-blue-800">
                        Waiting for payment...
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Checking status automatically ({paymentCheckCount} checks)
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