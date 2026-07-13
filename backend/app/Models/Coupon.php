<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $name
 * @property string $customer_code
 * @property string $secure_code
 * @property string|null $description
 * @property string $status
 * @property string $promotion_type
 * @property bool $auto_apply
 * @property int|null $usage_limit
 * @property int|null $usage_per_user
 * @property bool $stackable
 * @property bool $first_order_only
 * @property string|null $customer_type
 * @property array|null $payment_methods
 * @property array|null $bogo_config
 * @property array|null $tier_config
 * @property string $created_by
 */
class Coupon extends Model
{
    use HasFactory, HasUuids;

    public const NAME_MAX_LENGTH = 150;
    public const CUSTOMER_CODE_LENGTH = 10;
    public const SECURE_CODE_LENGTH = 16;
    public const CUSTOMER_TYPE_MAX_LENGTH = 32;
    public const PROMOTION_TYPES = ['standard', 'bogo', 'tiered', 'payment_specific', 'auto'];

    protected $fillable = [
        'name',
        'customer_code',
        'description',
        'status',
        'promotion_type',
        'auto_apply',
        'starts_at',
        'expires_at',
        'usage_limit',
        'usage_per_user',
        'stackable',
        'first_order_only',
        'customer_type',
        'payment_methods',
        'bogo_config',
        'tier_config',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'auto_apply' => 'boolean',
        'usage_limit' => 'integer',
        'usage_per_user' => 'integer',
        'stackable' => 'boolean',
        'first_order_only' => 'boolean',
        'payment_methods' => 'array',
        'bogo_config' => 'array',
        'tier_config' => 'array',
    ];

    protected $hidden = [
        'secure_code',
        'customer_code',
    ];

    protected $appends = [
        'coupon_code',
    ];

    protected static function booted(): void
    {
        static::creating(function (Coupon $coupon) {
            if (empty($coupon->customer_code)) {
                $coupon->customer_code = static::generateUniqueCode('customer_code', self::CUSTOMER_CODE_LENGTH);
            }

            $coupon->secure_code = static::generateUniqueCode('secure_code', self::SECURE_CODE_LENGTH);
        });

        static::updating(function (Coupon $coupon) {
            if ($coupon->isDirty('customer_code') && empty($coupon->customer_code)) {
                $coupon->customer_code = static::generateUniqueCode('customer_code', self::CUSTOMER_CODE_LENGTH);
            }
        });
    }

    public function setCustomerCodeAttribute(?string $value): void
    {
        $this->attributes['customer_code'] = $value === null || trim($value) === ''
            ? null
            : Str::upper(trim($value));
    }

    public function getCouponCodeAttribute(): ?string
    {
        return $this->customer_code;
    }

    public static function generateCustomerCode(int $length = self::CUSTOMER_CODE_LENGTH): string
    {
        return static::generateUniqueCode('customer_code', $length);
    }

    public static function generateSecureCode(int $length = self::SECURE_CODE_LENGTH): string
    {
        return static::generateUniqueCode('secure_code', $length);
    }

    protected static function generateUniqueCode(string $column, int $length): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        for ($attempt = 0; $attempt < 100; $attempt++) {
            $code = '';

            for ($index = 0; $index < $length; $index++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            if (!static::where($column, $code)->exists()) {
                return $code;
            }
        }

        throw new \RuntimeException('Unable to generate a unique coupon code.');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function regionRules(): HasMany
    {
        return $this->hasMany(CouponRegionRule::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'coupon_products');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'coupon_categories');
    }

    public function brands(): BelongsToMany
    {
        return $this->belongsToMany(Brand::class, 'coupon_brands');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'coupon_users');
    }
}
