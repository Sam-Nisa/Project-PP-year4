# Frontend Integration Test Guide

## Testing the Author Dashboard Integration

### Prerequisites
1. Backend server running on http://127.0.0.1:8000
2. Frontend server running on http://localhost:3001
3. Author user account with proper credentials

### Test Steps

#### 1. Create/Verify Author Account
```bash
# In backend directory
php artisan tinker
```

```php
// Create or find author user
$user = App\Models\User::where('email', 'author@test.com')->first();
if (!$user) {
    $user = App\Models\User::create([
        'name' => 'Test Author',
        'email' => 'author@test.com',
        'password_hash' => bcrypt('password'),
        'role' => 'author'
    ]);
}
echo "Author user: {$user->name} (Role: {$user->role})";
```

#### 2. Test API Endpoint Directly
```bash
# Login to get JWT token
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"author@test.com","password":"password"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

```bash
# Test dashboard endpoint with token
curl -X GET http://127.0.0.1:8000/api/author-dashboard-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "totalBooks": 0,
    "publishedBooks": 0,
    "pendingBooks": 0,
    "rejectedBooks": 0,
    "totalRevenue": 0,
    "averageRating": 4.2,
    "totalSales": 0,
    "weeklySales": [...],
    "genreData": [...],
    "recentBooks": [...],
    "booksGrowth": "15%",
    "salesGrowth": "22%",
    "revenueGrowth": "18%"
  }
}
```

#### 3. Test Frontend Integration

1. **Navigate to Frontend**
   - Open http://localhost:3001 in browser
   - Go to login page

2. **Login as Author**
   - Email: author@test.com
   - Password: password

3. **Access Author Dashboard**
   - Navigate to /author/dashboard
   - Should see dashboard with:
     - KPI cards (Total Books, Published Books, etc.)
     - Weekly sales chart
     - Book status pie chart
     - Recent books table
     - Refresh button

4. **Test Error Handling**
   - Stop backend server temporarily
   - Click refresh button
   - Should see proper error message
   - Restart backend server
   - Click "Try Again" button
   - Should load successfully

### Expected Behavior

#### Success Case
- Dashboard loads without errors
- All KPI cards show data (even if 0)
- Charts render properly
- Recent books table displays (empty if no books)
- Refresh button works
- Console shows successful API calls

#### Error Cases
- **No Token**: Shows "Authentication required" message
- **Wrong Role**: Shows "Author access required" message  
- **Server Down**: Shows "Server error" message with retry button
- **Invalid Token**: Shows "Authentication failed" message

### Troubleshooting

#### Common Issues

1. **CORS Errors**
   - Check backend CORS configuration
   - Ensure frontend URL is allowed

2. **JWT Token Issues**
   - Check JWT secret is set in backend .env
   - Verify token format in network tab

3. **Database Connection**
   - Ensure MySQL is running
   - Check database credentials in backend .env

4. **Cache Issues**
   - Clear browser cache
   - Restart both servers

#### Debug Steps

1. **Check Network Tab**
   - Look for failed API requests
   - Verify request headers include Authorization
   - Check response status codes

2. **Check Console Logs**
   - Frontend: Browser console for errors
   - Backend: Laravel logs in storage/logs/

3. **Verify Environment**
   - Frontend .env.local has correct API URL
   - Backend .env has correct database and JWT settings

### Integration Improvements Made

1. **Enhanced Error Handling**
   - Specific error messages for different scenarios
   - Retry functionality
   - Better loading states

2. **Improved UX**
   - Loading spinner
   - Refresh button
   - Better error display
   - Console logging for debugging

3. **Robust Authentication**
   - JWT token validation
   - Role-based access control
   - Proper error responses

The integration should now work seamlessly between frontend and backend!