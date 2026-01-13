"use client";

import { Pencil, Trash2, Loader2, Image, FileText, CheckCircle, Clock } from "lucide-react";

export default function AdminBooksTable({ 
  books, 
  loading, 
  onEdit, 
  onDelete,
  genres = []
}) {
  // Debug log to see what books data we're getting
  console.log('AdminBooksTable received books:', books);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Loading books...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    return genre ? genre.name : 'N/A';
  };

  return (
    <div className="bg-white w-[78rem] h-[100vh] rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-800">
          Admin Books
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Books created by admin users only
        </p>
      </div>

      {/* Table container with scroll */}
      <div className="overflow-scroll h-[100vh]" style={{scrollbarWidth: 'thin'}}>
        <div className="pb-2">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Genre
                </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Cover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  PDF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(books || []).map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{book.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs">
                    <div className="truncate" title={book.title}>
                      {book.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {book.author_name || book.author?.name || `User ID: ${book.author_id}` || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getGenreName(book.genre_id)}
                    </span>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      let imageUrls = book.images_url;
                      
                      // Handle string JSON data
                      if (typeof imageUrls === 'string' && imageUrls.length > 0) {
                        try {
                          imageUrls = JSON.parse(imageUrls);
                        } catch (e) {
                          console.error('Failed to parse images_url:', imageUrls);
                          imageUrls = [];
                        }
                      }
                      
                      // Ensure it's an array and has valid URLs
                      if (!Array.isArray(imageUrls)) {
                        imageUrls = [];
                      }
                      
                      // Filter out any invalid URLs
                      imageUrls = imageUrls.filter(url => url && typeof url === 'string' && url.length > 0);
                      
                      if (imageUrls.length > 0) {
                        return (
                          <div className="flex items-center">
                            <img
                              src={imageUrls[0]}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded shadow"
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrls[0]);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center" style={{display: 'none'}}>
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                            {imageUrls.length > 1 && (
                              <span className="text-xs text-gray-500 ml-2">
                                +{imageUrls.length - 1}
                              </span>
                            )}
                          </div>
                        );
                      } else if (book.cover_image_url) {
                        return (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded shadow"
                            onError={(e) => {
                              console.error('Cover image failed to load:', book.cover_image_url);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        );
                      } else {
                        return (
                          <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    ${parseFloat(book.price || 0).toFixed(2)}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {book.discount_value ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {book.discount_value}{book.discount_type === "percentage" ? "%" : "$"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      book.stock > 10 ? 'bg-green-100 text-green-800' :
                      book.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {book.stock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {book.publisher || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(book.status)}
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          book.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{Number(book.average_rating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {book.total_reviews || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {book.pdf_file_url ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No PDF</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.created_at ? new Date(book.created_at).toLocaleDateString() : "-"}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">

                      {/* Edit Icon */}
                      <button
                        onClick={() => onEdit(book)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        title="Edit Book"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => onDelete(book)}
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

        {(!books || books.length === 0) && !loading && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No books found</p>
            <p className="text-sm text-gray-400">
              Books will appear here once authors start publishing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}