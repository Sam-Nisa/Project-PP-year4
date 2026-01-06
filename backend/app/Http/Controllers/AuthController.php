<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Register a new user (default role = user).
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'avatar'   => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // image validation
        ]);
    
        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public'); 
            // stored in storage/app/public/avatars
        }
    
        $user = User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role'          => 'user', // default role
            'avatar'        => $avatarPath, // save path to DB
        ]);
    
        $token = JWTAuth::fromUser($user);
    
        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }
    

    /**
     * Login user and return a JWT token.
     */
  public function login(Request $request)
{
    $credentials = $request->validate([
        'email'    => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $credentials['email'])->first();

    if (!$user || !Hash::check($credentials['password'], $user->password_hash)) {
        return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
    }

    $token = JWTAuth::fromUser($user);  

     $avatarUrl = $user->avatar
        ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
            ? $user->avatar
            : asset('storage/' . $user->avatar))
        : null;


    return response()->json([
        'success' => true,
        'message' => 'Login successful',
        'user'    => [ 'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,      // original value
                'avatar_url' => $avatarUrl,     // full URL for frontend
                'created_at' => $user->created_at,], // avatar_url is automatically included
        'token'   => $token,
    ]);
}
    /**
     * Get the authenticated user's profile.
     */
    public function profile()
    {
        try {
            $user = Auth::user();
    
            // Prepare full avatar URL
            $avatarUrl = $user->avatar
                ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                    ? $user->avatar
                    : asset('storage/' . $user->avatar))
                : null;
    
            // Add avatar_url to user object
            $user->avatar_url = $avatarUrl;
    
            return response()->json([
                'success' => true,
                'data' => $user,
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token error'
            ], 401);
        }
    }
    

    /**
     * Refresh JWT token.
     */
    public function refresh()
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'token' => $newToken,
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token refresh failed'], 401);
        }
    }

    /**
     * Logout user (invalidate token).
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Failed to logout'], 500);
        }
    }
}
