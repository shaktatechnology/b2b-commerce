"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, ChevronLeft, ChevronRight, Star, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/src/components/cards/ProductCard";
import { calculateDiscountAmount } from "@/src/lib/product-utils";
import type { StorefrontProduct, StorefrontCategory } from "@/src/types/storefront";
import type { Offer } from "@/src/types/offer";

interface Props {
    products: StorefrontProduct[];
    categories: StorefrontCategory[];
    allProducts: StorefrontProduct[];
    offers: Offer[];
    initialCategorySlug?: string;
    initialOfferId?: string;
    initialBrandId?: string;
    pageTitle: string;
    activeOffer?: Offer | null;
}

// Extract all unique brands from products
function extractBrands(products: StorefrontProduct[]) {
    const brandMap = new Map<string, { id: string; name: string }>();
    products.forEach((p) => {
        if (p.brand?.id && p.brand?.name) {
            brandMap.set(p.brand.id, { id: p.brand.id, name: p.brand.name });
        }
    });
    return Array.from(brandMap.values());
}

// Extract all unique colors from product variants
function extractColors(products: StorefrontProduct[]) {
    const colorMap = new Map<string, { id: string; name: string }>();
    products.forEach((p) => {
        p.variants?.forEach((v) => {
            if (v.color?.id && v.color?.name) {
                colorMap.set(v.color.id, { id: v.color.id, name: v.color.name });
            }
        });
    });
    return Array.from(colorMap.values());
}

// Extract all unique sizes
function extractSizes(products: StorefrontProduct[]) {
    const sizeMap = new Map<string, { id: string; name: string }>();
    products.forEach((p) => {
        p.variants?.forEach((v) => {
            if (v.size?.id && v.size?.name) {
                sizeMap.set(v.size.id, { id: v.size.id, name: v.size.name });
            }
        });
    });
    return Array.from(sizeMap.values());
}

// Check if any product has weight
function hasWeightProducts(products: StorefrontProduct[]) {
    return products.some((p) => p.weight || p.variants?.some((v) => v.weight));
}

// Get effective (discounted) price for a product
function getEffectivePrice(product: StorefrontProduct): number {
    const variant =
        product.variants?.find((v: any) => v.is_active && (v.stock ?? 0) > 0) ??
        product.variants?.[0];
    if (!variant) return 0;

    const basePrice = parseFloat(String(variant.retail_price ?? 0));

    const activeDiscount =
        (variant as any)?.discounts?.find((d: any) => d.is_active) ??
        (product as any)?.discounts?.find((d: any) => d.is_active) ??
        null;

    const discountAmount = calculateDiscountAmount(basePrice, activeDiscount, false, 'NPR');
    return Math.max(0, basePrice - discountAmount);
}

// Get price range using effective (discounted) prices
function getPriceRange(products: StorefrontProduct[]) {
    let min = Infinity, max = 0;
    products.forEach((p) => {
        const price = getEffectivePrice(p);
        if (price > 0 && price < min) min = price;
        if (price > max) max = price;
    });
    return { min: min === Infinity ? 0 : Math.floor(min), max: Math.ceil(max) };
}

// Count products per category
function countByCategory(products: StorefrontProduct[], categories: StorefrontCategory[]) {
    return categories.map((cat) => ({
        ...cat,
        count: products.filter((p) => p.categories?.some((c) => c.id === cat.id)).length,
    })).filter((c) => c.count > 0);
}

const ITEMS_PER_PAGE = 12;

