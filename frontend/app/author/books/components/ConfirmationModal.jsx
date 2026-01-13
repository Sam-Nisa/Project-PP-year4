"use client";

import { Trash2 } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  type = 'delete',
  loading = false
}) {
  if (!isOpen) return null;

  const getActionText = () => {
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      default:
        return 'Confirm';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700';
      case 'approve':
        return 'bg-green-600 hover:bg-green-700';
      case 'reject':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm {getActionText()}</h3>
          <p className="text-sm text-gray-600">
            Are you sure you want to {type} <br />
            <strong className="text-red-700">{title}</strong>?<br />
            {type === 'delete' ? 'This action cannot be undone.' : `This will ${type} the book.`}
          </p>
        </div>
        <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${getButtonColor()}`}
          >
            {loading ? 'Processing...' : `${getActionText()} Book`}
          </button>
        </div>
      </div>
    </div>
  );
}