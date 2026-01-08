"use client";

import { useState } from "react";
import { Plus, Loader2, Upload, FileText, Image } from "lucide-react";

export default function AddBookForm({ 
  genres, 
  onAddBook, 
  loading, 
  error 
}) {
  const [newBook, setNewBook] = useState({
    title: "",
    genre_id: "",
    price: "",
    stock: "",
    images: [],
    pdf_file: null,
    description: "",
    status: "pending",
    discount_type: "",
    discount_value: "",
    publication_date: "",
    page_count: "",
    about_author: "",
    publisher: "",
    author_name: "",
  });

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
  };

  const handlePdfChangeNewBook = (e) => {
    setNewBook((prev) => ({ ...prev, pdf_file: e.target.files[0] }));
  };

  const handleSubmit = async () => {
    if (!newBook.title.trim() || !newBook.genre_id || !newBook.price) {
      alert("Please fill in required fields: Title, Genre, and Price.");
      return;
    }

    try {
      await onAddBook(newBook);
      
      // Reset form fields
      setNewBook({
        title: "",
        genre_id: "",
        price: "",
        stock: "",
        images: [],
        pdf_file: null,
        description: "",
        status: "pending",
        discount_type: "",
        discount_value: "",
        publication_date: "",
        page_count: "",
        about_author: "",
        publisher: "",
        author_name: "",
      });

      // Reset file inputs
      const imageInput = document.querySelector('input[type="file"][multiple]');
      const pdfInput = document.querySelector('input[type="file"][accept=".pdf"]');
      if (imageInput) imageInput.value = '';
      if (pdfInput) pdfInput.value = '';
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      <h3 className="text-lg lg:text-xl font-semibold mb-6 text-gray-700 flex items-center">
        <Plus className="w-5 h-5 mr-2" />
        Add New Book
      </h3>

      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Select up to 5 images for your book
            </p>
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

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add New Book
          </button>
        </div>
      </div>
    </div>
  );
}