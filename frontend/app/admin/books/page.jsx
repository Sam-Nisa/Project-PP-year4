"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Plus, Loader2 } from "lucide-react";
import { useBookStore } from "../../store/useBookStore";
import { useGenreStore } from "../../store/useGenreStore";

const EditModal = ({ isOpen, onClose, book, onSave, genres, setBookData }) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setBookData((prev) => ({ ...prev, cover_image: e.target.files[0] }));
  };
  
  const imagePreviewUrl = book.cover_image 
    ? URL.createObjectURL(book.cover_image) 
    : (book.cover_image_url || null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold">Edit Book: {book.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {/* Modal Body (Form) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Title */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Title</label>
            <input name="title" type="text" value={book.title || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>
          
          {/* Genre */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Genre</label>
            <select name="genre_id" value={book.genre_id || ""} onChange={handleChange} className="border p-2 rounded">
              <option value="">Select Genre</option>
              {(genres || []).map((genre) => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>
          </div>
          
          {/* Price */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Price ($)</label>
            <input name="price" type="number" value={book.price || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>

          {/* Stock */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Stock Quantity</label>
            <input name="stock" type="number" value={book.stock || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>
          
          {/* Publisher */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Publisher</label>
            <input name="publisher" type="text" value={book.publisher || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>

        {/* Author-name */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Author Name</label>
            <input name="author_name" type="text" value={book.author_name || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>
          
          {/* Publication Date */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Publication Date</label>
            <input name="publication_date" type="date" value={book.publication_date || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>

          {/* Page Count */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Page Count</label>
            <input name="page_count" type="number" value={book.page_count || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>
          
          {/* Status */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Book Status</label>
            <select name="status" value={book.status || "pending"} onChange={handleChange} className="border p-2 rounded">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          {/* Discount Value */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Discount Value</label>
            <input name="discount_value" type="number" value={book.discount_value || ""} onChange={handleChange} className="border p-2 rounded" />
          </div>

          {/* Discount Type */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Discount Type</label>
            <select name="discount_type" value={book.discount_type || ""} onChange={handleChange} className="border p-2 rounded">
              <option value="">Select Type</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
          
          {/* Cover Image Handling */}
          <div className="flex flex-col md:col-span-1">
            <label className="mb-1 text-sm font-medium text-gray-700">Change Cover Image</label>
            <input name="cover_image" type="file" accept="image/*" onChange={handleFileChange} className="border p-2 rounded" />
          </div>

          {/* Image Preview */}
          {imagePreviewUrl && (
            <div className="flex flex-col items-center justify-center md:col-span-3 mt-2">
              <span className="text-sm text-gray-500 mb-1">Current/New Image Preview:</span>
              <img 
                src={imagePreviewUrl} 
                alt="Cover Preview" 
                className="w-24 h-24 object-cover rounded shadow"
              />
            </div>
          )}


          {/* Description (Full width) */}
          <div className="flex flex-col col-span-1 md:col-span-3">
            <label className="mb-1 text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              placeholder="A detailed summary of the book content."
              value={book.description || ""}
              onChange={handleChange}
              className="border p-2 rounded min-h-[100px]"
            />
          </div>

          {/* About Author (Full width) */}
          <div className="flex flex-col col-span-1 md:col-span-3">
            <label className="mb-1 text-sm font-medium text-gray-700">About Author</label>
            <textarea
              name="about_author"
              placeholder="Biography or relevant information about the author."
              value={book.about_author || ""}
              onChange={handleChange}
              className="border p-2 rounded min-h-[100px]"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(book.id)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom Confirmation Modal Component (Styled Pop-up)
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        
        {/* Header/Icon */}
        <div className="p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* Warning triangle icon */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.39 17c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Confirm Deletion</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the book: <br />
              <strong className="text-red-700 font-semibold">{title}</strong>? <br />
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 transition"
          >
            Yes, Delete Book
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

export default function BooksPage() {
  const { books = [], loading, error, fetchBooks, createBook, updateBook, deleteBook } = useBookStore();
  const { genres = [], fetchGenres } = useGenreStore();

  const [newBook, setNewBook] = useState({
    title: "", genre_id: "", price: "", stock: "", cover_image: null, description: "",
    status: "pending", discount_type: "", discount_value: "", publication_date: "",
    page_count: "", about_author: "", publisher: "", author_name: "",
  });

  // State for Edit Modal Management
  const [editingBookId, setEditingBookId] = useState(null);
  const [editingBook, setEditingBook] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Confirmation Modal Management (NEW)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null); // Stores the book object pending deletion

  useEffect(() => {
    fetchBooks();
    fetchGenres();
  }, []);

  const handleChangeNewBook = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChangeNewBook = (e) => {
    setNewBook((prev) => ({ ...prev, cover_image: e.target.files[0] }));
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.genre_id || !newBook.price) {
        alert("Please fill in required fields: Title, Genre, and Price.");
        return;
    }
    
    await createBook(newBook);
    
    // Reset form fields
    setNewBook({
      title: "", genre_id: "", price: "", stock: "", cover_image: null, description: "",
      status: "pending", discount_type: "", discount_value: "", publication_date: "",
      page_count: "", about_author: "", publisher: "", author_name: "",
    });
  };

  const handleEdit = (book) => {
    setEditingBookId(book.id);
    
    // Format date for HTML date input (YYYY-MM-DD)
    const formattedDate = book.publication_date ? new Date(book.publication_date).toISOString().split('T')[0] : '';
    
    // Load all current data into the editing state
    setEditingBook({
      ...book,
      // Clear cover_image file input, but keep cover_image_url for preview
      cover_image: null, 
      publication_date: formattedDate,
      discount_type: book.discount_type || "",
      discount_value: book.discount_value || "",
      page_count: book.page_count || "",
      about_author: book.about_author || "",
      publisher: book.publisher || "",
      author_name: book.author_name || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingBookId(null);
    setEditingBook({});
    setIsModalOpen(false);
  }

  const handleUpdate = async (id) => {
    await updateBook(id, editingBook);
    handleCloseModal();
  };

  // 1. Handler to open the custom confirmation modal
  const handleDeleteInitiate = (book) => {
    setBookToDelete(book);
    setIsConfirmModalOpen(true);
  };

  // 2. Handler to close the custom confirmation modal
  const handleCloseConfirmModal = () => {
    setBookToDelete(null);
    setIsConfirmModalOpen(false);
  };

  // 3. Handler to perform the actual deletion
  const handleConfirmDelete = async () => {
    if (bookToDelete) {
        await deleteBook(bookToDelete.id);
    }
    handleCloseConfirmModal(); // Close modal regardless of success
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Book Management Dashboard</h2>

      {/* Add new book section */}
      <div className="mb-8 p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Book</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Row 1: Core Details */}
            <div className="flex flex-col">
              <label htmlFor="book-title" className="mb-1 text-sm font-medium text-gray-700">Book Title *</label>
              <input
                id="book-title"
                name="title"
                type="text"
                placeholder="Enter Title"
                value={newBook.title}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="book-genre" className="mb-1 text-sm font-medium text-gray-700">Genre *</label>
              <select
                id="book-genre"
                name="genre_id"
                value={newBook.genre_id}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">Select Genre</option>
                {(genres || []).map((genre) => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="book-price" className="mb-1 text-sm font-medium text-gray-700">Price ($) *</label>
              <input
                id="book-price"
                name="price"
                type="number"
                placeholder="e.g., 19.99"
                value={newBook.price}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            
            <div className="flex flex-col">
                <label htmlFor="book-status" className="mb-1 text-sm font-medium text-gray-700">Book Status</label>
                <select
                    id="book-status"
                    name="status"
                    value={newBook.status}
                    onChange={handleChangeNewBook}
                    className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
            
            {/* Row 2: Stock & Publication */}
            <div className="flex flex-col">
              <label htmlFor="book-stock" className="mb-1 text-sm font-medium text-gray-700">Stock Quantity</label>
              <input
                id="book-stock"
                name="stock"
                type="number"
                placeholder="e.g., 50"
                value={newBook.stock}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="book-pub-date" className="mb-1 text-sm font-medium text-gray-700">Publication Date</label>
              <input
                id="book-pub-date"
                name="publication_date"
                type="date"
                value={newBook.publication_date}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="book-page-count" className="mb-1 text-sm font-medium text-gray-700">Page Count</label>
              <input
                id="book-page-count"
                name="page_count"
                type="number"
                placeholder="Total Pages"
                value={newBook.page_count}
                onChange={handleChangeNewBook}
                className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="book-cover" className="mb-1 text-sm font-medium text-gray-700">Cover Image</label>
              <input
                id="book-cover"
                type="file"
                accept="image/*"
                onChange={handleFileChangeNewBook}
                className="border p-2 rounded bg-white file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
              />
            </div>

            {/* Row 3: Author & Publisher */}
            <div className="flex flex-col">
                <label htmlFor="book-author_name" className="mb-1 text-sm font-medium text-gray-700">Author Name</label>
                <input
                    id="book-author_name"
                    name="author_name"
                    type="text"
                    placeholder="Author Name"
                    value={newBook.author_name}
                    onChange={handleChangeNewBook}
                    className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
            </div>

            <div className="flex flex-col">
                <label htmlFor="book-publisher" className="mb-1 text-sm font-medium text-gray-700">Publisher</label>
                <input
                    id="book-publisher"
                    name="publisher"
                    type="text"
                    placeholder="Publisher Name"
                    value={newBook.publisher}
                    onChange={handleChangeNewBook}
                    className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
            </div>
            
            {/* Row 4: Discount */}
             <div className="flex flex-col">
                <label htmlFor="discount_value" className="mb-1 text-sm font-medium text-gray-700">Discount Value</label>
                <input 
                    name="discount_value" 
                    type="number" 
                    placeholder="e.g., 5 or 10"
                    value={newBook.discount_value} 
                    onChange={handleChangeNewBook} 
                    className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors" 
                />
            </div>

            <div className="flex flex-col">
                <label htmlFor="discount_type" className="mb-1 text-sm font-medium text-gray-700">Discount Type</label>
                <select 
                    name="discount_type" 
                    value={newBook.discount_type} 
                    onChange={handleChangeNewBook} 
                    className="border p-2 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                </select>
            </div>


            {/* Row 5: Description & About Author (Full width) */}
            <div className="flex flex-col md:col-span-2">
                <label className="mb-1 text-sm font-medium text-gray-700">Description</label>
                <textarea
                    name="description"
                    placeholder="A detailed summary of the book content."
                    value={newBook.description}
                    onChange={handleChangeNewBook}
                    className="border p-2 rounded min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
            </div>
            
            <div className="flex flex-col md:col-span-2">
                <label className="mb-1 text-sm font-medium text-gray-700">About Author</label>
                <textarea
                    name="about_author"
                    placeholder="Biography or relevant information about the author."
                    value={newBook.about_author}
                    onChange={handleChangeNewBook}
                    className="border p-2 rounded min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
            </div>

        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
            <button
                onClick={handleAddBook}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-150"
            >
                Add New Book
            </button>
        </div>
      </div>


      {/* Error message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Books table */}
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">Existing Books</h3>
      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(books || []).map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{book.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{genres.find((g) => g.id === book.genre_id)?.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${parseFloat(book.price).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{book.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{book.publisher || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{book.author_name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          book.status === 'approved' ? 'bg-green-100 text-green-800' :
                          book.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                          {book.status}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* Displaying Discount based on type */}
                      {book.discount_value ? `${book.discount_value}${book.discount_type === "percentage" ? "%" : "$"}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.cover_image_url && <img src={book.cover_image_url} alt={book.title} className="w-12 h-16 object-cover rounded shadow" />}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    {/* Edit Icon */}
                    <button
                      onClick={() => handleEdit(book)}
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                      title="Edit Book"
                    >
                      <Pencil size={18} />
                    </button>

                    {/* Delete Icon */}
                    <button
                      onClick={() => handleDeleteInitiate(book)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                      title="Delete Book"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The Edit Modal Component */}
      {isModalOpen && editingBookId && (
        <EditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          book={editingBook}
          onSave={handleUpdate}
          genres={genres}
          setBookData={setEditingBook}
        />
      )}

      {/* The Custom Confirmation Modal (Pop-up) */}
      {isConfirmModalOpen && bookToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmDelete}
          title={bookToDelete.title}
        />
      )}
    </div>
  );
}