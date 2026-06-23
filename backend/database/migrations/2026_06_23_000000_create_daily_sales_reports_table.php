<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_sales_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date')->unique();
            $table->decimal('revenue', 12, 2)->default(0);
            $table->unsignedInteger('order_count')->default(0);
            $table->unsignedInteger('items_sold')->default(0);
            $table->unsignedInteger('new_customer_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_sales_reports');
    }
};
