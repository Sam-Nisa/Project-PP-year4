"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";
import { request } from "../../../utils/request";

export default function BakongPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const orderId = params.orderId;

  const [qrData, setQrData] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [error, setError] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      const response = await request(
        `/api/orders/${orderId}`,
        "GET",
        null,
        {},
        token
      );

      if (response.order) {
        setOrder(response.order);
        
        // Check if order already has QR code
        if (response.order.payment_qr_code) {
          setQrData({
            qr_string: response.order.payment_qr_code,
            md5: response.order.payment_qr_md5,
            amount: response.order.total_amount,
            currency: "USD",
            order_id: response.order.id,
            bill_number: `ORD-${String(response.order.id).padStart(6, '0')}`
          });
        }

        // Check payment status
        if (response.order.payment_status === "completed" || response.order.status === "paid") {
          setPaymentStatus("completed");
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  // Generate QR code
  const generateQRCode = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await request(
        "/api/bakong/generate-qr",
        "POST",
        { 
          order_id: parseInt(orderId), 
          currency: "USD" 
        },
        {},
        token
      );

      if (response.success) {
        setQrData(response.data);
        // Start checking payment status
        startPaymentStatusCheck();
      } else {
        setError(response.message || "Failed to generate QR code");
      }
    } catch (err) {
      console.error("Error generating QR:", err);
      setError(err.response?.data?.message || "Failed to generate QR code. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    if (checkingPayment) return;
    
    setCheckingPayment(true);
    try {
      const response = await request(
        `/api/bakong/payment-status/${orderId}`,
        "GET",
        null,
        {},
        token
      );

      if (response.success) {
        if (response.data.order_status === "paid") {
          setPaymentStatus("completed");
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            router.push(`/order-success?orderId=${orderId}`);
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error checking payment:", err);
    } finally {
      setCheckingPayment(false);
    }
  };

  // Start automatic payment status checking
  const startPaymentStatusCheck = () => {
    const interval = setInterval(() => {
      if (paymentStatus !== "completed") {
        checkPaymentStatus();
      } else {
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (!token || !user) {
      router.push("/login");
      return;
    }

    fetchOrder();
  }, [token, user, fetchOrder, router]);

  useEffect(() => {
    if (qrData && paymentStatus === "pending") {
      const cleanup = startPaymentStatusCheck();
      return cleanup;
    }
  }, [qrData, paymentStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been confirmed. Redirecting to order details...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/add-to-cart"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pay with Bakong</h1>
          <p className="text-gray-600 mt-2">
            Order #{String(orderId).padStart(6, '0')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {!qrData ? (
              <div className="text-center">
                <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Generate Payment QR Code
                </h2>
                <p className="text-gray-600 mb-6">
                  Click the button below to generate your Bakong QR code for payment
                </p>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                <button
                  onClick={generateQRCode}
                  disabled={generating}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                    generating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {generating ? (
                    <span className="flex items-center justify-center">
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate QR Code"
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Scan to Pay
                </h2>
                
                {/* QR Code */}
                <div className="bg-white p-6 rounded-xl inline-block shadow-inner border-4 border-gray-100 mb-6">
                  <QRCodeSVG 
                    value={qrData.qr_string} 
                    size={280}
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
                    {qrData.bill_number}
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-blue-600 animate-pulse" />
                    <p className="text-sm font-medium text-blue-800">
                      Waiting for payment...
                    </p>
                  </div>
                </div>

                {/* Manual Check Button */}
                <button
                  onClick={checkPaymentStatus}
                  disabled={checkingPayment}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {checkingPayment ? "Checking..." : "Check Payment Status"}
                </button>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {parseFloat(order.shipping_cost) === 0 ? "Free" : `$${parseFloat(order.shipping_cost).toFixed(2)}`}
                  </span>
                </div>
                {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-blue-600">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How to Pay
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </span>
                  <span>Open your Bakong app on your mobile device</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </span>
                  <span>Tap on "Scan QR" or the camera icon</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </span>
                  <span>Scan the QR code displayed on this page</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    4
                  </span>
                  <span>Confirm the payment amount and complete the transaction</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    5
                  </span>
                  <span>Wait for confirmation - you'll be redirected automatically</span>
                </li>
              </ol>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                If you're having trouble with payment, please contact our support team.
              </p>
              <div className="flex space-x-3">
                <Link
                  href="/"
                  className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel Order
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
