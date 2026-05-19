<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'variant_name',
        'sku',
        'retail_price',
        'wholesale_price',
        'moq',
        'stock',
        'weight',
        'is_active',
    ];

    protected $casts = [
        'retail_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'moq' => 'integer',
        'stock' => 'integer',
        'weight' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get parent product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
