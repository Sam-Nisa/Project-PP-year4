# Profile Edit Testing Checklist

## Pre-Testing Setup

- [ ] Clear Laravel cache:
  ```bash
  cd backend
  php artisan config:clear
  php artisan cache:clear
  php artisan route:clear
  ```

- [ ] Verify storage link exists:
  ```bash
  php artisan storage:link
  ```

- [ ] Backend server is running on `http://localhost:8000`
- [ ] Frontend server is running on `http://localhost:3000`

## Test Cases

### Test 1: Update Name Only
- [ ] Login to the application
- [ ] Navigate to profile edit page
- [ ] Change your name
- [ ] Click "Save Changes"
- [ ] ✅ Success message appears
- [ ] ✅ Name updates in the UI
- [ ] ✅ Name persists after page refresh

### Test 2: Update Avatar Only
- [ ] Navigate to profile edit page
- [ ] Click "Change Avatar"
- [ ] Select an image file (jpg, png, gif)
- [ ] ✅ Preview shows the new image
- [ ] Click "Save Changes"
- [ ] ✅ Success message appears
- [ ] ✅ Avatar updates in the UI
- [ ] ✅ Avatar persists after page refresh

### Test 3: Update Both Name and Avatar
- [ ] Navigate to profile edit page
- [ ] Change your name
- [ ] Upload a new avatar
- [ ] Click "Save Changes"
- [ ] ✅ Success message appears
- [ ] ✅ Both name and avatar update
- [ ] ✅ Changes persist after page refresh

### Test 4: Email Field (Should be Readonly)
- [ ] Navigate to profile edit page
- [ ] Try to edit the email field
- [ ] ✅ Email field is disabled/readonly
- [ ] ✅ Email is not sent to the server when saving

### Test 5: Validation Tests
- [ ] Try uploading a non-image file
  - [ ] ✅ Should show validation error
- [ ] Try uploading a file larger than 2MB
  - [ ] ✅ Should show validation error
- [ ] Try clearing the name field and saving
  - [ ] ✅ Should show validation error or prevent submission

### Test 6: Authentication Tests
- [ ] Logout from the application
- [ ] Try to access profile edit page directly
  - [ ] ✅ Should redirect to login or show error
- [ ] Login again
- [ ] Navigate to profile edit page
  - [ ] ✅ Should work normally

### Test 7: Error Handling
- [ ] Stop the backend server
- [ ] Try to save profile changes
  - [ ] ✅ Should show error message
- [ ] Start the backend server
- [ ] Try again
  - [ ] ✅ Should work normally

## Browser Console Checks

Open browser console (F12) and check:
- [ ] No JavaScript errors
- [ ] Network tab shows successful POST to `/api/profile`
- [ ] Response status is 200
- [ ] Response contains updated user data

## Backend Logs

Check `backend/storage/logs/laravel.log`:
- [ ] No PHP errors
- [ ] No authentication errors
- [ ] No validation errors (unless expected)

## Additional Checks

- [ ] Avatar displays correctly on profile view page
- [ ] Avatar displays correctly in navigation/header
- [ ] Profile updates reflect in other parts of the application
- [ ] Session storage contains updated user data

## Known Limitations

- Email cannot be changed through profile edit (by design)
- Avatar must be under 2MB
- Only image files are accepted (jpeg, png, jpg, gif)

## If Tests Fail

1. Check browser console for errors
2. Check Laravel logs for backend errors
3. Verify JWT token is present in request headers
4. Verify CORS is configured correctly
5. Ensure storage link exists
6. Clear all caches and try again

## Success Criteria

✅ All test cases pass
✅ No errors in browser console
✅ No errors in Laravel logs
✅ Profile updates persist after refresh
✅ Avatar displays correctly everywhere
