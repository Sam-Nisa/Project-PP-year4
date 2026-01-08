"use client";

import { Image, FileText } from "lucide-react";

export default function EditBookModal({ 
  isOpen, 
  onClose, 
  book, 
  onSave, 
  genres, 
  setBookData 
}) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert("You can only upload up to 5 images");
      return;
    }
    setBookData((prev) => ({ ...prev, images: files }));
  };

  const handlePdfChange = (e) => {
    setBookData((prev) => ({ ...prev, pdf_file: e.target.files[0] }));
  };

  const getImagePreviews = () => {
    // Check for new files first
    if (book.images && Array.isArray(book.images) && book.images.length > 0) {
      if (book.images[0] instanceof File) {
        return book.images.map(file => URL.createObjectURL(file));
      }
    }
    
    // Return existing images from server
    if (book.images_url && Array.isArray(book.images_url) && book.images_url.length > 0) {
      return book.images_url;
    }
    
    // Fallback to cover_image_url if available
    if (book.cover_image_url) {
      return [book.cover_image_url];
    }
    
    return [];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold">Edit Book: {book.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Modal Body (Form) */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={book.title || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genre *
                  </label>
                  <select
                    name="genre_id"
                    value={book.genre_id || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Genre</option>
                    {(genres || []).map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={book.price || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock *
                  </label>
                  <input
                    name="stock"
                    type="number"
                    value={book.stock || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={book.status || "pending"}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name
                  </label>
                  <input
                    name="author_name"
                    type="text"
                    value={book.author_name || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publisher
                  </label>
                  <input
                    name="publisher"
                    type="text"
                    value={book.publisher || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Date
                  </label>
                  <input
                    name="publication_date"
                    type="date"
                    value={book.publication_date || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Count
                  </label>
                  <input
                    name="page_count"
                    type="number"
                    value={book.page_count || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    step="0.01"
                    value={book.discount_value || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    value={book.discount_type || ""}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={book.description || ""}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Book description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About Author
                </label>
                <textarea
                  name="about_author"
                  rows={3}
                  value={book.about_author || ""}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="About the author..."
                />
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-6">
              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="inline w-4 h-4 mr-1" />
                  Book Images (1-5 images)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select up to 5 images for your book
                </p>
                
                {/* Image Previews */}
                {getImagePreviews().length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {getImagePreviews().slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                      {getImagePreviews().length > 4 && (
                        <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-600">
                          +{getImagePreviews().length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  PDF File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload the book PDF file
                </p>
                
                {(book.pdf_file || book.pdf_file_url) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-600">
                      📄 {book.pdf_file?.name || "Current PDF file"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(book.id)}
            className="w-full sm:w-auto bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}