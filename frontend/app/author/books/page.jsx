"use client";

import { useEffect, useState } from "react";
import { Plus, User, BookOpen } from "lucide-react";
import { useBookStore } from "../../store/useBookStore";
import { useGenreStore } from "../../store/useGenreStore";
import { useAuthStore } from "../../store/authStore";

// Import components
import {
  AddBookForm,
  EditBookModal,
  ConfirmationModal,
  BooksTable
} from "./components";

export default function BooksPage() {
  const {
    loading,
    error,
    fetchBooksByAuthor,
    createBook,
    updateBook,
    deleteBook,
  } = useBookStore();
  const { genres = [], fetchGenres } = useGenreStore();
  const { user } = useAuthStore();

  // State management
  const [editingBookId, setEditingBookId] = useState(null);
  const [editingBook, setEditingBook] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [confirmationType, setConfirmationType] = useState('delete');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [books, setBooks] = useState([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  });

  const reloadBooks = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        // Author fetches only their own books
        console.log('Loading author books for user:', { userId: user.id, userRole: user.role });
        const data = await fetchBooksByAuthor(user.id);
        console.log('Author fetched books:', { count: data.length, books: data });
        setBooks(data);
        
        // Calculate stats
        const newStats = {
          total: data.length,
          approved: data.filter(book => book.status === 'approved').length,
          pending: data.filter(book => book.status === 'pending').length,
        };
        console.log('Author book stats:', newStats);
        setStats(newStats);
      } catch (err) {
        console.error('Error loading author books:', err);
      }
    };

    loadData();
    fetchGenres();
  }, [user?.id, refreshTrigger]);

  // Handle add book
  const handleAddBook = async (bookData) => {
    await createBook(bookData);
    reloadBooks();
    setShowAddBookModal(false);
  };

  // Handle edit book
  const handleEdit = (book) => {
    setEditingBookId(book.id);

    const formattedDate = book.publication_date
      ? new Date(book.publication_date).toISOString().split("T")[0]
      : "";

    setEditingBook({
      ...book,
      images: [], // This will be for new images only
      pdf_file: null, // This will be for new PDF only
      publication_date: formattedDate,
      discount_type: book.discount_type || "",
      discount_value: book.discount_value || "",
      page_count: book.page_count || "",
      about_author: book.about_author || "",
      publisher: book.publisher || "",
      author_name: book.author_name || "",
      // Preserve existing images and PDF URLs
      images_url: book.images_url || [],
      cover_image_url: book.cover_image_url || null,
      pdf_file_url: book.pdf_file_url || null,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingBookId(null);
    setEditingBook({});
    setIsModalOpen(false);
  };

  const handleUpdate = async (id, updatedData = null) => {
    try {
      const dataToUpdate = updatedData || editingBook;
      await updateBook(id, dataToUpdate);
      reloadBooks();
      handleCloseModal();
    } catch (error) {
      console.error("Error updating book:", error);
    }
  };

  // Handle delete book
  const handleDeleteInitiate = (book) => {
    setBookToDelete(book);
    setConfirmationType('delete');
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setBookToDelete(null);
    setIsConfirmModalOpen(false);
    setConfirmationType('delete');
  };

  const handleConfirmAction = async () => {
    if (!bookToDelete) return;

    try {
      if (confirmationType === 'delete') {
        await deleteBook(bookToDelete.id);
      }
      reloadBooks();
    } catch (error) {
      console.error(`Error ${confirmationType}ing book:`, error);
    }
    handleCloseConfirmModal();
  };

  const handleViewDetails = (book) => {
    // TODO: Implement book details view
    console.log('View details for book:', book);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Author Book Management
                </h2>
                <p className="text-gray-600 mt-1">Manage your published books</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add New Book
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Books</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">⏳</span>
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full py-4">
          <BooksTable
            books={books}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteInitiate}
            onViewDetails={handleViewDetails}
            genres={genres}
          />
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold">Add New Book (Author)</h3>
              </div>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <AddBookForm
                genres={genres}
                onAddBook={handleAddBook}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingBookId && (
        <EditBookModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          book={editingBook}
          onSave={handleUpdate}
          genres={genres}
          setBookData={setEditingBook}
        />
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && bookToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmAction}
          title={bookToDelete.title}
          type={confirmationType}
          loading={loading}
        />
      )}
    </div>
  );
}