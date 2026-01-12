<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('cover_image_url')->nullable()->after('cover_image');
            $table->json('images_url')->nullable()->after('images');
            $table->string('pdf_file_url')->nullable()->after('pdf_file');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['cover_image_url', 'images_url', 'pdf_file_url']);
        });
    }
};