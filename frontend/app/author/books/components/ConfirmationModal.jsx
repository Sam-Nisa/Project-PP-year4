"use client";

import { Trash2 } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <br />
            <strong className="text-red-700">{title}</strong>?<br />
            This action cannot be undone.
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
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Book
          </button>
        </div>
      </div>
    </div>
  );
}