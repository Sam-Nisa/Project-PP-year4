<?php

// use Illuminate\Support\Facades\Route;
// use Laravel\Socialite\Facades\Socialite;


// Route::get('/', function () {
//     return ['Laravel' => app()->version()];
// });


// Route::get('/auth/google/redirect', function () {
//     return Socialite::driver('google')->redirect();
// });

// Route::get('/auth/google/callback', function () {
//     $user = Socialite::driver('google')->user();

//     dd($user); // test first
// });


use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google/redirect', function () {
    return Socialite::driver('google')->redirect();
});

Route::get('/auth/google/callback', function () {

    $googleUser = Socialite::driver('google')->user();

    // Create or update user
    $user = User::updateOrCreate(
        ['email' => $googleUser->getEmail()],
        [
            'name' => $googleUser->getName(),
            'google_id' => $googleUser->getId(),
            'avatar' => $googleUser->getAvatar(),
            'password_hash' => bcrypt(uniqid()),

        ]
    );

    // Generate JWT token
    $token = JWTAuth::fromUser($user);

    // Redirect to Next.js with token
    return redirect(
        env('FRONTEND_URL') . "/google-success?token=" . $token
    );
});
