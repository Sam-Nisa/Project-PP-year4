"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useAddToCartStore } from "../../store/useAddToCardStore";
import { useAuthStore } from "../../store/authStore";
import KHQRModal from "../../component/KHQRModal";

const CheckoutPage = () => {
  const { user } = useAuthStore();
  const { cartItems, fetchCart } = useAddToCartStore();
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState(null);

  // Check if this is a "Buy Now" checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const buyNowFlag = urlParams.get('buyNow');
    
    if (buyNowFlag === 'true') {
      const storedProduct = sessionStorage.getItem('buyNowProduct');
      if (storedProduct) {
        try {
          const productData = JSON.parse(storedProduct);
          setBuyNowProduct(productData);
          setIsBuyNow(true);
        } catch (error) {
          console.error('Error parsing buy now product:', error);
          setIsBuyNow(false);
        }
      }
    } else {
      setIsBuyNow(false);
      setBuyNowProduct(null);
    }
  }, []);

  // Use either buy now product or cart items
  const checkoutItems = useMemo(() => {
    return isBuyNow && buyNowProduct ? [buyNowProduct] : cartItems;
  }, [isBuyNow, buyNowProduct, cartItems]);

  // Check if cart has multiple vendors (authors)
  const isMultiVendor = useMemo(() => {
    if (!checkoutItems || checkoutItems.length === 0) return false;
    
    const authorIds = new Set();
    checkoutItems.forEach(item => {
      const book = item.book || item;
      if (book.author_id) {
        authorIds.add(book.author_id);
      }
    });
    
    return authorIds.size > 1;
  }, [checkoutItems]);

  // Get unique authors for display
  const uniqueAuthors = useMemo(() => {
    if (!checkoutItems || checkoutItems.length === 0) return [];
    
    const authorsMap = new Map();
    checkoutItems.forEach(item => {
      const book = item.book || item;
      if (book.author_id && book.author_name) {
        authorsMap.set(book.author_id, book.author_name);
      }
    });
    
    return Array.from(authorsMap.values());
  }, [checkoutItems]);

  // Calculate subtotal from checkout items
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => {
      const price = parseFloat(item.book?.price || item.price || 0);
      const discountValue = parseFloat(item.book?.discount_value || item.discount_value || 0);
      const discountType = item.book?.discount_type || item.discount_type;

      let finalPrice = price;
      if (discountType === "percentage" && discountValue > 0) {
        finalPrice = price - (price * discountValue) / 100;
        // Round to 2 decimal places to avoid floating-point precision issues
        finalPrice = Math.round(finalPrice * 100) / 100;
      } else if (discountType === "fixed" && discountValue > 0) {
        finalPrice = Math.max(0, price - discountValue);
        // Round to 2 decimal places to avoid floating-point precision issues
        finalPrice = Math.round(finalPrice * 100) / 100;
      }

      const itemTotal = finalPrice * (item.quantity || 1);
      // Round the item total to avoid accumulating precision errors
      return total + Math.round(itemTotal * 100) / 100;
    }, 0);
  }, [checkoutItems]);

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
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [qrData, setQrData] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, completed, failed
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckCount, setPaymentCheckCount] = useState(0);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentIntervalId, setPaymentIntervalId] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    if (user) {
      // Only fetch cart if not in buy now mode
      if (!isBuyNow) {
        fetchCart();
      }
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
      }));
    }
  }, [user, fetchCart, isBuyNow]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const shippingCost = 0; // FREE SHIPPING
  const discountAmount = appliedDiscount ? (appliedDiscount.discount_amount || 0) : 0;
  const totalAmount = Math.round((subtotal + shippingCost - discountAmount) * 100) / 100;

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

        // ⏳ Calculate remaining time from backend expires_at
        const expiresAt = new Date(response.data.expires_at).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(Math.floor((expiresAt - now) / 1000), 0);

        setTimeLeft(diffSeconds);

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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

  // Countdown timer effect
  useEffect(() => {
    if (!showQRModal || paymentStatus !== "pending" || !qrData) return;

    if (timeLeft <= 0) {
      setPaymentStatus("failed");
      setPaymentError("QR code expired. Please generate a new QR code.");
      stopPaymentStatusCheck();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showQRModal, paymentStatus, qrData]);


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
      
      // Generate QR code first, then show modal only if successful
      setIsGeneratingQR(true);
      console.log("Generating QR code for order:", response.order.id);
      const { request: qrRequest } = await import("../../utils/request");
      const qrToken = useAuthStore.getState().token;

      const qrResponse = await qrRequest(
        "/api/bakong/generate-qr",
        "POST",
        { 
          order_id: response.order.id, 
          currency: "USD" 
        },
        { headers: { Authorization: `Bearer ${qrToken}` } }
      );

      setIsGeneratingQR(false);

      if (qrResponse.success) {
        // Set QR data first
        setQrData(qrResponse.data);

        // Calculate remaining time from backend expires_at
        const expiresAt = new Date(qrResponse.data.expires_at).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(Math.floor((expiresAt - now) / 1000), 0);

        setTimeLeft(diffSeconds);
        setPaymentStatus("pending");
        setPaymentError(null);
        setPaymentCheckCount(0);

        // Now show the modal with QR data ready
        setShowQRModal(true);
        
        console.log("Starting payment status check...");
        startPaymentStatusCheck(response.order.id);
      } else {
        // QR generation failed, show error
        setPaymentStatus("failed");
        setPaymentError(qrResponse.message || "Failed to generate QR code");
        setShowQRModal(true);
      }

      // Clear buy now product from session storage after successful order creation
      if (isBuyNow) {
        sessionStorage.removeItem('buyNowProduct');
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

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {isBuyNow ? "No product selected" : "Your cart is empty"}
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
            href={isBuyNow ? `/book/${buyNowProduct?.id}` : "/add-to-cart"}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>{isBuyNow ? "Back to Product" : "Back to Cart"}</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isBuyNow ? "Buy Now - Checkout" : "Checkout"}
          </h1>
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
                disabled={isSubmitting || isGeneratingQR}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${isSubmitting || isGeneratingQR
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
              >
                {isSubmitting ? "Processing..." : isGeneratingQR ? "Generating QR..." : "Complete Order"}
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
              {checkoutItems.map((item, index) => {
                // Handle both cart items and buy now products
                const book = item.book || item; // For buy now, item IS the book
                const quantity = item.quantity || 1;
                
                return (
                  <div key={item.id || index} className="flex items-center space-x-4">
                    <img
                      src={(() => {
                        const images = book.images_url;
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
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {book.author_name}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(() => {
                          const price = parseFloat(book.price || 0);
                          const discountValue = parseFloat(book.discount_value || 0);
                          const discountType = book.discount_type;

                          let finalPrice = price;
                          if (discountType === "percentage" && discountValue > 0) {
                            finalPrice = price - (price * discountValue) / 100;
                            // Round to 2 decimal places to avoid floating-point precision issues
                            finalPrice = Math.round(finalPrice * 100) / 100;
                          } else if (discountType === "fixed" && discountValue > 0) {
                            finalPrice = Math.max(0, price - discountValue);
                            // Round to 2 decimal places to avoid floating-point precision issues
                            finalPrice = Math.round(finalPrice * 100) / 100;
                          }

                          const itemTotal = finalPrice * quantity;
                          return (Math.round(itemTotal * 100) / 100).toFixed(2);
                        })()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Info */}
            {checkoutItems.length > 0 && (
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
                ) : isMultiVendor ? (
                  <div>
                    <p className="text-sm text-blue-700">
                      <strong>Multi-Vendor Order</strong> - Payment will go to Admin Account
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Merchant: NISA SAM • Account: nisa_sam@bkrt
                    </p>
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="text-xs text-blue-800 font-medium">📚 Authors in this order:</p>
                      <p className="text-xs text-blue-700">
                        {uniqueAuthors.join(', ')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Admin will distribute payments to each author
                      </p>
                    </div>
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
                    {isBuyNow && buyNowProduct && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        📦 Buy Now: {buyNowProduct.title}
                      </p>
                    )}
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

      {/* KHQR Modal */}
      <KHQRModal
        showModal={showQRModal}
        onClose={() => {
          console.log("Closing QR modal");
          stopPaymentStatusCheck();
          setShowQRModal(false);
          setQrData(null);
          setPaymentStatus("pending");
          setPaymentError(null);
          setPaymentCheckCount(0);
        }}
        qrData={qrData}
        timeLeft={timeLeft}
        formatTime={formatTime}
        paymentStatus={paymentStatus}
        paymentError={paymentError}
        paymentCheckCount={paymentCheckCount}
        checkingPayment={checkingPayment}
        onCheckPayment={() => checkPaymentStatus(currentOrder.id)}
        onRetry={async () => {
          console.log("Retrying payment...");
          setIsGeneratingQR(true);
          setPaymentStatus("pending");
          setPaymentError(null);
          setPaymentCheckCount(0);
          setQrData(null);
          setTimeLeft(0);
          
          try {
            const { request: retryRequest } = await import("../../utils/request");
            const { useAuthStore } = await import("../../store/authStore");
            const retryToken = useAuthStore.getState().token;

            const retryResponse = await retryRequest(
              "/api/bakong/generate-qr",
              "POST",
              { 
                order_id: currentOrder.id, 
                currency: "USD" 
              },
              { headers: { Authorization: `Bearer ${retryToken}` } }
            );

            setIsGeneratingQR(false);

            if (retryResponse.success) {
              setQrData(retryResponse.data);

              const expiresAt = new Date(retryResponse.data.expires_at).getTime();
              const now = Date.now();
              const diffSeconds = Math.max(Math.floor((expiresAt - now) / 1000), 0);

              setTimeLeft(diffSeconds);
              setPaymentStatus("pending");
              setPaymentError(null);
              setPaymentCheckCount(0);
              
              console.log("Starting payment status check...");
              startPaymentStatusCheck(currentOrder.id);
            } else {
              setPaymentStatus("failed");
              setPaymentError(retryResponse.message || "Failed to generate QR code");
            }
          } catch (error) {
            console.error("Retry error:", error);
            setIsGeneratingQR(false);
            setPaymentStatus("failed");
            setPaymentError("Failed to generate QR code. Please try again.");
          }
        }}
        isGeneratingQR={isGeneratingQR}
      />
    </div>
  );
};

export default CheckoutPage;