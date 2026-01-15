<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'bio' => 'nullable|string|max:1000',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists and it's not a URL
                if ($user->avatar && !filter_var($user->avatar, FILTER_VALIDATE_URL) && Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                // Store new avatar
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $validated['avatar'] = $avatarPath;
            }

            // Update user with validated data
            $user->update($validated);

            // Refresh user from database to get updated values
            $user->refresh();

            // Prepare response with avatar URL
            $avatarUrl = $user->avatar
                ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                    ? $user->avatar
                    : asset('storage/' . $user->avatar))
                : null;

            $user->avatar_url = $avatarUrl;

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $user,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user avatar.
     */
    public function deleteAvatar()
    {
        try {
            $user = Auth::user();

            if ($user->avatar) {
                // Delete avatar file
                if (Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                // Update user record
                $user->update(['avatar' => null]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Avatar deleted successfully',
                'data' => $user,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete avatar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'confirm_password' => 'required|string|same:new_password',
            ]);

            // Check if current password is correct
            if (!Hash::check($validated['current_password'], $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect',
                    'errors' => [
                        'current_password' => ['The current password is incorrect.']
                    ]
                ], 422);
            }

            // Check if new password is different from current
            if (Hash::check($validated['new_password'], $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'New password must be different from current password',
                    'errors' => [
                        'new_password' => ['New password must be different from the current one.']
                    ]
                ], 422);
            }

            // Update password
            $user->update([
                'password_hash' => Hash::make($validated['new_password'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password successfully updated',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
