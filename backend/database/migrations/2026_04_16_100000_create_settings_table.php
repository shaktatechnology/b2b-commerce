<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();       // e.g. site_name, site_email
            $table->text('value')->nullable();     // value
            $table->string('group')->default('general'); // general | seo | contact | appearance
            $table->string('type')->default('text');     // text | textarea | boolean | image
            $table->string('label')->nullable();   // human-readable label for admin UI
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
