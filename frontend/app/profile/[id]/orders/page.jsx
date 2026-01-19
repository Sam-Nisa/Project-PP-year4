"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  TruckIcon,
  XCircleIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../../store/authStore";

export default function OrderHistoryPage() {
  const params = useParams();
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchOrders();
    }
  }, [user, token]);

  const fetchOrders = async () => {
    try {
      const { request } = await import("../../../utils/request");
      
      const response = await request(
        "/api/orders",
        "GET",
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.orders) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      paid: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="w-5 h-5" />;
      case "processing":
        return <ShoppingBagIcon className="w-5 h-5" />;
      case "shipped":
        return <TruckIcon className="w-5 h-5" />;
      case "delivered":
      case "paid":
        return <CheckCircleIcon className="w-5 h-5" />;
      case "cancelled":
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

const handleDeleteOrder = async () => {
  if (!orderToDelete) return;

  setDeleting(true);
  try {
    const { request } = await import("../../../utils/request");

    await request(
      `/api/orders/${orderToDelete.id}`,
      "DELETE",
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Remove from list
    setOrders(orders.filter(o => o.id !== orderToDelete.id));
    setShowDeleteModal(false);
    setOrderToDelete(null);

    // ✅ Toast success
    toast.success("Order deleted successfully");
  } catch (error) {
    console.error("Error deleting order:", error);

    // ❌ Toast error
    toast.error(error.response?.data?.error || "Failed to delete order");
  } finally {
    setDeleting(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">View and track all your orders</p>
        </div>

        {orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          // Orders List
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{String(order.id).padStart(6, '0')}
                      </h3>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {order.payment_method}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                    {order.items && order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex-shrink-0">
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
                      </div>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          +{order.items.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.items?.length || 0} item(s)
                  </p>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({order.discount_code}):</span>
                      <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    
                    {(order.status === 'pending' || order.status === 'cancelled') && (
                     <button
                      onClick={() => confirmDelete(order)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                    )}
                  </div>
                  
                  {order.payment_method === 'bakong' && order.status === 'pending' && (
                    <Link
                      href={`/payment/${order.id}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span>Complete Payment</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                Order Details #{String(selectedOrder.id).padStart(6, '0')}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Order Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="capitalize">{selectedOrder.status}</span>
                  </span>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
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
                        <h4 className="font-medium text-gray-900">{item.book?.title}</h4>
                        <p className="text-sm text-gray-600">by {item.book?.author_name}</p>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${parseFloat(item.total).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${parseFloat(item.price).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(() => {
                      const address = typeof selectedOrder.shipping_address === 'string' 
                        ? JSON.parse(selectedOrder.shipping_address) 
                        : selectedOrder.shipping_address;
                      return (
                        <>
                          <p className="font-medium text-gray-900">
                            {address.first_name} {address.last_name}
                          </p>
                          <p className="text-gray-600">{address.email}</p>
                          <p className="text-gray-600">{address.address}</p>
                          <p className="text-gray-600">
                            {address.city}, {address.zip_code}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  {selectedOrder.discount_amount && parseFloat(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({selectedOrder.discount_code}):</span>
                      <span>-${parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-blue-600">${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900 capitalize">{selectedOrder.payment_method}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <XCircleIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Delete Order</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete order #{String(orderToDelete.id).padStart(6, '0')}? 
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
