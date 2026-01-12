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
            'images_url' => 'nullable|array', // Pre-uploaded image URLs
            'images_url.*' => 'nullable|url',
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'pdf_file_url' => 'nullable|url', // Pre-uploaded PDF URL
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
            'cover_image_url' => 'nullable|url',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // multiple images
            'images_url' => 'nullable|array', // Pre-uploaded image URLs
            'images_url.*' => 'nullable|url',
            'pdf_file' => 'nullable|mimes:pdf|max:10000', // PDF max 10MB
            'pdf_file_url' => 'nullable|url', // Pre-uploaded PDF URL
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

    // ✅ Delete a book (only admin or author)
    public function destroy($id)
    {
        $book = Book::find($id);
        if (!$book) return response()->json(['message' => 'Book not found'], 404);

        $user = Auth::user();
        if ($user->role !== 'admin' && $book->author_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Note: ImageKit files are managed externally, so we don't need to delete them here
        // In a production environment, you might want to implement ImageKit file deletion
        
        $book->delete();

        return response()->json(['message' => 'Book deleted successfully']);
    }
}
