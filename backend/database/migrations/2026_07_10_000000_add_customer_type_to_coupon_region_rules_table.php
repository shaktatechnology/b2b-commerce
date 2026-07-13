<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLE = 'coupon_region_rules';
    private const OLD_UNIQUE = ['coupon_id', 'market', 'currency'];
    private const NEW_UNIQUE = ['coupon_id', 'market', 'currency', 'customer_type'];
    private const OLD_UNIQUE_NAME = 'coupon_region_rules_coupon_id_market_currency_unique';
    private const NEW_UNIQUE_NAME = 'coupon_region_rules_customer_type_unique';

    public function up(): void
    {
        if (!Schema::hasColumn(self::TABLE, 'customer_type')) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->string('customer_type', 32)->nullable()->after('currency');
            });
        }

        if (!$this->hasUniqueIndex(self::NEW_UNIQUE_NAME) && !$this->hasUniqueIndex(self::NEW_UNIQUE)) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->unique(self::NEW_UNIQUE, self::NEW_UNIQUE_NAME);
            });
        }

        if ($this->hasUniqueIndex(self::OLD_UNIQUE_NAME)) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->dropUnique(self::OLD_UNIQUE_NAME);
            });
        } elseif ($this->hasUniqueIndex(self::OLD_UNIQUE)) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->dropUnique(self::OLD_UNIQUE);
            });
        }
    }

    public function down(): void
    {
        if ($this->hasUniqueIndex(self::NEW_UNIQUE_NAME)) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->dropUnique(self::NEW_UNIQUE_NAME);
            });
        } elseif ($this->hasUniqueIndex(self::NEW_UNIQUE)) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->dropUnique(self::NEW_UNIQUE);
            });
        }

        if (Schema::hasColumn(self::TABLE, 'customer_type')) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->dropColumn('customer_type');
            });
        }

        if (!$this->hasUniqueIndex(self::OLD_UNIQUE) && !$this->hasUniqueIndex(self::OLD_UNIQUE_NAME) && !$this->hasDuplicateLegacyRules()) {
            Schema::table(self::TABLE, function (Blueprint $table) {
                $table->unique(self::OLD_UNIQUE);
            });
        }
    }

    private function hasUniqueIndex(string|array $index): bool
    {
        return Schema::hasIndex(self::TABLE, $index, 'unique');
    }

    private function hasDuplicateLegacyRules(): bool
    {
        return DB::table(self::TABLE)
            ->select(self::OLD_UNIQUE)
            ->groupBy(self::OLD_UNIQUE)
            ->havingRaw('COUNT(*) > 1')
            ->exists();
    }
};
