<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Book;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class BookController extends Controller
{
    // ✅ List all books (any user)
    public function index()
    {
        $query = Book::with(['author', 'genre']);

        // Filter by genre name instead of slug
        if (request()->has('genre')) {
            $query->whereHas('genre', function ($q) {
                $q->where('slug', request('genre'));
            });
        }

        // Filter by author_id
        if (request()->filled('author_id')) {
            $query->where('author_id', request('author_id'));
        }

        $books = $query->get();

        return response()->json($books);
    }

    // ✅ Show a single book (any user)
    public function show($id)
    {
        $book = Book::with(['author', 'genre'])->find($id);

        if (!$book) {
            return response()->json(['message' => 'Book not found'], 404);
        }

        return response()->json($book);
    }

    // ✅ Create a new book (only admin or author)
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'author'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'genre_id' => 'required|exists:genres,id',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // multiple images
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'publication_date' => 'nullable|date',
            'page_count' => 'nullable|integer|min:1',
            'about_author' => 'nullable|string',
            'publisher' => 'nullable|string',
            'author_name' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['author_id'] = $user->id;
        $data['status'] = $data['status'] ?? 'pending';

        // Handle cover image
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('books', 'public');
        }

        // Handle multiple images (1–5)
        if ($request->hasFile('images')) {
            $images = [];
            foreach ($request->file('images') as $image) {
                $images[] = $image->store('books/images', 'public');
            }
            $data['images'] = $images;
        }

        // Handle PDF
        if ($request->hasFile('pdf_file')) {
            $data['pdf_file'] = $request->file('pdf_file')->store('books/pdfs', 'public');
        }

        $book = Book::create($data);

        // Load relationships
        $book->load(['author', 'genre']);

        return response()->json($book, 201);
    }

    // ✅ Update a book (only admin or author)
    public function update(Request $request, $id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        if ($user->role !== 'admin' && $book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'genre_id' => 'required|exists:genres,id',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // multiple images
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'publication_date' => 'nullable|date',
            'page_count' => 'nullable|integer|min:1',
            'about_author' => 'nullable|string',
            'publisher' => 'nullable|string',
            'author_name' => 'nullable|string',
        ]);

        $data = $request->all();

        // Handle cover image
        if ($request->hasFile('cover_image')) {
            if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
                Storage::disk('public')->delete($book->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('books', 'public');
        }

        // Handle multiple images
        if ($request->hasFile('images')) {
            // Delete old images
            if ($book->images) {
                foreach ($book->images as $img) {
                    if (Storage::disk('public')->exists($img)) {
                        Storage::disk('public')->delete($img);
                    }
                }
            }

            $images = [];
            foreach ($request->file('images') as $image) {
                $images[] = $image->store('books/images', 'public');
            }
            $data['images'] = $images;
        }

        // Handle PDF
        if ($request->hasFile('pdf_file')) {
            if ($book->pdf_file && Storage::disk('public')->exists($book->pdf_file)) {
                Storage::disk('public')->delete($book->pdf_file);
            }
            $data['pdf_file'] = $request->file('pdf_file')->store('books/pdfs', 'public');
        }

        $book->update($data);

        // Load relationships
        $book->load(['author', 'genre']);

        return response()->json($book);
    }

    // ✅ Delete a book (only admin or author)
    public function destroy($id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        if ($user->role !== 'admin' && $book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete cover image
        if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
            Storage::disk('public')->delete($book->cover_image);
        }

        // Delete multiple images
        if ($book->images) {
            foreach ($book->images as $img) {
                if (Storage::disk('public')->exists($img)) {
                    Storage::disk('public')->delete($img);
                }
            }
        }

        // Delete PDF
        if ($book->pdf_file && Storage::disk('public')->exists($book->pdf_file)) {
            Storage::disk('public')->delete($book->pdf_file);
        }

        $book->delete();

        return response()->json(['message' => 'Book deleted successfully']);
    }
}
