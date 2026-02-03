# Backend Cleanup Guide

This guide identifies unnecessary files and components in your Laravel backend that can be safely removed to simplify your codebase.

## Files Safe to Delete

### 1. Unused Controllers

These controllers appear to be unused or redundant:

```bash
# Remove these files:
rm backend/app/Http/Controllers/CouponController.php
rm backend/app/Http/Controllers/OrderCouponController.php
rm backend/app/Http/Controllers/InventoryLogController.php
```

**Reason**: Your system uses `DiscountCodeController` instead of coupons, and inventory logging isn't implemented.

### 2. Unused Models

```bash
# Remove these model files:
rm backend/app/Models/InventoryLog.php
```

**Reason**: No inventory tracking is implemented in your book store.

### 3. Unused Migrations

```bash
# These migrations can be removed if you haven't run them in production:
rm backend/database/migrations/*_create_coupons_table.php
rm backend/database/migrations/*_create_order_coupons_table.php
```

**Reason**: You're using discount codes instead of coupons.

### 4. Unused Seeders

```bash
# Remove unused seeders:
rm backend/database/seeders/DatabaseSeeder.php  # If not customized
```

### 5. Default Laravel Files

```bash
# Remove default Laravel files you're not using:
rm backend/app/Http/Controllers/Controller.php  # If using custom base controller
rm backend/resources/views/.gitkeep
```

### 6. Test Files (If Not Testing)

```bash
# Remove test files if not writing tests:
rm -rf backend/tests/Feature/
rm -rf backend/tests/Unit/
rm backend/tests/TestCase.php
rm backend/tests/Pest.php
```

### 7. Unused Frontend Components

```bash
# Remove debug components in production:
rm frontend/app/component/DebugInfo.jsx

# Check if these stores are actually used:
frontend/app/store/upload.js  # If file upload is handled elsewhere
```

## Routes to Clean Up

In `backend/routes/api.php`, remove these unused route groups:

```php
// Remove these route definitions:

// Coupons (replaced by discount codes)
Route::post('coupons', [CouponController::class, 'store']);
Route::get('coupons', [CouponController::class, 'index']);
Route::get('coupons/{id}', [CouponController::class, 'show']);
Route::delete('coupons/{id}', [CouponController::class, 'destroy']);

// Order Coupons (not used)
Route::post('order-coupons', [OrderCouponController::class, 'store']);
Route::get('order-coupons', [OrderCouponController::class, 'index']);
Route::get('order-coupons/{id}', [OrderCouponController::class, 'show']);
Route::delete('order-coupons/{id}', [OrderCouponController::class, 'destroy']);

// Inventory Logs (not implemented)
Route::get('inventory-logs', [InventoryLogController::class, 'index']);
Route::post('inventory-logs', [InventoryLogController::class, 'store']);
Route::get('inventory-logs/{id}', [InventoryLogController::class, 'show']);
Route::delete('inventory-logs/{id}', [InventoryLogController::class, 'destroy']);

// Debug route (remove in production)
Route::get('debug/user/{id}', function($id) {
    // ... debug code
});
```

## Database Cleanup

### Tables to Drop (if not in production)

```sql
-- Drop unused tables:
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS order_coupons;
DROP TABLE IF EXISTS inventory_logs;
```

### Columns to Remove

From the `orders` table, these columns might be unused:

```sql
-- Check if these columns are used, if not remove them:
ALTER TABLE orders DROP COLUMN coupon_id;  -- If using discount codes instead
```

## Configuration Cleanup

### Environment Variables

Remove unused environment variables from `.env`:

```env
# Remove if not using:
MAIL_MAILER=log  # If not sending emails
AWS_ACCESS_KEY_ID=  # If not using AWS
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
```

### Config Files

Clean up unused configurations:

```bash
# Remove unused config sections from:
# config/filesystems.php - Remove AWS S3 config if not used
# config/mail.php - Simplify if only using log driver
# config/queue.php - Remove unused queue drivers
```

## Middleware Cleanup

Check if these middleware are actually used:

```bash
# Review and potentially remove:
backend/app/Http/Middleware/EnsureEmailIsVerified.php  # If email verification not required
```

## Vendor Cleanup

### Unused Packages

Review `composer.json` and remove unused packages:

```bash
# Check if these are actually used:
composer remove laravel/breeze  # If not using Breeze authentication
composer remove laravel/pail    # If not using the pail command
composer remove laravel/sail    # If not using Docker
```

## Cache and Storage Cleanup

### Clear Unnecessary Cache Files

```bash
# Clear various caches:
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Remove compiled views:
rm -rf backend/storage/framework/views/*.php
```

### Log Files

```bash
# Archive or remove old log files:
rm backend/storage/logs/laravel.log  # After backing up if needed
```

## Storage Files Cleanup

### Temporary Files

```bash
# Clean up temporary storage files:
rm -rf backend/storage/framework/cache/data/*
rm -rf backend/storage/framework/sessions/*
```

### Uploaded Files Review

Review uploaded files in `backend/storage/app/public/`:

```bash
# Check for unused uploaded files:
ls -la backend/storage/app/public/avatars/
ls -la backend/storage/app/public/genres/

# Remove test/demo files if any
```

## Before You Delete

### ⚠️ Important Warnings

1. **Backup First**: Always backup your database and files before deleting anything
2. **Check Dependencies**: Use `grep -r "ClassName"` to search for usage before deleting
3. **Test After Cleanup**: Run your application thoroughly after cleanup
4. **Production Considerations**: Never delete database tables in production without proper migration

### Verification Commands

Before deleting files, verify they're not used:

```bash
# Search for controller usage:
grep -r "CouponController" backend/

# Search for model usage:
grep -r "InventoryLog" backend/

# Search for route usage:
grep -r "inventory-logs" frontend/

# Search for component usage:
grep -r "DebugInfo" frontend/
```

## Recommended Cleanup Order

1. **Remove unused routes** from `api.php`
2. **Remove unused controllers** and models
3. **Clean up frontend components**
4. **Remove unused migrations** (development only)
5. **Clean up configuration files**
6. **Remove unused packages**
7. **Clear caches and temporary files**
8. **Review and clean storage files**

## After Cleanup Benefits

- **Smaller codebase**: Easier to maintain and understand
- **Faster deployments**: Fewer files to transfer
- **Reduced confusion**: No unused code to distract developers
- **Better performance**: Fewer files to autoload
- **Cleaner git history**: Less noise in version control
- **Improved security**: Fewer attack vectors from unused code

## Maintenance

After cleanup, establish these practices:

1. **Regular code reviews** to catch unused code early
2. **Automated tools** to detect dead code
3. **Documentation** of what's actually used vs. planned features
4. **Periodic cleanup** as part of maintenance cycles

## Quick Cleanup Script

Create a cleanup script for regular maintenance:

```bash
#!/bin/bash
# cleanup.sh

echo "Starting Laravel cleanup..."

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Clear logs (backup first)
cp storage/logs/laravel.log storage/logs/laravel.log.backup
> storage/logs/laravel.log

# Clear temporary files
rm -rf storage/framework/cache/data/*
rm -rf storage/framework/sessions/*

# Clear compiled views
rm -rf storage/framework/views/*.php

echo "Cleanup completed!"
```

Make it executable:
```bash
chmod +x cleanup.sh
```