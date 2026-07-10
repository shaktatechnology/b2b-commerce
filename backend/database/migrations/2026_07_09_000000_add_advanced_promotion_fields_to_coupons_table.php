<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->enum('promotion_type', ['standard', 'bogo', 'tiered', 'payment_specific', 'auto'])
                ->default('standard')
                ->after('status');
            $table->boolean('auto_apply')->default(false)->after('promotion_type');
            $table->json('payment_methods')->nullable()->after('customer_type');
            $table->json('bogo_config')->nullable()->after('payment_methods');
            $table->json('tier_config')->nullable()->after('bogo_config');
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn([
                'promotion_type',
                'auto_apply',
                'payment_methods',
                'bogo_config',
                'tier_config',
            ]);
        });
    }
};
