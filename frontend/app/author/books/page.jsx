"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [books, setBooks] = useState([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  const reloadBooks = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!user?.id) return;

    const loadBooks = async () => {
      try {
        const data = await fetchBooksByAuthor(user.id);
        setBooks(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadBooks();
    fetchGenres();
  }, [user?.id, refreshTrigger]);

  // Handle add book
  const handleAddBook = async (bookData) => {
    await createBook(bookData);
    reloadBooks();
    setShowAddBookModal(false); // Close modal after successful add
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
      console.log('BooksPage - Updating book with data:', dataToUpdate);
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
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setBookToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (bookToDelete) {
      try {
        await deleteBook(bookToDelete.id);
        reloadBooks();
      } catch (error) {
        console.error("Error deleting book:", error);
      }
    }
    handleCloseConfirmModal();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Book Management Dashboard
            </h2>
            <p className="text-gray-600 mt-1">Manage your books and publications</p>
          </div>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add New Book
          </button>
        </div>
      </div>

      {/* Main Content - No Scrollbars */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full py-4 ">
          {/* Books Table */}
          <BooksTable
            books={books}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteInitiate}
          />
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">Add New Book</h3>
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
          onConfirm={handleConfirmDelete}
          title={bookToDelete.title}
        />
      )}
    </div>
  );
}