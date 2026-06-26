<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->makeLegacyDiscountColumnsNullable();

        Schema::table('discounts', function (Blueprint $table) {
            $table->enum('international_type', ['percent', 'fixed'])->nullable();
            $table->decimal('international_value', 10, 2)->nullable();
            $table->enum('wholesale_type', ['percent', 'fixed'])->nullable();
            $table->decimal('wholesale_value', 10, 2)->nullable();
            $table->enum('wholesale_international_type', ['percent', 'fixed'])->nullable();
            $table->decimal('wholesale_international_value', 10, 2)->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('NPR');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('currency');
        });

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::table('discounts')->whereNull('type')->update(['type' => 'fixed']);
            DB::table('discounts')->whereNull('value')->update(['value' => 0]);
            $this->rebuildSqliteDiscounts(false);
            return;
        }

        Schema::table('discounts', function (Blueprint $table) {
            $table->dropColumn([
                'international_type',
                'international_value',
                'wholesale_type',
                'wholesale_value',
                'wholesale_international_type',
                'wholesale_international_value',
            ]);
        });

        DB::table('discounts')->whereNull('type')->update(['type' => 'fixed']);
        DB::table('discounts')->whereNull('value')->update(['value' => 0]);
        $this->makeLegacyDiscountColumnsRequired();
    }

    private function makeLegacyDiscountColumnsNullable(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildSqliteDiscounts(true);
            return;
        }

        DB::statement("ALTER TABLE discounts MODIFY type ENUM('percent', 'fixed') NULL");
        DB::statement('ALTER TABLE discounts MODIFY value DECIMAL(10, 2) NULL');
    }

    private function makeLegacyDiscountColumnsRequired(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildSqliteDiscounts(false);
            return;
        }

        DB::statement("ALTER TABLE discounts MODIFY type ENUM('percent', 'fixed') NOT NULL");
        DB::statement('ALTER TABLE discounts MODIFY value DECIMAL(10, 2) NOT NULL');
    }

    private function rebuildSqliteDiscounts(bool $nullableLegacyColumns): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::rename('discounts', 'discounts_rebuild_backup');

        Schema::create('discounts', function (Blueprint $table) use ($nullableLegacyColumns) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();

            $type = $table->enum('type', ['percent', 'fixed']);
            $value = $table->decimal('value', 10, 2);

            if ($nullableLegacyColumns) {
                $type->nullable();
                $value->nullable();
            }

            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::statement(
            'INSERT INTO discounts (id, product_id, variant_id, type, value, starts_at, ends_at, is_active, created_at, updated_at) ' .
            'SELECT id, product_id, variant_id, type, value, starts_at, ends_at, is_active, created_at, updated_at FROM discounts_rebuild_backup'
        );

        Schema::drop('discounts_rebuild_backup');
        Schema::enableForeignKeyConstraints();
    }
};
