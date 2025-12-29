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
        $books = Book::with(['author', 'genre'])->get();
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
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'discount_type' => 'nullable|in:percentage,fixed', // NEW
            'discount_value' => 'nullable|numeric|min:0',      // NEW
        ]);

        $data = $request->all();
        $data['author_id'] = $user->id; 
        $data['status'] = $data['status'] ?? 'pending'; 

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('books', 'public');
        }

        $book = Book::create($data);

        return response()->json($book, 201);
    }

    // ✅ Update a book (only admin or the author of the book)
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
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'discount_type' => 'nullable|in:percentage,fixed', // NEW
            'discount_value' => 'nullable|numeric|min:0',      // NEW
            'publication_date' => 'nullable|date', // NEW
            'page_count' => 'nullable|integer|min:1', // NEW
            'about_author' => 'nullable|string', // NEW
            'publisher' => 'nullable|string', // NEW
            'author_name' => 'nullable|string', // NEW
           
        ]);

        $data = $request->all();

        if ($request->hasFile('cover_image')) {
            if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
                Storage::disk('public')->delete($book->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('books', 'public');
        }

        $book->update($data);

        return response()->json($book);
    }

    // ✅ Delete a book (only admin or the author of the book)
    public function destroy($id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        if ($user->role !== 'admin' && $book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
            Storage::disk('public')->delete($book->cover_image);
        }

        $book->delete();

        return response()->json(['message' => 'Book deleted successfully']);
    }
}
