<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponRegionRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'coupon_id',
        'market',
        'currency',
        'customer_type',
        'discount_type',
        'discount_value',
        'minimum_subtotal',
        'maximum_discount',
        'free_shipping',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'minimum_subtotal' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'free_shipping' => 'boolean',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }
}
