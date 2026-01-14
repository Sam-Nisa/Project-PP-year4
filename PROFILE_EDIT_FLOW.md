# Profile Edit Flow Diagram

## Before Fix (Not Working)

```
User Profile Edit Page
  ↓
Uses: useUserStore.updateUser(userId, formData)
  ↓
Calls: PUT /api/users/{id}  ❌ WRONG ENDPOINT
  ↓
Missing JWT Middleware  ❌ NO AUTHENTICATION
  ↓
FAILS
```

## After Fix (Working)

```
User Profile Edit Page
  ↓
Uses: useAuthStore.updateProfile(formData)
  ↓
Calls: POST /api/profile  ✅ CORRECT ENDPOINT
  ↓
JWT Middleware validates token  ✅ AUTHENTICATED
  ↓
AuthController::updateProfile()
  ↓
Validates input (name, avatar, bio)
  ↓
Handles avatar upload
  ↓
Updates user in database
  ↓
Returns updated user with avatar_url
  ↓
Frontend updates state and sessionStorage
  ↓
SUCCESS ✅
```

## Data Flow

### Frontend (ProfileEdit Component)
```javascript
formData = {
  name: "John Doe",
  avatar: File object (if changed),
  // email is excluded if unchanged
}
```

### Frontend (authStore)
```javascript
// Converts to FormData
FormData {
  name: "John Doe",
  avatar: [File object]
}

// Sends to API
POST /api/profile
Headers: {
  Authorization: "Bearer {token}",
  Content-Type: "multipart/form-data"
}
```

### Backend (JwtMiddleware)
```php
// Validates JWT token
JWTAuth::parseToken()->authenticate()
// Sets authenticated user in Auth facade
```

### Backend (AuthController)
```php
// Gets authenticated user
$user = Auth::user();

// Validates input
$validated = [
  'name' => 'John Doe',
  'avatar' => UploadedFile
];

// Handles avatar upload
$avatarPath = 'avatars/xyz123.jpg';

// Updates user
$user->update($validated);

// Returns response
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "avatars/xyz123.jpg",
    "avatar_url": "http://localhost:8000/storage/avatars/xyz123.jpg"
  }
}
```

### Frontend (Response Handling)
```javascript
// Updates authStore state
set({ user: updatedUser });

// Updates sessionStorage
sessionStorage.setItem("user", JSON.stringify(updatedUser));

// Updates local component state
setUser(updatedUser);

// Shows success message
alert("Profile updated successfully!");
```

## Key Components

### 1. JWT Middleware (`backend/app/Http/Middleware/JwtMiddleware.php`)
- Validates JWT token from Authorization header
- Authenticates user
- Returns 401 if token is invalid/expired/missing

### 2. Auth Controller (`backend/app/Http/Controllers/AuthController.php`)
- `profile()` - GET authenticated user's profile
- `updateProfile()` - POST update authenticated user's profile
- `deleteAvatar()` - DELETE authenticated user's avatar

### 3. Auth Store (`frontend/app/store/authStore.js`)
- `fetchProfile()` - Fetch current user's profile
- `updateProfile(formData)` - Update current user's profile
- `deleteAvatar()` - Delete current user's avatar

### 4. Profile Edit Page (`frontend/app/profile/[id]/edit/page.jsx`)
- Fetches user profile on mount
- Handles form submission
- Shows loading/error states
- Displays success message

### 5. Profile Edit Component (`frontend/app/component/ProfileEdit.jsx`)
- Renders form with name and avatar fields
- Handles file upload and preview
- Excludes unchanged email from submission

## API Endpoints

| Method | Endpoint | Middleware | Controller | Purpose |
|--------|----------|------------|------------|---------|
| GET | `/api/profile` | jwt.auth | AuthController@profile | Get authenticated user's profile |
| POST | `/api/profile` | jwt.auth | AuthController@updateProfile | Update authenticated user's profile |
| DELETE | `/api/profile/avatar` | jwt.auth | AuthController@deleteAvatar | Delete authenticated user's avatar |

## Authentication Flow

```
1. User logs in
   ↓
2. Backend generates JWT token
   ↓
3. Frontend stores token in sessionStorage
   ↓
4. Frontend includes token in Authorization header
   ↓
5. JWT Middleware validates token
   ↓
6. Controller accesses authenticated user via Auth::user()
   ↓
7. Controller performs action
   ↓
8. Returns response
```

## File Upload Flow

```
1. User selects image file
   ↓
2. Frontend creates preview using URL.createObjectURL()
   ↓
3. User clicks "Save Changes"
   ↓
4. Frontend creates FormData with file
   ↓
5. Backend receives file via $request->file('avatar')
   ↓
6. Backend validates file (image, max 2MB)
   ↓
7. Backend deletes old avatar (if exists)
   ↓
8. Backend stores new avatar in storage/app/public/avatars
   ↓
9. Backend saves path to database
   ↓
10. Backend returns full URL via asset('storage/' . $path)
   ↓
11. Frontend displays new avatar
```

## Error Handling

### Frontend Errors
- Network errors → Caught by axios, shown in alert
- Validation errors → Displayed from backend response
- Authentication errors → Redirect to login

### Backend Errors
- Token expired → 401 response
- Token invalid → 401 response
- Validation failed → 422 response with error details
- Server error → 500 response with error message

## State Management

### Session Storage
```javascript
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "http://localhost:8000/storage/avatars/xyz.jpg"
  }
}
```

### Zustand Store (authStore)
```javascript
{
  user: { id, name, email, avatar_url, ... },
  token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  loading: false,
  error: null,
  isInitialized: true
}
```
