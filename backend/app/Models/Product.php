<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'is_popular',
        'is_top_selling',
        'is_trending',
        'brand_id',
        'color_id',
        'size_id',
        'weight',
        'long_description',
        'additional_info',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'is_top_selling' => 'boolean',
        'is_trending' => 'boolean',
    ];

    protected $appends = ['image_url'];

    /**
     * Get the primary or first image URL.
     */
    public function getImageUrlAttribute()
    {
        $primary = $this->images->where('is_primary', true)->first();
        if ($primary) {
            return $primary->url;
        }
        $first = $this->images->first();
        return $first ? $first->url : null;
    }

    /**
     * Get categories this product belongs to.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    /**
     * Get variants for this product.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get images for this product.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * Get offers associated with this product.
     */
    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class, 'offer_products');
    }

    /**
     * Get discounts associated with this product.
     */
    public function discounts(): HasMany
    {
        return $this->hasMany(Discount::class);
    }

    /**
     * Get reviews for this product.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get brand of this product.
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get default color of this product.
     */
    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
    }

    /**
     * Get default size of this product.
     */
    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }
}
