<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Discount extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'variant_id',
        'type',
        'value',
        'international_type',
        'international_value',
        'wholesale_type',
        'wholesale_value',
        'wholesale_international_type',
        'wholesale_international_value',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'value' => 'decimal:2',
        'international_value' => 'decimal:2',
        'wholesale_value' => 'decimal:2',
        'wholesale_international_value' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function calculateAmountFor(float $unitPrice, string $userType = 'retail', string $currency = 'NPR'): float
    {
        [$type, $value] = $this->definitionFor($userType, $currency);

        if ($type === null || $value === null) {
            return 0.00;
        }

        $amount = $type === 'percent'
            ? round($unitPrice * (((float) $value) / 100), 2)
            : (float) $value;

        return min($amount, $unitPrice);
    }

    public function definitionFor(string $userType = 'retail', string $currency = 'NPR'): array
    {
        $isWholesale = $userType === 'wholesale';
        $isInternational = strtoupper($currency) === 'USD';

        if ($isWholesale && $isInternational) {
            return [$this->wholesale_international_type, $this->wholesale_international_value];
        }

        if ($isWholesale) {
            return [$this->wholesale_type, $this->wholesale_value];
        }

        if ($isInternational) {
            return [$this->international_type, $this->international_value];
        }

        return [$this->type, $this->value];
    }

    /**
     * Get the product this discount belongs to.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the specific product variant this discount belongs to.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
