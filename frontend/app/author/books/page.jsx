"use client";

import { useEffect, useState } from "react";
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
  };

  // Handle edit book
  const handleEdit = (book) => {
    setEditingBookId(book.id);

    const formattedDate = book.publication_date
      ? new Date(book.publication_date).toISOString().split("T")[0]
      : "";

    setEditingBook({
      ...book,
      images: [],
      pdf_file: null,
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
  };

  const handleUpdate = async (id) => {
    try {
      await updateBook(id, editingBook);
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
    <div className="p-4 lg:p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          Book Management Dashboard
        </h2>
      </div>

      {/* Add Book Form */}
      <AddBookForm
        genres={genres}
        onAddBook={handleAddBook}
        loading={loading}
        error={error}
      />

      {/* Books Table */}
      <BooksTable
        books={books}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteInitiate}
      />

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