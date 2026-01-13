"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

export default function AdminConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  type = "delete", // delete, approve, reject
  loading = false
}) {
  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'approve':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-green-500" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          title: 'Approve Book',
          message: 'Are you sure you want to approve this book?',
          bookTitle: title,
          actionText: 'Yes, Approve Book',
          description: 'This book will be visible to all users and available for purchase.'
        };
      case 'reject':
        return {
          icon: <X className="w-12 h-12 text-orange-500" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          title: 'Reject Book',
          message: 'Are you sure you want to reject this book?',
          bookTitle: title,
          actionText: 'Yes, Reject Book',
          description: 'This book will be hidden from users and marked as rejected.'
        };
      default: // delete
        return {
          icon: <Trash2 className="w-12 h-12 text-red-500" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          title: 'Delete Book',
          message: 'Are you sure you want to permanently delete this book?',
          bookTitle: title,
          actionText: 'Yes, Delete Book',
          description: 'This action cannot be undone. All associated data will be permanently removed.'
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-in zoom-in-95">
        {/* Header/Icon */}
        <div className="p-6 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 ${config.bgColor} rounded-full flex items-center justify-center`}>
            {config.icon}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {config.title}
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {config.message}
            </p>
            
            {config.bookTitle && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-sm font-medium text-gray-900 truncate" title={config.bookTitle}>
                  "{config.bookTitle}"
                </p>
              </div>
            )}
            
            <p className={`text-xs ${config.textColor} font-medium`}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${config.buttonColor}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              config.actionText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}