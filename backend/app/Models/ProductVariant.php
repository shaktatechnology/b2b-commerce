<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $product_id
 * @property string $variant_name
 * @property string $sku
 * @property string $retail_price
 * @property string $wholesale_price
 * @property int $stock
 * @property bool $is_active
 */
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
        'image_url',
        'color_id',
        'size_id',
    ];

    protected $casts = [
        'retail_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'moq' => 'integer',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get parent product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get discounts associated with this product variant.
     */
    public function discounts(): HasMany
    {
        return $this->hasMany(Discount::class, 'variant_id');
    }

    /**
     * Get color of this variant.
     */
    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
    }

    /**
     * Get size of this variant.
     */
    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }
}
