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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Edit2,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  Tag,
  Check,
  Search,
  Calendar,
  Layout,
  ExternalLink,
  Target,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { format, isBefore, isAfter, startOfDay } from "date-fns";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Matcher } from "react-day-picker";

type Offer = {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  placement: "top" | "mid" | "page";
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  product_ids?: string[] | null;
};

type OfferFormData = {
  title: string;
  description: string;
  placement: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  product_ids: string[];
};

const EMPTY_FORM: OfferFormData = {
  title: "",
  description: "",
  placement: "top",
  is_active: true,
  starts_at: "",
  ends_at: "",
  product_ids: [],
};

const PLACEMENT_OPTIONS = [
  { value: "top", label: "Top Banner", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { value: "mid", label: "Middle Section", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { value: "page", label: "Page Specific", color: "bg-purple-50 text-purple-600 border-purple-100" },
];

export default function AdminOffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
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

  const token = getAuthToken();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const freshToken = getAuthToken();
      const [offerRes, prodRes] = await Promise.all([
        apiFetch<any>("/admin/offers", { token: freshToken || undefined }),
        apiFetch<any>("/products?include_inactive=1&status=all", { token: freshToken || undefined }),
      ]);

      let offersData: Offer[] = [];
      if (Array.isArray(offerRes)) offersData = offerRes;
      else if (Array.isArray(offerRes?.data)) offersData = offerRes.data;
      else if (Array.isArray(offerRes?.data?.data)) offersData = offerRes.data.data;

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

      setOffers(offersData);
      setProducts(productsData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load offers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (mode: "create" | "edit", offer?: Offer) => {
    setFormMode(mode);
    if (mode === "edit" && offer) {
      setEditingId(offer.id);
      setFormData({
        title: offer.title,
        description: offer.description || "",
        placement: offer.placement,
        is_active: Boolean(offer.is_active),
        starts_at: offer.starts_at || "",
        ends_at: offer.ends_at || "",
        product_ids: offer.product_ids || [],
      });
      setImagePreview(offer.image);
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
      const freshToken = getAuthToken();
      const body = new FormData();
      body.append("title", formData.title);
      body.append("description", formData.description);
      body.append("placement", formData.placement);
      body.append("is_active", formData.is_active ? "1" : "0");
      
      if (formData.starts_at) {
        body.append("starts_at", new Date(formData.starts_at).toISOString());
      }
      if (formData.ends_at) {
        body.append("ends_at", new Date(formData.ends_at).toISOString());
      }

      formData.product_ids.forEach(id => {
        body.append("product_ids[]", id);
      });

      if (selectedImage) {
        body.append("image", selectedImage);
      }

      if (formMode === "create") {
        await apiFetch("/admin/offers", {
          method: "POST",
          token: freshToken || undefined,
          body,
        });
        toast.success("Offer created successfully");
      } else {
        // Use POST with _method=PUT for multipart updates
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

  return (
    <div className="space-y-8 font-lato">
      <PageHeader title="Offer Management" description="Promotional banners, seasonal deals, and targeted offers.">
        <Button
          onClick={() => openModal("create")}
          className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white rounded-xl h-11 px-6 shadow-lg shadow-[#966FD6]/20 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Offer
        </Button>
      </PageHeader>

      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-zinc-50 px-8 py-6 bg-zinc-50/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-[#966FD6]" />
            <h2 className="text-xl font-black text-black">Active Campaigns</h2>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm">
            {offers.length} Registered Offers
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-50">
                <TableHead className="py-5 px-8 font-black text-black text-xs uppercase tracking-widest">Promotion</TableHead>
                <TableHead className="py-5 px-8 font-black text-black text-xs uppercase tracking-widest">Placement</TableHead>
                <TableHead className="py-5 px-8 font-black text-black text-xs uppercase tracking-widest">Schedule</TableHead>
                <TableHead className="py-5 px-8 font-black text-black text-xs uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="py-5 px-8 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
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
              ) : offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-24 text-zinc-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                        <Target className="h-10 w-10 text-zinc-200" />
                      </div>
                      <div>
                        <p className="font-black text-black text-lg">No offers found</p>
                        <p className="text-sm font-bold text-zinc-400">Launch your first promotional campaign to see it here.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-all group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-32 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 shadow-sm transition-transform group-hover:scale-[1.02]">
                          {offer.image ? (
                            <img 
                              src={offer.image.startsWith('http') ? offer.image : `http://localhost:8000${offer.image}`} 
                              className="w-full h-full object-cover" 
                              alt={offer.title} 
                            />
                          ) : (
                            <ImageIcon className="size-8 text-zinc-300" />
                          )}
                        </div>
                        <div className="max-w-xs">
                          <p className="font-black text-black text-base group-hover:text-[#966FD6] transition-colors">{offer.title}</p>
                          <p className="text-xs font-bold text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{offer.description || "No description provided."}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="size-3 text-[#966FD6]" />
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">
                              {Array.isArray(offer.product_ids) ? offer.product_ids.length : 0} Linked Products
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
                            {offer.starts_at ? format(new Date(offer.starts_at), "MMM d, yyyy") : "ASAP"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <ArrowRight className="size-3.5" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {offer.ends_at ? format(new Date(offer.ends_at), "MMM d, yyyy") : "Indefinite"}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] border border-white/20">
            <div className="flex justify-between items-center px-10 py-8 border-b border-zinc-50 bg-white">
              <div>
                <h2 className="text-3xl font-black text-black">
                  {formMode === "create" ? "Design Campaign" : "Refine Offer"}
                </h2>
                <p className="text-zinc-400 text-sm font-bold mt-1 uppercase tracking-widest">
                  {formMode === "create" ? "Launch a new promotional event" : `Updating ${formData.title}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full h-12 w-12 hover:bg-zinc-50">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="px-10 py-10 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Left Column: Visuals */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Creative Asset</label>
                         {selectedImage && (
                           <button type="button" onClick={() => {setSelectedImage(null); setImagePreview(null);}} className="text-[10px] font-black uppercase text-red-500 hover:underline">Remove</button>
                         )}
                      </div>
                      <div className="relative group">
                        <label className={cn(
                          "flex flex-col items-center justify-center h-[320px] rounded-[40px] border-4 border-dashed transition-all cursor-pointer overflow-hidden relative",
                          imagePreview ? "border-transparent bg-zinc-50" : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-[#966FD6]/30"
                        )}>
                          {imagePreview ? (
                            <img src={imagePreview.startsWith('http') ? imagePreview : (imagePreview.startsWith('blob') ? imagePreview : `http://localhost:8000${imagePreview}`)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Preview" />
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-zinc-400">
                              <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-[#966FD6]" />
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
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs font-black uppercase tracking-widest">Click to Change Image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Preview</label>
                       <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#966FD6]/5 to-transparent border border-[#966FD6]/10 space-y-3">
                          <div className="flex items-center gap-2">
                             <span className="size-2 rounded-full bg-[#966FD6]" />
                             <span className="text-[10px] font-black text-[#966FD6] uppercase tracking-widest">Mock Display</span>
                          </div>
                          <h4 className="font-black text-xl text-black truncate">{formData.title || "Offer Title"}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-2 font-medium leading-relaxed">{formData.description || "Campaign description will appear here..."}</p>
                       </div>
                    </div>
                  </div>

                  {/* Right Column: Configuration */}
                  <div className="lg:col-span-7 space-y-10">
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-black uppercase tracking-wider ml-1">Offer Title <span className="text-red-500">*</span></label>
                          <Input 
                            value={formData.title} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/10 font-bold text-lg" 
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
                            <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-black">
                              <SelectValue placeholder="Where should this show?" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-zinc-100">
                              {PLACEMENT_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="py-3 font-bold">{opt.label}</SelectItem>
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
                          className="w-full min-h-[120px] p-5 rounded-[24px] border border-zinc-100 focus:ring-2 focus:ring-[#966FD6]/10 transition-all text-sm font-medium resize-none bg-zinc-50/50 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-6">
                          <div className="space-y-2 text-center md:text-left">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Timeline Control</label>
                            <div className="space-y-4">
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
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center md:text-left block">Launch Status</label>
                             <div 
                               onClick={() => setFormData(f => ({ ...f, is_active: !f.is_active }))}
                               className={cn(
                                 "group cursor-pointer p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center gap-2",
                                 formData.is_active 
                                   ? "bg-green-50/50 border-green-100 shadow-[0_10px_20px_rgba(34,197,94,0.1)]" 
                                   : "bg-zinc-50 border-zinc-100"
                               )}
                             >
                                <div className={cn(
                                  "w-12 h-6 rounded-full relative transition-colors",
                                  formData.is_active ? "bg-green-500" : "bg-zinc-200"
                                )}>
                                   <div className={cn(
                                     "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                                     formData.is_active ? "translate-x-7" : "translate-x-1"
                                   )} />
                                </div>
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  formData.is_active ? "text-green-600" : "text-zinc-400"
                                )}>
                                  {formData.is_active ? "Campaign Active" : "Campaign Paused"}
                                </span>
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Targeted Inventory</label>
                           <span className="text-[10px] font-black text-[#966FD6] bg-[#966FD6]/5 px-3 py-1 rounded-full">{formData.product_ids.length} Selected</span>
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

                         <div className="flex flex-wrap gap-2 pt-2">
                           {formData.product_ids.map(id => {
                             const p = products.find(prod => prod.id.toString() === id);
                             if (!p) return null;
                             return (
                               <div key={id} className="flex items-center gap-2 bg-zinc-100/50 border border-zinc-200 px-3 py-1.5 rounded-full group hover:bg-red-50 hover:border-red-100 transition-all">
                                  <span className="text-[10px] font-extrabold text-zinc-600 group-hover:text-red-600 truncate max-w-[120px]">{p.name}</span>
                                  <button type="button" onClick={() => toggleProductSelection(id)} className="text-zinc-400 hover:text-red-600">
                                    <X className="size-3" />
                                  </button>
                               </div>
                             );
                           })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-zinc-50">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Target className="size-5 text-amber-500" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 max-w-xs leading-tight">
                        Offers appear on the storefront based on their placement and active status.
                      </p>
                   </div>
                   <div className="flex w-full sm:w-auto gap-4">
                      <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 sm:flex-none font-bold text-zinc-400 rounded-2xl h-14 px-8 hover:bg-zinc-50 transition-colors">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none bg-black hover:bg-zinc-800 text-white px-12 h-14 rounded-2xl font-black shadow-2xl transition-all active:scale-[0.98] relative overflow-hidden"
                      >
                        {isSubmitting && <div className="absolute inset-x-0 bottom-0 h-1 bg-[#966FD6] animate-[shimmer_2s_infinite]" />}
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                             <Spinner size="sm" className="border-white" />
                             <span>Syncing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <Layout className="size-4" />
                             <span>{formMode === "create" ? "Launch Campaign" : "Sync Changes"}</span>
                          </div>
                        )}
                      </Button>
                   </div>
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
    </div>
  );
}