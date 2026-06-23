"use client";

import * as React from "react";
import { apiFetch } from "@/src/lib/api";
import { getAuthToken } from "@/src/lib/auth";
import { Product } from "@/src/types";
import { PageHeader } from "@/src/components/layout-components/page-wrapper";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Spinner } from "@/src/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Tag, Check, Search, Calendar, Layout, ExternalLink, Target, CircleDot, ArrowRight, FilterX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Pagination } from "@/src/components/ui/pagination";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Matcher } from "react-day-picker";

import { Offer, OfferFormData } from "@/src/types/offer";

const EMPTY_FORM: OfferFormData = {
  title: "",
  description: "",
  placement: "top",
  is_active: true,
  starts_at: "",
  ends_at: "",
  product_ids: [],
  brand_id: "",
};

const PLACEMENT_OPTIONS = [
  { value: "top", label: "Top Banner", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { value: "mid", label: "Middle Section", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { value: "page", label: "Page Specific", color: "bg-purple-50 text-purple-600 border-purple-100" },
  { value: "deal", label: "Deal of the Day", color: "bg-rose-50 text-rose-600 border-rose-100" },
];

const BACKEND_URL = "http://localhost:8000";

function getOfferImageUrl(offer: Offer | string | null | undefined): string | null {
  if (!offer) return null;

  let imagePath = typeof offer === 'string' ? offer : (offer.image_url || offer.image);

  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/')) return `${BACKEND_URL}${imagePath}`;
  // Handle paths like "offers/xxx.jpg" or "storage/offers/xxx.jpg"
  if (imagePath.startsWith('storage/')) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/storage/${imagePath}`;
}

function parseBackendDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // If it's already an ISO string, return it
  if (dateStr.includes('T')) return dateStr;
  // If it's Y-m-d H:i:s, assume UTC and convert to ISO
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T') + 'Z').toISOString();
  }
  return dateStr;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Form State
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<OfferFormData>({ ...EMPTY_FORM });
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Search for products in form
  const [prodSearch, setProdSearch] = React.useState("");

  // Filter State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [placementFilter, setPlacementFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>();
  const [dateTo, setDateTo] = React.useState<Date | undefined>();
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  const token = getAuthToken();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const freshToken = getAuthToken();
      const [offerRes, prodRes, brandsRes] = await Promise.all([
        apiFetch<any>(`/offers?include_inactive=1&status=all&page=${page}&per_page=10`, { token: freshToken || undefined }),
        apiFetch<any>("/products?include_inactive=1&status=all&all=1", { token: freshToken || undefined }),
        apiFetch<any>("/brands", { token: freshToken || undefined }),
      ]);

      let offersData: Offer[] = [];
      let total = 0;
      let lastPage = 1;

      if (Array.isArray(offerRes)) {
        offersData = offerRes;
        total = offerRes.length;
      } else {
        const resData = offerRes?.data?.data || offerRes?.data || [];
        offersData = Array.isArray(resData) ? resData : [];
        total = offerRes?.total || offerRes?.meta?.total || offersData.length;
        lastPage = offerRes?.last_page || offerRes?.meta?.last_page || 1;
      }

      let productsData: Product[] = [];
      // Handle exhaustive nested data patterns common in paginated APIs
      if (Array.isArray(prodRes)) {
        productsData = prodRes;
      } else if (Array.isArray(prodRes?.data)) {
        productsData = prodRes.data;
      } else if (Array.isArray(prodRes?.data?.data)) {
        productsData = prodRes.data.data;
      } else if (prodRes?.data?.data?.data && Array.isArray(prodRes.data.data.data)) {
        // Extreme nesting occasionally seen in some wrappers
        productsData = prodRes.data.data.data;
      }

      // Debug: log the raw offer data to see image field format
      if (offersData.length > 0) {
        console.log("[Offers Debug] First offer raw data:", JSON.stringify(offersData[0], null, 2));
        console.log("[Offers Debug] Image field value:", offersData[0].image);
        console.log("[Offers Debug] Resolved URL:", getOfferImageUrl(offersData[0].image));
      }

      setOffers(offersData);
      setProducts(productsData);
      setBrands(brandsRes?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load offers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData, page]);

  const openModal = (mode: "create" | "edit", offer?: Offer) => {
    setFormMode(mode);
    if (mode === "edit" && offer) {
      setEditingId(offer.id);

      // Get IDs from either product_ids array or products relationship objects
      const linkedIds = (offer.product_ids || (offer as any).products)?.map((p: any) =>
        (typeof p === 'object' ? p.id.toString() : p.toString())
      ) || [];

      setFormData({
        title: offer.title,
        description: offer.description || "",
        placement: offer.placement,
        is_active: offer.is_active == null ? true : Boolean(Number(offer.is_active)),
        starts_at: parseBackendDate(offer.starts_at),
        ends_at: parseBackendDate(offer.ends_at),
        product_ids: linkedIds,
        brand_id: offer.brand_id || "",
      });
      setImagePreview(offer.image_url || offer.image);
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...EMPTY_FORM });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingId(null);
    setProdSearch("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleProductSelection = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.product_ids.includes(id);
      return {
        ...prev,
        product_ids: isSelected
          ? prev.product_ids.filter(p => p !== id)
          : [...prev.product_ids, id]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === "create" && !selectedImage) {
      toast.error("An image is required for new offers");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append("title", formData.title || "");
      body.append("description", formData.description || "");
      body.append("placement", formData.placement || "top");
      body.append("is_active", formData.is_active ? "1" : "0");

      if (formData.starts_at) {
        body.append("starts_at", formData.starts_at);
      }

      if (formData.ends_at) {
        body.append("ends_at", formData.ends_at);
      }

      if (formData.brand_id) {
        body.append("brand_id", formData.brand_id);
      }

      if (formData.product_ids && formData.product_ids.length > 0) {
        formData.product_ids.forEach(id => {
          body.append("product_ids[]", id);
        });
      }

      if (selectedImage) {
        body.append("image", selectedImage);
      }

      // Log for debugging
      console.log("Submitting Offer Application Data:");
      for (let [key, value] of (body as any).entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      const freshToken = getAuthToken();

      if (formMode === "create") {
        await apiFetch("/admin/offers", {
          method: "POST",
          token: freshToken || undefined,
          body,
        });
        toast.success("Offer created successfully");
      } else {
        body.append("_method", "PUT");
        await apiFetch(`/admin/offers/${editingId}`, {
          method: "POST",
          token: freshToken || undefined,
          body,
        });
        toast.success("Offer updated successfully");
      }
      closeModal();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOffers = React.useMemo(() => {
    return offers.filter(offer => {
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = offer.title?.toLowerCase().includes(query);
        const matchesDesc = offer.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Placement Filter
      if (placementFilter !== "all" && offer.placement !== placementFilter) return false;

      // Date Created Filter
      if (offer.created_at) {
        const createdDate = new Date(offer.created_at);
        if (dateFrom && isBefore(createdDate, startOfDay(dateFrom))) return false;
        if (dateTo && isAfter(createdDate, endOfDay(dateTo))) return false;
      }

      return true;
    });
  }, [offers, searchQuery, placementFilter, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const freshToken = getAuthToken();
      await apiFetch(`/admin/offers/${id}`, {
        method: "DELETE",
        token: freshToken || undefined,
      });
      toast.success("Offer deleted successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const filteredFormProducts = React.useMemo(() => {
    if (!prodSearch) return [];
    return products.filter(p =>
      p.name?.toLowerCase().includes(prodSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, prodSearch]);

  const clearFilters = () => {
    setSearchQuery('');
    setPlacementFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader title="Offer Management" description="Promotional banners, seasonal deals, and targeted offers.">
        <Button
          onClick={() => openModal("create")}
          className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white rounded-xl h-11 px-4 sm:px-6 shadow-lg shadow-[#966FD6]/20 transition-all active:scale-95 text-xs sm:text-sm"
        >
          <Plus className="mr-1.5 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add New Offer</span>
          <span className="sm:hidden">Add Offer</span>
        </Button>
      </PageHeader>

      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden relative">
        {/* Filters Bar */}
        <div className="bg-zinc-50/30 border-b border-zinc-50 px-6 sm:px-10 py-6 sm:py-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
            <h2 className="text-lg font-black text-black shrink-0">Offer Registry</h2>
            <span className="text-xs font-bold text-zinc-400">
              {totalItems} Offers Total
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1 justify-end">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Search Offers</span>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Offers..."
                  className="pl-10 h-11 rounded-xl border-zinc-100 bg-white focus:ring-4 focus:ring-[#966FD6]/5 transition-all font-bold text-xs shadow-sm"
                />
              </div>
            </div>

            {/* Placement Filter */}
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Location</span>
              <Select value={placementFilter} onValueChange={setPlacementFilter}>
                <SelectTrigger className="h-11 w-full md:w-44 rounded-xl border-zinc-100 bg-white hover:bg-zinc-50 transition-colors font-bold text-xs shadow-sm">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl border-zinc-100">
                  <SelectItem value="all" className="text-xs font-bold font-lato">All Locations</SelectItem>
                  {PLACEMENT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold font-lato">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">From:</span>
                <div className="w-50">
                  <DatePicker
                    date={dateFrom}
                    setDate={setDateFrom}
                    placeholder="Start Date"
                    disabled={dateTo ? { after: dateTo } : undefined}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">To:</span>
                <div className="w-50">
                  <DatePicker
                    date={dateTo}
                    setDate={setDateTo}
                    placeholder="End Date"
                    disabled={dateFrom ? { before: dateFrom } : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {(searchQuery || placementFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold gap-2"
            >
              <FilterX className="size-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-50">
                <TableHead className="py-6 px-6 sm:px-10 font-black text-black text-xs uppercase tracking-widest">Promotion</TableHead>
                <TableHead className="py-6 px-6 sm:px-10 font-black text-black text-xs uppercase tracking-widest">Placement</TableHead>
                <TableHead className="py-6 px-6 sm:px-10 font-black text-black text-xs uppercase tracking-widest">Schedule</TableHead>
                <TableHead className="py-6 px-6 sm:px-10 font-black text-black text-xs uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="py-6 px-6 sm:px-10 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-32 rounded-2xl shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex justify-center">
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-24 text-zinc-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                        <FilterX className="h-10 w-10 text-zinc-200" />
                      </div>
                      <div>
                        <p className="font-black text-black text-lg">No matches found</p>
                        <p className="text-sm font-bold text-zinc-400">Try adjusting your filters to find what you're looking for.</p>
                      </div>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("");
                          setPlacementFilter("all");
                          setDateFrom(undefined);
                          setDateTo(undefined);
                        }}
                        className="text-[#966FD6] font-black text-xs uppercase tracking-widest"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => (
                  <TableRow key={offer.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-all group">
                    <TableCell className="py-5 sm:py-8 px-6 sm:px-10">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="h-14 sm:h-20 w-20 sm:w-32 rounded-xl sm:rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 shadow-sm transition-transform group-hover:scale-[1.02]">
                          {getOfferImageUrl(offer) ? (
                            <img
                              src={getOfferImageUrl(offer)!}
                              className="w-full h-full object-cover"
                              alt={offer.title}
                            />
                          ) : (
                            <ImageIcon className="size-6 sm:size-8 text-zinc-300" />
                          )}
                        </div>
                        <div className="max-w-xs">
                          <p className="font-black text-black text-base group-hover:text-[#966FD6] transition-colors">{offer.title}</p>
                          <p className="text-xs font-bold text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{offer.description || "No description provided."}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="size-3 text-[#966FD6]" />
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">
                              {(Array.isArray(offer.product_ids) && offer.product_ids.length > 0) ? offer.product_ids.length : (Array.isArray((offer as any).products) ? (offer as any).products.length : 0)} Linked Products
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <span className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                        PLACEMENT_OPTIONS.find(p => p.value === offer.placement)?.color || "bg-zinc-50 text-zinc-500 border-zinc-100"
                      )}>
                        {PLACEMENT_OPTIONS.find(p => p.value === offer.placement)?.label || offer.placement}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Calendar className="size-3.5" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {offer.starts_at ? format(new Date(parseBackendDate(offer.starts_at)), "MMM d, yyyy HH:mm") : "ASAP"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <ArrowRight className="size-3.5" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {offer.ends_at ? format(new Date(parseBackendDate(offer.ends_at)), "MMM d, yyyy HH:mm") : "Indefinite"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-center text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        offer.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        <span className={cn("size-1.5 rounded-full animate-pulse", offer.is_active ? "bg-green-500" : "bg-red-500")} />
                        {offer.is_active ? "Running" : "Paused"}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal("edit", offer)}
                        className="rounded-xl text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5 h-11 w-11 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(offer.id)}
                        className="rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 h-11 w-11 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="border-t border-zinc-50 bg-zinc-50/30">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 sm:px-10 py-6 sm:py-8 border-b border-zinc-50 bg-white gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-black">
                  {formMode === "create" ? "Design Campaign" : "Refine Offer"}
                </h2>
                <p className="text-zinc-400 text-[10px] sm:text-sm font-bold mt-1 uppercase tracking-widest">
                  {formMode === "create" ? "Launch a new promotional event" : `Updating ${formData.title}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full h-10 w-10 sm:h-12 sm:w-12 hover:bg-zinc-50 absolute top-4 right-4 sm:static">
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="px-6 sm:px-10 py-6 sm:py-10 space-y-8 sm:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">

                  {/* Left Column: Visuals */}
                  <div className="lg:col-span-5 space-y-6 sm:space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Creative Asset</label>
                        {selectedImage && (
                          <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="text-[10px] font-black uppercase text-red-500 hover:underline">Remove</button>
                        )}
                      </div>
                      <div className="relative group">
                        <label className={cn(
                          "flex flex-col items-center justify-center min-h-[240px] sm:h-[320px] rounded-[32px] sm:rounded-[40px] border-4 border-dashed transition-all cursor-pointer overflow-hidden relative",
                          imagePreview ? "border-transparent bg-zinc-50" : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-[#966FD6]/30"
                        )}>
                          {imagePreview ? (
                            <img src={imagePreview.startsWith('blob') ? imagePreview : (getOfferImageUrl(imagePreview) || imagePreview)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Preview" />
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-zinc-400 p-6">
                              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#966FD6]" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-black text-black">Upload Banner Image</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">High resolution PNG or JPG (Max 5MB)</p>
                              </div>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        {imagePreview && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-[32px] sm:rounded-[40px]">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">Click to Change Image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Preview</label>
                      <div className="p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-[#966FD6]/5 to-transparent border border-[#966FD6]/10 space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="size-1.5 sm:size-2 rounded-full bg-[#966FD6]" />
                          <span className="text-[10px] font-black text-[#966FD6] uppercase tracking-widest">Mock Display</span>
                        </div>
                        <h4 className="font-black text-lg sm:text-xl text-black truncate">{formData.title || "Offer Title"}</h4>
                        <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-2 font-medium leading-relaxed">{formData.description || "Campaign description will appear here..."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Configuration */}
                  <div className="lg:col-span-7 space-y-8 sm:space-y-10">

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-black uppercase tracking-wider ml-1">Offer Title <span className="text-red-500">*</span></label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-zinc-50/50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/10 font-bold text-base sm:text-lg"
                            placeholder="e.g. MEGA SUMMER FESTIVAL"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-black uppercase tracking-wider ml-1">Placement Location</label>
                          <Select
                            value={formData.placement}
                            onValueChange={(val) => setFormData({ ...formData, placement: val })}
                          >
                            <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-zinc-100 bg-zinc-50/50 font-black">
                              <SelectValue placeholder="Where should this show?" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl sm:rounded-2xl shadow-2xl border-zinc-100">
                              {PLACEMENT_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="py-2.5 sm:py-3 font-bold text-xs sm:text-sm">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-black uppercase tracking-wider ml-1">Campaign Narrative</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe the promotion in detail..."
                          className="w-full min-h-[100px] sm:min-h-[120px] p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-zinc-100 focus:ring-2 focus:ring-[#966FD6]/10 transition-all text-xs sm:text-sm font-medium resize-none bg-zinc-50/50 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-6 pt-2 sm:pt-4">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Timeline Control</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-black text-zinc-500 uppercase ml-1">Start Date/Time</span>
                              <DateTimePicker
                                date={(() => {
                                  const d = formData.starts_at ? new Date(formData.starts_at) : undefined;
                                  return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
                                })()}
                                setDate={(d) => setFormData({ ...formData, starts_at: d ? d.toISOString() : "" })}
                                placeholder="Select Start"
                                disabled={(() => {
                                  const d = formData.ends_at ? new Date(formData.ends_at) : null;
                                  return d instanceof Date && !isNaN(d.getTime()) ? { after: d } : undefined;
                                })()}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-black text-zinc-500 uppercase ml-1">End Date/Time</span>
                              <DateTimePicker
                                date={(() => {
                                  const d = formData.ends_at ? new Date(formData.ends_at) : undefined;
                                  return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
                                })()}
                                setDate={(d) => setFormData({ ...formData, ends_at: d ? d.toISOString() : "" })}
                                placeholder="Select End"
                                disabled={(() => {
                                  const d = formData.starts_at ? new Date(formData.starts_at) : null;
                                  return d instanceof Date && !isNaN(d.getTime()) ? { before: d } : undefined;
                                })()}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-zinc-50/50 p-4 sm:p-5 rounded-[24px] border border-zinc-100">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">Launch Status</label>
                          <label className="flex items-center gap-3 cursor-pointer group w-fit">
                            <div className={cn("w-10 h-6 rounded-full transition-colors relative", formData.is_active ? "bg-green-500" : "bg-zinc-200")}>
                              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm", formData.is_active ? "translate-x-5" : "translate-x-1")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={!!formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                            <span className="text-sm font-bold text-zinc-600 transition-colors group-hover:text-black">
                              {formData.is_active ? "Campaign is Active" : "Campaign is Paused"}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-black uppercase tracking-wider ml-1">Target Brand</label>
                        <Select
                          value={formData.brand_id || "none"}
                          onValueChange={(val) => {
                            const newBrandId = val === "none" ? "" : val;
                            // Automatically select all products of this brand if selected
                            let newProdIds = [...formData.product_ids];
                            if (newBrandId) {
                              const brandProds = products
                                .filter(p => p.brand_id?.toString() === newBrandId)
                                .map(p => p.id.toString());

                              // Add brand products to selection (avoid duplicates)
                              newProdIds = Array.from(new Set([...newProdIds, ...brandProds]));
                            }

                            setFormData({
                              ...formData,
                              brand_id: newBrandId,
                              product_ids: newProdIds
                            });
                          }}
                        >
                          <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-zinc-100 bg-zinc-50/50 font-black">
                            <SelectValue placeholder="Filter by Brand" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl sm:rounded-2xl shadow-2xl border-zinc-100">
                            <SelectItem value="none" className="py-2.5 sm:py-3 font-bold text-xs sm:text-sm text-zinc-400">No Specific Brand</SelectItem>
                            {brands.map(brand => (
                              <SelectItem key={brand.id} value={brand.id.toString()} className="py-2.5 sm:py-3 font-bold text-xs sm:text-sm">{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Targeted Inventory</label>
                        <span className="text-[10px] font-black text-[#966FD6] bg-[#966FD6]/5 px-3 py-1 rounded-full">
                          {formData.brand_id ? `${brands.find(b => b.id.toString() === formData.brand_id)?.name} Products Selected` : `${formData.product_ids.length} Selected`}
                        </span>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <Input
                          placeholder="Link specific products to this offer..."
                          value={prodSearch}
                          onChange={(e) => setProdSearch(e.target.value)}
                          className="h-14 pl-12 rounded-2xl border-zinc-300 bg-white shadow-sm focus:border-[#966FD6] focus:ring-4 focus:ring-[#966FD6]/5 font-bold text-sm text-black placeholder:text-zinc-400 transition-all"
                        />

                        {prodSearch && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-[60] bg-white border border-zinc-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredFormProducts.length === 0 ? (
                              <div className="p-5 text-center text-xs font-bold text-zinc-400 italic">No products matched "{prodSearch}"</div>
                            ) : (
                              filteredFormProducts.map(p => (
                                <button
                                  key={`search-prod-${p.id}`}
                                  type="button"
                                  onClick={() => {
                                    toggleProductSelection(p.id.toString());
                                    setProdSearch("");
                                  }}
                                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 border-b border-zinc-50 last:border-0 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
                                      {p.thumbnail || p.image_url ? (
                                        <img src={(p.thumbnail || p.image_url)?.startsWith('http') ? (p.thumbnail || p.image_url) : `http://localhost:8000${p.thumbnail || p.image_url}`} className="w-full h-full object-cover" alt="" />
                                      ) : <ImageIcon className="size-5 text-zinc-300" />}
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-black text-black">{p.name || "Unnamed Product"}</p>
                                      <p className="text-xs font-bold text-zinc-400">
                                        {p.variants?.[0]?.retail_price ? `$${p.variants[0].retail_price}` : "No price set"}
                                      </p>
                                    </div>
                                  </div>
                                  {formData.product_ids.includes(p.id.toString()) && (
                                    <div className="h-7 w-7 rounded-full bg-[#966FD6] flex items-center justify-center shadow-md">
                                      <Check className="size-4 text-white" />
                                    </div>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 max-h-[120px] overflow-y-auto scrollbar-hide">
                        {formData.product_ids.map(id => {
                          const p = products.find(prod => prod.id.toString() === id);
                          return (
                            <div key={id} className="flex items-center gap-2 bg-zinc-100/50 border border-zinc-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full group hover:bg-red-50 hover:border-red-100 transition-all">
                              <span className="text-[9px] sm:text-[10px] font-extrabold text-zinc-600 group-hover:text-red-600 truncate max-w-[100px] sm:max-w-[120px]">
                                {p ? p.name : `Product #${id}`}
                              </span>
                              <button type="button" onClick={() => toggleProductSelection(id)} className="text-zinc-400 hover:text-red-600">
                                <X className="size-2.5 sm:size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 sm:pt-10 border-t border-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                    <Target className="size-4 sm:size-5 text-amber-500" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-400 max-w-xs leading-tight">
                    Offers appear on the storefront based on their placement and active status.
                  </p>
                </div>
                <div className="flex w-full sm:w-auto gap-3 sm:gap-4">
                  <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 sm:flex-none font-bold text-zinc-400 rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 hover:bg-zinc-50 transition-colors text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-12 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black shadow-2xl transition-all active:scale-[0.98] relative overflow-hidden text-xs sm:text-sm"
                  >
                    {isSubmitting && <div className="absolute inset-x-0 bottom-0 h-1 bg-[#966FD6] animate-[shimmer_2s_infinite]" />}
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" className="border-white" />
                        <span className="hidden sm:inline">Syncing...</span>
                        <span className="sm:hidden">Syncing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 ">
                        <Layout className="size-4" />
                        <span>{formMode === "create" ? "Launch Campaign" : "Sync Changes"}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div >
  );
}