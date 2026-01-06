"use client";
import { useEffect, useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useGenreStore } from "../../store/useGenreStore";

export default function BooksPage() {
  const {
    books,
    loading,
    error,
    fetchBooks,
    createBook,
    updateBook,
    deleteBook,
  } = useBookStore();
  const { genres, fetchGenres } = useGenreStore();

  const [newBook, setNewBook] = useState({
    title: "",
    genre_id: "",
    price: "",
    stock: "",
    cover_image: null,
    description: "",
    status: "pending",
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
    });
  };

  const handleEdit = (book) => {
    setEditingBookId(book.id);
    setEditingBook({ ...book });
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
        <input
          type="text"
          placeholder="Title"
          value={newBook.title}
          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={newBook.genre_id}
          onChange={(e) => setNewBook({ ...newBook, genre_id: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select Genre</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Price"
          value={newBook.price}
          onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Stock"
          value={newBook.stock}
          onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNewBook({ ...newBook, cover_image: e.target.files[0] })
          }
          className="border p-2 rounded"
        />
        {newBook.cover_image && (
          <img
            src={
              typeof newBook.cover_image === "object"
                ? URL.createObjectURL(newBook.cover_image)
                : newBook.cover_image
            }
            alt="Preview"
            className="w-16 h-16 object-cover"
          />
        )}
        <textarea
          placeholder="Description"
          value={newBook.description}
          onChange={(e) =>
            setNewBook({ ...newBook, description: e.target.value })
          }
          className="border p-2 rounded col-span-1 md:col-span-3"
        />
        <select
          value={newBook.status}
          onChange={(e) => setNewBook({ ...newBook, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
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
                <th className="border p-2">Description</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="border p-2">{book.id}</td>

                  {/* Title */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <input
                        value={editingBook.title}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            title: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      />
                    ) : (
                      book.title
                    )}
                  </td>

                  {/* Genre */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <select
                        value={editingBook.genre_id}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            genre_id: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      >
                        <option value="">Select Genre</option>
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      genres.find((g) => g.id === book.genre_id)?.name || "N/A"
                    )}
                  </td>

                  {/* Price */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <input
                        type="number"
                        value={editingBook.price}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            price: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      />
                    ) : (
                      book.price
                    )}
                  </td>

                  {/* Stock */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <input
                        type="number"
                        value={editingBook.stock}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            stock: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      />
                    ) : (
                      book.stock
                    )}
                  </td>

                  {/* Status */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <select
                        value={editingBook.status}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            status: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      book.status
                    )}
                  </td>

                  {/* Cover image */}
                  {/* Cover image */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <>
                        {editingBook.cover_image && (
                          <img
                            src={
                              editingBook.cover_image instanceof File
                                ? URL.createObjectURL(editingBook.cover_image)
                                : editingBook.cover_image
                            }
                            alt={editingBook.title}
                            className="w-16 h-16 object-cover mb-1"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditingBook({
                              ...editingBook,
                              cover_image: e.target.files[0],
                            })
                          }
                          className="border p-1 rounded w-full"
                        />
                      </>
                    ) : (
                      book.cover_image && (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-16 h-16 object-cover"
                        />
                      )
                    )}
                  </td>

                  {/* Description */}
                  <td className="border p-2">
                    {editingBookId === book.id ? (
                      <textarea
                        value={editingBook.description}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            description: e.target.value,
                          })
                        }
                        className="border p-1 rounded w-full"
                      />
                    ) : (
                      book.description
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
