"use client";

import { useState } from "react";
import { Plus, Loader2, FileText, Image, X, Shield } from "lucide-react";
import { useUploadStore } from "../../../store/upload";

export default function AdminAddBookForm({ 
  genres, 
  onAddBook, 
  loading, 
  error
}) {
  const { uploadFile, uploadMultipleFiles, uploading, uploadProgress, error: uploadError, resetUpload } = useUploadStore();
  
  const [newBook, setNewBook] = useState({
    title: "",
    genre_id: "",
    price: "",
    stock: "",
    images: [],
    pdf_file: null,
    description: "",
    status: "approved", // Admin can directly approve
    discount_type: "",
    discount_value: "",
    publication_date: "",
    page_count: "",
    about_author: "",
    publisher: "",
    author_name: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [uploadStep, setUploadStep] = useState(null);

  const handleChangeNewBook = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesChangeNewBook = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert("You can only upload up to 5 images");
      return;
    }
    
    setNewBook((prev) => ({ ...prev, images: files }));
    
    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImagePreviews(previews);
  };

  const handlePdfChangeNewBook = (e) => {
    const file = e.target.files[0];
    setNewBook((prev) => ({ ...prev, pdf_file: file }));
    
    // Create PDF preview info
    if (file) {
      setPdfPreview({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) // Size in MB
      });
    } else {
      setPdfPreview(null);
    }
  };

  const removeImagePreview = (index) => {
    const newImages = newBook.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setNewBook((prev) => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
    
    // Update file input
    const imageInput = document.querySelector('input[type="file"][multiple]');
    if (imageInput && newImages.length === 0) {
      imageInput.value = '';
    }
  };

  const removePdfPreview = () => {
    setNewBook((prev) => ({ ...prev, pdf_file: null }));
    setPdfPreview(null);
    
    // Clear file input
    const pdfInput = document.querySelector('input[type="file"][accept=".pdf"]');
    if (pdfInput) pdfInput.value = '';
  };

  const handleSubmit = async () => {
    if (!newBook.title.trim() || !newBook.genre_id || !newBook.price) {
      alert("Please fill in required fields: Title, Genre, and Price.");
      return;
    }

    try {
      resetUpload();
      let imageUrls = [];
      let pdfUrl = null;

      // Step 1: Upload images if any
      if (newBook.images && newBook.images.length > 0) {
        setUploadStep("Uploading images...");
        const imageResults = await uploadMultipleFiles(newBook.images, '/books/images');
        imageUrls = imageResults.map(result => result.url);
      }

      // Step 2: Upload PDF if any
      if (newBook.pdf_file) {
        setUploadStep("Uploading PDF...");
        const pdfResult = await uploadFile(newBook.pdf_file, '/books/pdfs');
        pdfUrl = pdfResult.url;
      }

      // Step 3: Create book with uploaded URLs
      setUploadStep("Creating book...");
      const bookData = {
        ...newBook,
        images_url: imageUrls,
        pdf_file_url: pdfUrl,
      };

      // Remove file objects from bookData since we now have URLs
      delete bookData.images;
      delete bookData.pdf_file;

      await onAddBook(bookData);
      
      // Reset form fields
      setNewBook({
        title: "",
        genre_id: "",
        price: "",
        stock: "",
        images: [],
        pdf_file: null,
        description: "",
        status: "approved",
        discount_type: "",
        discount_value: "",
        publication_date: "",
        page_count: "",
        about_author: "",
        publisher: "",
        author_name: "",
      });

      // Clear previews
      setImagePreviews([]);
      setPdfPreview(null);
      setUploadStep(null);

      // Reset file inputs
      const imageInput = document.querySelector('input[type="file"][multiple]');
      const pdfInput = document.querySelector('input[type="file"][accept=".pdf"]');
      if (imageInput) imageInput.value = '';
      if (pdfInput) pdfInput.value = '';
    } catch (error) {
      console.error("Error adding book:", error);
      setUploadStep(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      <h3 className="text-lg lg:text-xl font-semibold mb-6 text-gray-700 flex items-center">
        <Plus className="w-5 h-5 mr-2" />
        Add New Book (Admin)
      </h3>

      <div className="space-y-6">
        {/* Admin Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800 font-medium">
              Admin Mode: Creating books for admin account. Authors manage their books separately.
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Book Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              placeholder="Enter Title"
              value={newBook.title}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre <span className="text-red-500">*</span>
            </label>
            <select
              name="genre_id"
              value={newBook.genre_id}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Genre</option>
              {(genres || []).map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="e.g., 19.99"
              value={newBook.price}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              name="stock"
              type="number"
              placeholder="e.g., 50"
              value={newBook.stock}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Author & Publisher Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Name
            </label>
            <input
              name="author_name"
              type="text"
              placeholder="Author Name"
              value={newBook.author_name}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publisher
            </label>
            <input
              name="publisher"
              type="text"
              placeholder="Publisher Name"
              value={newBook.publisher}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={newBook.status}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publication Date
            </label>
            <input
              name="publication_date"
              type="date"
              value={newBook.publication_date}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Count
            </label>
            <input
              name="page_count"
              type="number"
              placeholder="Total Pages"
              value={newBook.page_count}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Book Images (1-5 images)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select up to 5 images for the book
            </p>
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                        {preview.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              PDF File
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload the book PDF file
            </p>
            
            {/* PDF Preview */}
            {pdfPreview && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">PDF Selected:</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdfPreview.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pdfPreview.size} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePdfPreview}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remove PDF"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="A detailed summary of the book content..."
              value={newBook.description}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Author
            </label>
            <textarea
              name="about_author"
              rows={4}
              placeholder="Biography or relevant information about the author..."
              value={newBook.about_author}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Discount Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value
            </label>
            <input
              name="discount_value"
              type="number"
              step="0.01"
              placeholder="e.g., 5 or 10"
              value={newBook.discount_value}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type
            </label>
            <select
              name="discount_type"
              value={newBook.discount_type}
              onChange={handleChangeNewBook}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Type</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
        </div>

        {/* Error messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Upload Error: {uploadError}
          </div>
        )}

        {/* Upload Progress */}
        {(uploading || uploadStep) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {uploadStep || "Uploading files..."}
                </p>
                {uploading && (
                  <div className="mt-2">
                    <div className="bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {Math.round(uploadProgress)}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {(loading || uploading) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : loading ? "Creating..." : "Add New Book"}
          </button>
        </div>
      </div>
    </div>
  );
}