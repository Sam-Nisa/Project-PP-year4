<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Book;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageKitService;

class BookController extends Controller
{
    protected $imageKit;

public function __construct(ImageKitService $imageKit)
{
    $this->imageKit = $imageKit;
}
    // ✅ List all books (any user) - Only show approved books
    public function index()
    {
        $query = Book::with(['author', 'genre'])
            ->where('status', 'approved'); // Only show approved books on public interface

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

    // ✅ Admin: List only admin-created books with filters
    public function adminIndex(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        // Only show books created by admin users (role = 'admin')
        $query = Book::with(['author', 'genre'])
            ->whereHas('author', function ($q) {
                $q->where('role', 'admin');
            });

        // Filter by search term (book title only)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        // Filter by genre
        if ($request->filled('genre_id')) {
            $query->where('genre_id', $request->genre_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Default sort by created_at desc
        $query->orderBy('created_at', 'desc');

        $books = $query->get();

        return response()->json($books);
    }

    // ✅ Author: List only author's own books (all statuses) with filters
    public function authorIndex(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'author') {
            return response()->json(['message' => 'Unauthorized. Author access required.'], 403);
        }

        // Show all books created by this author (including pending)
        $query = Book::with(['author', 'genre'])
            ->where('author_id', $user->id);

        // Filter by search term (book title only)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        // Filter by genre
        if ($request->filled('genre_id')) {
            $query->where('genre_id', $request->genre_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Default sort by created_at desc
        $query->orderBy('created_at', 'desc');

        $books = $query->get();

        return response()->json($books);
    }

    // ✅ Show a single book (any user) - Only show if approved
    public function show($id)
    {
        $book = Book::with(['author', 'genre'])
            ->where('status', 'approved') // Only show approved books on public interface
            ->find($id);

        if (!$book) {
            return response()->json(['message' => 'Book not found or not approved'], 404);
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
            'images_url' => 'nullable|array', // Pre-uploaded image URLs
            'images_url.*' => 'nullable|url',
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'pdf_file_url' => 'nullable|url', // Pre-uploaded PDF URL
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'publication_date' => 'nullable|date',
            'page_count' => 'nullable|integer|min:1',
            'about_author' => 'nullable|string',
            'publisher' => 'nullable|string',
            'author_name' => 'nullable|string',
        ]);

        $data = $request->all();
        
        // Each user creates books for themselves only
        $data['author_id'] = $user->id;
        
        // Remove user_id from data as it's not needed
        unset($data['user_id']);
        
        $data['status'] = $data['status'] ?? 'pending';

        // Handle cover image (file upload)
        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $upload = $this->imageKit->upload(
                $file->getPathname(),
                time().'_'.$file->getClientOriginalName(),
                '/books/cover'
            );
            $data['cover_image_url'] = $upload->result->url;
            unset($data['cover_image']);
        }

        // Handle multiple images
        if ($request->hasFile('images')) {
            // Direct file uploads
            $imageUrls = [];
            foreach ($request->file('images') as $image) {
                $upload = $this->imageKit->upload(
                    $image->getPathname(),
                    time().'_'.$image->getClientOriginalName(),
                    '/books/images'
                );
                $imageUrls[] = $upload->result->url;
            }
            $data['images_url'] = $imageUrls;
            unset($data['images']);
        } elseif ($request->has('images_url') && is_array($request->images_url)) {
            // Pre-uploaded URLs
            $data['images_url'] = $request->images_url;
        }

        // Handle PDF
        if ($request->hasFile('pdf_file')) {
            // Direct file upload
            $pdf = $request->file('pdf_file');
            $upload = $this->imageKit->upload(
                $pdf->getPathname(),
                time().'_'.$pdf->getClientOriginalName(),
                '/books/pdfs'
            );
            $data['pdf_file_url'] = $upload->result->url;
            unset($data['pdf_file']);
        } elseif ($request->has('pdf_file_url')) {
            // Pre-uploaded URL
            $data['pdf_file_url'] = $request->pdf_file_url;
        }

        $book = Book::create($data);

        // Load relationships
        $book->load(['author', 'genre']);

        return response()->json($book, 201);
    }

    // ✅ Update a book (only own books)
    public function update(Request $request, $id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        
        // Users can only edit their own books (no cross-role editing)
        if ($book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized. You can only edit your own books.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'genre_id' => 'required|exists:genres,id',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'cover_image_url' => 'nullable|url',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // multiple images
            'images_url' => 'nullable|array', // Pre-uploaded image URLs
            'images_url.*' => 'nullable|url',
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'pdf_file_url' => 'nullable|url', // Pre-uploaded PDF URL
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'publication_date' => 'nullable|date',
            'page_count' => 'nullable|integer|min:1',
            'about_author' => 'nullable|string',
            'publisher' => 'nullable|string',
            'author_name' => 'nullable|string',
        ]);

        $data = $request->all();

        // Remove user_id from data as it's not needed (users can only edit their own books)
        unset($data['user_id']);

        // Handle cover image (file upload)
        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $upload = $this->imageKit->upload(
                $file->getPathname(),
                time().'_'.$file->getClientOriginalName(),
                '/books/cover'
            );
            $data['cover_image_url'] = $upload->result->url;
            unset($data['cover_image']);
        } elseif ($request->has('cover_image_url')) {
            // Pre-uploaded URL
            $data['cover_image_url'] = $request->cover_image_url;
        }

        // Handle multiple images
        if ($request->hasFile('images')) {
            // Direct file uploads
            $imageUrls = [];
            foreach ($request->file('images') as $image) {
                $upload = $this->imageKit->upload(
                    $image->getPathname(),
                    time().'_'.$image->getClientOriginalName(),
                    '/books/images'
                );
                $imageUrls[] = $upload->result->url;
            }
            $data['images_url'] = $imageUrls;
            unset($data['images']);
        } elseif ($request->has('images_url') && is_array($request->images_url)) {
            // Pre-uploaded URLs
            $data['images_url'] = $request->images_url;
        }

        // Handle PDF
        if ($request->hasFile('pdf_file')) {
            // Direct file upload
            $pdf = $request->file('pdf_file');
            $upload = $this->imageKit->upload(
                $pdf->getPathname(),
                time().'_'.$pdf->getClientOriginalName(),
                '/books/pdfs'
            );
            $data['pdf_file_url'] = $upload->result->url;
            unset($data['pdf_file']);
        } elseif ($request->has('pdf_file_url')) {
            // Pre-uploaded URL
            $data['pdf_file_url'] = $request->pdf_file_url;
        }

        $book->update($data);

        // Load relationships
        $book->load(['author', 'genre']);

        return response()->json($book);
    }

    // ✅ Delete a book (only own books)
    public function destroy($id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        
        // Users can only delete their own books (no cross-role deletion)
        if ($book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized. You can only delete your own books.'], 403);
        }

        // Note: ImageKit files are managed externally, so we don't need to delete them here
        // In a production environment, you might want to implement ImageKit file deletion
        
        $book->delete();

        return response()->json(['message' => 'Book deleted successfully']);
    }
}
