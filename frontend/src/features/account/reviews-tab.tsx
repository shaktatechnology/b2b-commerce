'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Spinner } from '@/src/components/ui/spinner';
import { Star, Trash2, Edit2, Plus, Package, ExternalLink, MessageSquare, Quote, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchCanReview, 
  fetchMyReview, 
  submitReview, 
  updateReview, 
  destroyReview 
} from '@/src/lib/reviews-api';
import type { Order } from '@/src/types/orders';
import type { ProductReview } from '@/src/types/review';

interface ReviewsTabProps {
  orders: Order[];
}

interface ProductReviewState {
  productSlug: string;
  productName: string;
  productImage: string | null;
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  existingReviewId: string | null;
  review: ProductReview | null;
}

export function ReviewsTab({ orders }: ReviewsTabProps) {
  const router = useRouter();
  const [reviewStates, setReviewStates] = React.useState<Record<string, ProductReviewState>>({});
  const [loading, setLoading] = React.useState(true);
  
  // Interactive operations state
  const [submittingSlug, setSubmittingSlug] = React.useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = React.useState<string | null>(null);
  const [activeFormSlug, setActiveFormSlug] = React.useState<string | null>(null);
  const [ratingInput, setRatingInput] = React.useState<number>(5);
  const [messageInput, setMessageInput] = React.useState<string>('');

  React.useEffect(() => {
    if (orders.length === 0) {
      setLoading(false);
      return;
    }
    
    // Extract unique products
    const uniqueProductsObj: Record<string, { name: string; slug: string; image: string | null }> = {};
    for (const order of orders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const prod = item.variant?.product;
        if (prod && prod.slug) {
          // Resolve standard path
          let img = item.variant?.image_url || prod.image_url || null;
          // Clean up backslashes to slashes if present
          if (img) {
            img = img.replace(/\\/g, '/');
            if (!img.startsWith('http') && !img.startsWith('/')) {
              img = `/${img}`;
            }
          }
          uniqueProductsObj[prod.slug] = {
            name: prod.name,
            slug: prod.slug,
            image: img,
          };
        }
      }
    }
    
    const uniqueProducts = Object.values(uniqueProductsObj);
    if (uniqueProducts.length === 0) {
      setLoading(false);
      return;
    }
    
    const fetchAllStates = async () => {
      setLoading(true);
      const states: Record<string, ProductReviewState> = {};
      try {
        await Promise.all(
          uniqueProducts.map(async (prod) => {
            try {
              const [canReviewData, myReviewData] = await Promise.all([
                fetchCanReview(prod.slug),
                fetchMyReview(prod.slug),
              ]);
              states[prod.slug] = {
                productSlug: prod.slug,
                productName: prod.name,
                productImage: prod.image,
                canReview: canReviewData.can_review,
                hasPurchased: canReviewData.has_purchased,
                hasReviewed: canReviewData.has_reviewed,
                existingReviewId: canReviewData.existing_review_id,
                review: myReviewData,
              };
            } catch (err) {
              console.error(`Failed loading review state for ${prod.slug}`, err);
              states[prod.slug] = {
                productSlug: prod.slug,
                productName: prod.name,
                productImage: prod.image,
                canReview: false,
                hasPurchased: true,
                hasReviewed: false,
                existingReviewId: null,
                review: null,
              };
            }
          })
        );
        setReviewStates(states);
      } catch (err) {
        console.error('CRITICAL: error loading reviews', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllStates();
  }, [orders]);

  const handleOpenForm = (slug: string, existingReview: ProductReview | null) => {
    setActiveFormSlug(slug);
    if (existingReview) {
      setRatingInput(existingReview.rating);
      setMessageInput(existingReview.message);
    } else {
      setRatingInput(5);
      setMessageInput('');
    }
  };

  const handleCloseForm = () => {
    setActiveFormSlug(null);
    setRatingInput(5);
    setMessageInput('');
  };

  const handleSave = async (slug: string) => {
    if (messageInput.trim().length < 10) {
      toast.error('Review message must be at least 10 characters.');
      return;
    }
    if (messageInput.trim().length > 2000) {
      toast.error('Review message must not exceed 2000 characters.');
      return;
    }

    setSubmittingSlug(slug);
    try {
      const currentState = reviewStates[slug];
      let updatedReview: ProductReview;

      if (currentState?.review) {
        // Edit mode
        updatedReview = await updateReview(slug, currentState.review.id, {
          rating: ratingInput,
          message: messageInput.trim(),
        });
        toast.success('Review updated successfully.');
      } else {
        // Create mode
        updatedReview = await submitReview(slug, {
          rating: ratingInput,
          message: messageInput.trim(),
        });
        toast.success('Review submitted successfully.');
      }

      setReviewStates((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          canReview: false,
          hasReviewed: true,
          existingReviewId: updatedReview.id,
          review: updatedReview,
        },
      }));
      handleCloseForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingSlug(null);
    }
  };

  const handleDelete = async (slug: string, reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review for this product?')) {
      return;
    }

    setDeletingSlug(slug);
    try {
      await destroyReview(slug, reviewId);
      toast.success('Review deleted successfully.');

      // Re-fetch canReview details to restore state
      const canReviewData = await fetchCanReview(slug);

      setReviewStates((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          canReview: canReviewData.can_review,
          hasReviewed: false,
          existingReviewId: null,
          review: null,
        },
      }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review.');
    } finally {
      setDeletingSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8 text-[#966FD6]" />
      </div>
    );
  }

  const productsList = Object.values(reviewStates);

  if (productsList.length === 0) {
    return (
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] p-16 md:p-24 text-center bg-white">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-50 text-zinc-300 mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-black mb-2">No purchased products</h3>
        <p className="text-zinc-500 font-medium mb-8 max-w-sm mx-auto">When you make complete wholesale purchases, products will appear here for review submission.</p>
        <Button 
          onClick={() => router.push('/products')}
          className="rounded-xl px-8 h-12 bg-black text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all cursor-pointer shadow-lg shadow-zinc-100"
        >
          Explore Wholesale Catalog
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {productsList.map((state) => {
        const isFormActive = activeFormSlug === state.productSlug;
        const isSubmitting = submittingSlug === state.productSlug;
        const isDeleting = deletingSlug === state.productSlug;
        const productUrl = `/products/${state.productSlug}`;
        
        // Resolve absolute URL for local files if starting with public-like path
        let finalImage = state.productImage;
        if (finalImage && !finalImage.startsWith('http') && !finalImage.startsWith('data:')) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
          finalImage = `${apiBase}${finalImage}`;
        }

        return (
          <Card key={state.productSlug} className="border border-zinc-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2rem] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
              {/* Product Visual Container with badge overlay */}
              <div className="w-24 h-24 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-200/60 overflow-hidden shrink-0 relative group/review-item">
                {finalImage ? (
                  <img 
                    src={finalImage} 
                    alt={state.productName} 
                    className="w-full h-full object-cover group-hover/review-item:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} 
                  />
                ) : (
                  <Package className="w-8 h-8 text-[#966FD6]" />
                )}
                
                {/* Review status badge overlay */}
                {state.review ? (
                  <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-md border border-white" title="Reviewed">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                ) : state.canReview ? (
                  <div className="absolute bottom-1 right-1 bg-amber-400 text-white p-0.5 rounded-full shadow-md border border-white" title="Awaiting review">
                    <Star className="w-3 h-3" />
                  </div>
                ) : null}
              </div>

              {/* Title & Actions / Review State */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 
                      className="text-lg font-black text-black leading-snug hover:text-[#966FD6] transition-colors cursor-pointer truncate" 
                      onClick={() => router.push(productUrl)}
                    >
                      {state.productName}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Slug: {state.productSlug}</p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => router.push(productUrl)}
                      className="rounded-xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 flex items-center gap-1.5 h-10 px-3 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Product Page
                    </Button>

                    {!state.review && state.canReview && !isFormActive && (
                      <Button
                        onClick={() => handleOpenForm(state.productSlug, null)}
                        className="rounded-xl bg-[#966FD6] text-white hover:bg-[#855cc4] font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 h-10 px-4 shadow-md shadow-[#966FD6]/10 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Write Review
                      </Button>
                    )}
                  </div>
                </div>

                {/* Display Current review if exists and not editing */}
                {state.review && !isFormActive && (
                  <div className="bg-zinc-50/50 rounded-2xl p-5 border border-zinc-100 space-y-3 relative group/review-box border-l-4 border-l-[#966FD6]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DisplayStarRating value={state.review.rating} />
                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider block">
                          Reviewed {new Date(state.review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => handleOpenForm(state.productSlug, state.review)}
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-150 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => handleDelete(state.productSlug, state.review!.id)}
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          {isDeleting ? <Spinner className="w-3 h-3 text-rose-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Quote className="absolute -left-1 -top-2 w-7 h-7 text-[#966FD6]/5 pointer-events-none" />
                      <p className="text-sm font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap pl-6 italic">
                        "{state.review.message}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Display eligibility message if cannot review and has no review */}
                {!state.review && !state.canReview && !isFormActive && (
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50 border border-zinc-100/50 rounded-xl px-4 py-2 w-fit">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-450 shrink-0" />
                    <span>Purchase requires payment completed to leave a review.</span>
                  </div>
                )}

                {/* Collapsible Edit/New Form */}
                {isFormActive && (
                  <div className="bg-white border border-zinc-150 hover:border-zinc-200 rounded-2xl p-5 md:p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <h5 className="font-black text-xs uppercase tracking-widest text-[#966FD6] mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>{state.review ? 'Update Product Review' : 'Create Product Review'}</span>
                    </h5>

                    {/* Star Rating input */}
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Overall Rating</label>
                      <InteractiveStarRating value={ratingInput} onChange={setRatingInput} />
                    </div>

                    {/* Review message text input */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Review Message</label>
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Detail your wholesale bulk order experience, sizing feedback, and quality comments..."
                        rows={4}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-200 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 p-4 text-sm font-medium text-zinc-900 outline-none transition-all resize-none hover:bg-zinc-50 hover:border-zinc-300"
                      />
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400 px-1">
                        <span>Min 10, Max 2000 characters</span>
                        <span className={messageInput.length < 10 || messageInput.length > 2000 ? 'text-rose-500' : 'text-emerald-600'}>
                          {messageInput.length} characters
                        </span>
                      </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        variant="ghost"
                        onClick={handleCloseForm}
                        disabled={isSubmitting}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 cursor-pointer h-10 px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSave(state.productSlug)}
                        disabled={isSubmitting || messageInput.length < 10 || messageInput.length > 2000}
                        className="rounded-xl bg-black text-white hover:bg-zinc-900 font-black text-[10px] uppercase tracking-widest px-6 h-10 shadow-sm disabled:opacity-50 cursor-pointer transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-1.5">
                            <Spinner className="w-3.5 h-3.5 text-white" /> Submitting
                          </span>
                        ) : (
                          'Submit Review'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── HELPER STAR SYSTEM RENDERERS ───────────────────────────────────────────

interface InteractiveStarRatingProps {
  value: number;
  onChange: (val: number) => void;
}

function InteractiveStarRating({ value, onChange }: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  
  // Custom Labels matching selected rating
  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return "Terrible 😡";
      case 2: return "Poor 😞";
      case 3: return "Average 😐";
      case 4: return "Very Good 🙂";
      case 5: return "Excellent! 😄";
      default: return "";
    }
  };

  const activeVal = hoverValue ?? value;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5 bg-zinc-50 border border-zinc-150 p-1.5 rounded-2xl w-fit">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(star)}
            className="cursor-pointer transition-transform hover:scale-120 focus:outline-none"
            aria-label={`${star} star`}
          >
            <Star
              size={22}
              className={
                star <= activeVal
                  ? "text-yellow-400 fill-yellow-400 drop-shadow-sm transition-all"
                  : "text-zinc-200 transition-all font-light"
              }
            />
          </button>
        ))}
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-100/70 border border-zinc-200/50 px-3 py-1 rounded-xl">
        {getRatingLabel(activeVal)}
      </span>
    </div>
  );
}

function DisplayStarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= value
              ? "text-yellow-400 fill-yellow-400"
              : "text-zinc-200"
          }
        />
      ))}
    </div>
  );
}
