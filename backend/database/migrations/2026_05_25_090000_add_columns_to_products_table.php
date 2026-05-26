<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignUuid('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignUuid('color_id')->nullable()->constrained('colors')->nullOnDelete();
            $table->foreignUuid('size_id')->nullable()->constrained('sizes')->nullOnDelete();
            $table->string('weight')->nullable();
            $table->longText('long_description')->nullable();
            
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_top_selling')->default(false);
            $table->boolean('is_trending')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['color_id']);
            $table->dropForeign(['size_id']);
            $table->dropColumn([
                'brand_id', 'color_id', 'size_id', 'weight', 'long_description',
                'is_popular', 'is_top_selling', 'is_trending'
            ]);
        });
    }
};
