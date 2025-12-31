"use client";
import { useEffect, useState } from "react";
import { useGenreStore } from "../../store/useGenreStore";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";

export default function GenresPage() {
  const {
    genres,
    loading,
    error,
    fetchGenres,
    createGenre,
    updateGenre,
    deleteGenre,
  } = useGenreStore();

  const [newGenre, setNewGenre] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [editingGenreId, setEditingGenreId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingImage, setEditingImage] = useState(null);

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    await createGenre({ name: newGenre, image: newImage });
    setNewGenre("");
    setNewImage(null);
  };

  const handleEdit = (genre) => {
    setEditingGenreId(genre.id);
    setEditingName(genre.name);
    setEditingImage(null);
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    await updateGenre(id, { name: editingName, image: editingImage });
    setEditingGenreId(null);
    setEditingName("");
    setEditingImage(null);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this genre?")) {
      await deleteGenre(id);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Genres</h1>
          <p className="text-gray-500">Manage your content categories</p>
        </div>
      </div>

      {/* Add New Genre Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="text-sm  uppercase tracking-wider text-gray-500 mb-4 font-bold">Add New Genre</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre Name</label>
            <input
              type="text"
              placeholder="e.g. Rock, Jazz, Lo-Fi"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 transition-all flex-1">
                <Upload size={18} />
                <span className="text-sm">{newImage ? "Change" : "Upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {newImage && (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(newImage)}
                    alt="Preview"
                    className="w-11 h-11 object-cover rounded-lg border shadow-sm"
                  />
                  <button onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg hover:bg-red-600 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleAddGenre}
              disabled={loading || !newGenre}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Add Genre
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center gap-3 text-red-700">
          <X size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="px-6 py-4 font-semibold text-sm">Image</th>
                <th className="px-6 py-4 font-semibold text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && genres.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    Loading your library...
                  </td>
                </tr>
              ) : (
                genres.map((genre) => (
                  <tr key={genre.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {editingGenreId === genre.id ? (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-gray-100 p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                            <Upload size={16} />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => setEditingImage(e.target.files[0])}
                            />
                          </label>
                          {(editingImage || genre.image_url) && (
                            <img
                              src={editingImage ? URL.createObjectURL(editingImage) : genre.image_url}
                              className="w-12 h-12 rounded-lg object-cover shadow-sm border"
                              alt="Preview"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                          {genre.image_url ? (
                            <img src={genre.image_url} alt={genre.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-400" size={20} />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingGenreId === genre.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="border border-blue-400 rounded-md px-3 py-1.5 focus:outline-none ring-2 ring-blue-100 w-full max-w-[200px]"
                        />
                      ) : (
                        <span className="font-medium text-gray-800 text-lg">{genre.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        {editingGenreId === genre.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(genre.id)}
                              className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all shadow-sm"
                              title="Save Changes"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => setEditingGenreId(null)}
                              className="p-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all shadow-sm"
                              title="Cancel"
                            >
                              <X size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(genre)}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all shadow-sm"
                              title="Edit Genre"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(genre.id)}
                              className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-all shadow-sm"
                              title="Delete Genre"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}