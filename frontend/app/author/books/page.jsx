"use client";
import { useEffect, useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useGenreStore } from "../../store/useGenreStore";

export default function BooksPage() {
  const { books = [], loading, error, fetchBooks, createBook, updateBook, deleteBook } = useBookStore();
  const { genres = [], fetchGenres } = useGenreStore();

  const [newBook, setNewBook] = useState({
    title: "",
    genre_id: "",
    price: "",
    stock: "",
    cover_image: null,
    description: "",
    status: "pending",
    discount_type: "",   // optional
    discount_value: "",  // optional
  });

  const [editingBookId, setEditingBookId] = useState(null);
  const [editingBook, setEditingBook] = useState({});

  useEffect(() => {
    fetchBooks();
    fetchGenres();
  }, []);

  const handleAddBook = async () => {
    if (!newBook.title.trim()) return;
    await createBook(newBook);
    setNewBook({
      title: "",
      genre_id: "",
      price: "",
      stock: "",
      cover_image: null,
      description: "",
      status: "pending",
      discount_type: "",
      discount_value: "",
    });
  };

  const handleEdit = (book) => {
    setEditingBookId(book.id);
    setEditingBook({
      ...book,
      cover_image: null, // reset file upload
      discount_type: book.discount_type || "",
      discount_value: book.discount_value || "",
    });
  };

  const handleUpdate = async (id) => {
    await updateBook(id, editingBook);
    setEditingBookId(null);
    setEditingBook({});
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    await deleteBook(id);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Books Management</h2>

      {/* Add new book */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Title, Genre, Price, Stock, Cover Image, Description, Status (existing fields) */}

        <input
          type="text"
          placeholder="Discount Value"
          value={newBook.discount_value}
          onChange={(e) => setNewBook({ ...newBook, discount_value: e.target.value })}
          className="border p-2 rounded"
        />

        <select
          value={newBook.discount_type}
          onChange={(e) => setNewBook({ ...newBook, discount_type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select Discount Type (optional)</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>

        <button
          onClick={handleAddBook}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 col-span-1 md:col-span-3"
        >
          Add Book
        </button>
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Books table */}
      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Title</th>
                <th className="border p-2">Genre</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Stock</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Cover</th>
                <th className="border p-2">Discount</th> {/* NEW */}
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(books || []).map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="border p-2">{book.id}</td>

                  {/* Title */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <input
                        value={editingBook.title}
                        onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                        className="border p-1 rounded w-full"
                      />
                    ) : book.title}
                  </td>

                  {/* Genre */}
                  <td className="border p-2">{genres.find((g) => g.id === book.genre_id)?.name || "N/A"}</td>

                  {/* Price */}
                  <td className="border p-2">{editingBookId === book.id ? (
                    <input
                      type="number"
                      value={editingBook.price}
                      onChange={(e) => setEditingBook({ ...editingBook, price: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : book.price}</td>

                  {/* Stock */}
                  <td className="border p-2">{book.stock}</td>

                  {/* Status */}
                  <td className="border p-2">{book.status}</td>

                  {/* Cover Image */}
                  <td className="border p-2">
                    {book.cover_image_url && <img src={book.cover_image_url} alt={book.title} className="w-16 h-16 object-cover" />}
                  </td>

                  {/* Discount */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Value"
                          value={editingBook.discount_value || ""}
                          onChange={(e) => setEditingBook({ ...editingBook, discount_value: e.target.value })}
                          className="border p-1 rounded w-1/2"
                        />
                        <select
                          value={editingBook.discount_type || ""}
                          onChange={(e) => setEditingBook({ ...editingBook, discount_type: e.target.value })}
                          className="border p-1 rounded w-1/2"
                        >
                          <option value="">Type</option>
                          <option value="percentage">%</option>
                          <option value="fixed">$</option>
                        </select>
                      </div>
                    ) : (
                      book.discount_value ? `${book.discount_value} ${book.discount_type === "percentage" ? "%" : "$"}` : "-"
                    )}
                  </td>

                  {/* Actions */}
                  <td className="border p-2 flex gap-2">
                    {editingBookId === book.id ? (
                      <button
                        onClick={() => handleUpdate(book.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(book)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