export default function ProductListingClient({
    products,
    categories,
    allProducts,
    offers,
    initialCategorySlug,
    initialOfferId,
    initialBrandId,
    pageTitle,
    activeOffer,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter states
    const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 100000]);
    const [selectedBrands, setSelectedBrands] = React.useState<Set<string>>(new Set());
    const [selectedColors, setSelectedColors] = React.useState<Set<string>>(new Set());
    const [selectedSizes, setSelectedSizes] = React.useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = React.useState("featured");
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [showMobileFilters, setShowMobileFilters] = React.useState(false);

    // Derive filter options
    const priceExtremes = React.useMemo(() => getPriceRange(products), [products]);

    // Update price range when products change
    React.useEffect(() => {
        if (priceExtremes.max > 0) {
            setPriceRange([priceExtremes.min, priceExtremes.max]);
        }
    }, [priceExtremes.min, priceExtremes.max]);

    const availableBrands = React.useMemo(() => extractBrands(products), [products]);
    const availableColors = React.useMemo(() => extractColors(products), [products]);
    const availableSizes = React.useMemo(() => extractSizes(products), [products]);
    const weightOptions = React.useMemo(() => {
        const weights = new Set<string>();
        products.forEach(p => {
            if (p.weight) weights.add(p.weight);
            p.variants?.forEach(v => { if (v.weight) weights.add(String(v.weight)); });
        });
        return Array.from(weights).sort();
    }, [products]);

    const categoriesWithCounts = React.useMemo(() => countByCategory(allProducts, categories), [allProducts, categories]);

    // Apply filters
    const [selectedWeights, setSelectedWeights] = React.useState<Set<string>>(new Set());
    const [selectedRating, setSelectedRating] = React.useState<number | null>(null);

    const filteredProducts = React.useMemo(() => {
        let result = [...products];

        // Price — filter by effective (discounted) price
        if (priceRange[0] > priceExtremes.min || priceRange[1] < priceExtremes.max) {
            result = result.filter((p) => {
                const price = getEffectivePrice(p);
                return price >= priceRange[0] && price <= priceRange[1];
            });
        }

        // Brands, Colors, Sizes
        if (selectedBrands.size > 0) result = result.filter((p) => p.brand?.id && selectedBrands.has(p.brand.id));
        if (selectedColors.size > 0) {
            result = result.filter((p) => p.variants?.some((v) => v.color?.id && selectedColors.has(v.color.id)));
        }
        if (selectedSizes.size > 0) {
            result = result.filter((p) => p.variants?.some((v) => v.size?.id && selectedSizes.has(v.size.id)));
        }

        // Weights
        if (selectedWeights.size > 0) {
            result = result.filter((p) =>
                (p.weight && selectedWeights.has(p.weight)) ||
                p.variants?.some(v => v.weight && selectedWeights.has(String(v.weight)))
            );
        }

        // Ratings
        if (selectedRating !== null) {
            result = result.filter((p) => {
                const rating = Number(p.reviews_avg_rating ?? 0);
                return rating >= selectedRating;
            });
        }

        // Sort
        switch (sortBy) {
            case "price_low":
                result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
                break;
            case "price_high":
                result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
                break;
            case "name_asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
            default: break;
        }
        return result;
    }, [products, priceRange, selectedBrands, selectedColors, selectedSizes, selectedWeights, selectedRating, sortBy, priceExtremes.max]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleFilter = (set: any, id: any, setter: any) => {
        const next = new Set(set);
        if (next.has(id)) next.delete(id); else next.add(id);
        setter(next);
    };

    const clearAllFilters = () => {
        setPriceRange([priceExtremes.min, priceExtremes.max]);
        setSelectedBrands(new Set());
        setSelectedColors(new Set());
        setSelectedSizes(new Set());
        setSelectedWeights(new Set());
        setSelectedRating(null);
        setSortBy("featured");
        setCurrentPage(1);
    };

    const hasActiveFilters = selectedBrands.size > 0 || selectedColors.size > 0 || selectedSizes.size > 0 ||
        selectedWeights.size > 0 || selectedRating !== null || priceRange[0] > priceExtremes.min || priceRange[1] < priceExtremes.max;

    const activeCategory = categories.find((c) => c.slug === initialCategorySlug);
    const subCategories = activeCategory ? categories.filter((c) => c.parent_id === activeCategory.id) : [];

    const renderSidebar = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Fill by price</h3>
                <div className="space-y-8">
                    <div className="relative h-1 mb-8">
                        <div className="absolute inset-0 h-1.5 bg-gray-100 rounded-full" />
                        <div className="absolute h-1.5 bg-primary rounded-full"
                            style={{
                                left: `${Math.max(0, ((priceRange[0] - priceExtremes.min) / (priceExtremes.max - priceExtremes.min || 1)) * 100)}%`,
                                right: `${Math.max(0, 100 - ((priceRange[1] - priceExtremes.min) / (priceExtremes.max - priceExtremes.min || 1)) * 100)}%`
                            }}
                        />
                        <div className="relative h-1.5 cursor-pointer">
                            <input type="range" min={priceExtremes.min} max={priceExtremes.max} value={priceRange[0]}
                                onChange={(e) => setPriceRange([Number(e.target.value), Math.max(Number(e.target.value), priceRange[1])])}
                                className="absolute w-full h-1.5 -top-0 left-0 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
                            <input type="range" min={priceExtremes.min} max={priceExtremes.max} value={priceRange[1]}
                                onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[0]), Number(e.target.value)])}
                                className="absolute w-full h-1.5 -top-0 left-0 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 font-bold bg-gray-50 p-3 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-gray-400">Min Price</span>
                            <span className="text-primary">Rs. {priceRange[0]}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase text-gray-400">Max Price</span>
                            <span className="text-primary">Rs. {priceRange[1]}</span>
                        </div>
                    </div>
                </div>

                {/* Attribute Filters */}
                <div className="mt-8 space-y-6">
                    {availableColors.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700">Color</h4>
                            <div className="space-y-2">
                                {availableColors.map(c => (
                                    <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={selectedColors.has(c.id)} onChange={() => toggleFilter(selectedColors, c.id, setSelectedColors)} className="w-4 h-4 accent-primary rounded border-gray-300" />
                                        <span className="text-sm text-gray-600 group-hover:text-primary transition-colors capitalize">{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {availableSizes.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700">Size</h4>
                            <div className="space-y-2">
                                {availableSizes.map(s => (
                                    <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={selectedSizes.has(s.id)} onChange={() => toggleFilter(selectedSizes, s.id, setSelectedSizes)} className="w-4 h-4 accent-primary rounded border-gray-300" />
                                        <span className="text-sm text-gray-600 group-hover:text-primary transition-colors">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {weightOptions.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700">Weight</h4>
                            <div className="space-y-2">
                                {weightOptions.map(w => (
                                    <label key={w} className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={selectedWeights.has(w)} onChange={() => toggleFilter(selectedWeights, w, setSelectedWeights)} className="w-4 h-4 accent-primary rounded border-gray-300" />
                                        <span className="text-sm text-gray-600 group-hover:text-primary transition-colors">{w}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rating Filter */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-700">Rating</h4>

                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((r) => (
                                <label
                                    key={r}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="rating"
                                        checked={selectedRating === r}
                                        onChange={() => setSelectedRating(r)}
                                        className="w-4 h-4 accent-primary border-gray-300"
                                    />

                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={
                                                    i < r
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-200"
                                                }
                                            />
                                        ))}
                                    </div>

                                    <span className="text-xs text-gray-400 group-hover:text-primary transition-colors">
                                        {r === 5 ? '5' : `${r} & up`}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={clearAllFilters} className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    <X size={16} /> Clear Filters
                </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-primary/20 inline-block">Category</h3>
                <div className="space-y-1.5">
                    {categoriesWithCounts.map((cat) => (
                        <Link key={cat.id} href={`/products?category=${cat.slug}`}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${initialCategorySlug === cat.slug ? "bg-primary/10 text-primary font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                            <span>{cat.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${initialCategorySlug === cat.slug ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>{cat.count}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Category Header Banner */}
            {(activeCategory || activeOffer) && (
                <div className="bg-primary rounded-xl px-6 py-5 mb-6">
                    <h2 className="text-xl font-bold text-white">{pageTitle}</h2>
                    <nav className="text-sm text-white/70 mt-1">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span className="mx-2">&gt;</span>
                        {activeCategory && (
                            <>
                                <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                                <span className="mx-2">&gt;</span>
                            </>
                        )}
                        <span className="text-white font-medium">{pageTitle}</span>
                    </nav>
                    {/* Sub-category tags */}
                    {subCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {subCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/products?category=${cat.slug}`}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
                    ${initialCategorySlug === cat.slug
                                            ? "bg-white text-primary"
                                            : "bg-white/20 text-white hover:bg-white/30"
                                        }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Breadcrumb for non-category pages */}
            {!activeCategory && !activeOffer && (
                <nav className="text-sm text-gray-500 mb-4">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <span className="mx-2">&gt;</span>
                    <span className="text-primary font-medium">{pageTitle}</span>
                </nav>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 ">
                <p className="text-sm text-gray-500">
                    We found <span className="font-bold text-primary">{filteredProducts.length}</span> items for you!
                </p>
                <div className="flex items-center gap-4">
                    {/* View mode toggle */}
                    <div className="hidden sm:flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <span className="text-lg leading-none">⊞</span>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <span className="text-lg leading-none">≡</span>
                        </button>
                    </div>

                    {/* Mobile filter toggle */}
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                    </button>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-600 bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    >
                        <option value="featured">Featured</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="name_asc">Name: A-Z</option>
                    </select>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex gap-8">
                {/* Product Grid / List */}
                <div className="flex-1 min-w-0">
                    {!activeCategory && !activeOffer && (
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">{pageTitle}</h1>
                    )}

                    {activeOffer?.description && (
                        <p className="text-gray-600 mb-8 max-w-2xl leading-relaxed">{activeOffer.description}</p>
                    )}

                    {paginatedProducts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg">No products found matching your filters.</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-4 bg-primary/10 text-primary px-6 py-2 rounded-xl font-bold hover:bg-primary/20 transition-all"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={viewMode === "grid"
                            ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "space-y-6"
                        }>
                            {paginatedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} viewMode={viewMode} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                      ${currentPage === page
                                                ? "bg-primary text-white shadow-sm"
                                                : "border border-gray-200 text-gray-600 hover:bg-primary/5 hover:text-primary"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className="text-gray-400">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0">
                    {renderSidebar()}
                </aside>
            </div>

            {/* Mobile Filters Overlay */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-gray-50 overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-gray-800">Filters</h3>
                            <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            {renderSidebar()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
