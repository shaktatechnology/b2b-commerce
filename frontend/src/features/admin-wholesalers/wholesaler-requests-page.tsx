'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { WholesalerRequest } from '@/src/types/wholeseller';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { Skeleton } from '@/src/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { Check, X, Eye, Building2, User, Mail, Calendar, Package } from 'lucide-react';
import { Pagination } from '@/src/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

export function WholesalerRequestsPage() {
  const [requests, setRequests] = React.useState<WholesalerRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedRequest, setSelectedRequest] = React.useState<WholesalerRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState<number | null>(null);

  const token = getAuthToken();

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: Assuming endpoint convention /admin/wholeseller-requests
      const res = await apiFetch<any>(`/admin/wholeseller/applications?page=${page}&per_page=10`, { token: token || undefined });
      
      let data: WholesalerRequest[] = [];
      let total = 0;
      let lastPage = 1;

      if (Array.isArray(res)) {
        data = res;
        total = res.length;
      } else {
        const resData = res?.data?.data || res?.data || [];
        data = Array.isArray(resData) ? resData : [];
        total = res?.total || res?.meta?.total || data.length;
        lastPage = res?.last_page || res?.meta?.last_page || 1;
      }

      setRequests(data);
      setTotalItems(total);
      setTotalPages(lastPage);
    } catch (err: any) {
      // If endpoint doesn't exist yet, we'll show empty state but keep the UI
      console.error('Failed to load requests:', err);
      // toast.error(err.message || 'Failed to load wholesaler requests');
      setRequests([]); 
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setIsProcessing(id);
    try {
      await apiFetch(`/admin/wholeseller/applications/${id}/${status}`, {
        method: 'POST',
        token: token || undefined
      });
      toast.success(`Application ${status} successfully`);
      loadRequests();
      if (selectedRequest?.id === id) setIsDetailsOpen(false);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} application`);
    } finally {
      setIsProcessing(null);
    }
  };

  const openDetails = (request: WholesalerRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="Wholesaler Approvals" 
        description="Review and manage applications for wholesale business accounts."
      />

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Business Info</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Contact</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Category</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Status</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Date</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-20 text-zinc-500 font-medium italic">
                    No pending wholesaler applications found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-black/90">{req.business_name}</p>
                          <p className="text-zinc-400 text-xs font-medium">{req.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="space-y-1">
                        <p className="font-bold text-black/90 text-sm flex items-center gap-1.5">
                          <User className="size-3 text-zinc-400" /> {req.contact_person}
                        </p>
                        <p className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                          <Mail className="size-3" /> {req.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge variant="outline" className="rounded-full border-zinc-200 text-zinc-600 font-bold text-[10px] uppercase tracking-wider">
                        <Package className="size-3 mr-1" /> {req.product_category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
                        req.status === 'approved' ? "bg-green-50 text-green-600" : 
                        req.status === 'rejected' ? "bg-red-50 text-red-600" : 
                        "bg-amber-50 text-amber-600"
                      )}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <Calendar className="size-3.5" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5 transition-all"
                          onClick={() => openDetails(req)}
                        >
                          <Eye className="size-5" />
                        </Button>
                        {req.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-all"
                              onClick={() => handleAction(req.id, 'approved')}
                              disabled={isProcessing === req.id}
                            >
                              {isProcessing === req.id ? <Spinner size="sm" /> : <Check className="size-5" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              onClick={() => handleAction(req.id, 'rejected')}
                              disabled={isProcessing === req.id}
                            >
                              {isProcessing === req.id ? <Spinner size="sm" /> : <X className="size-5" />}
                            </Button>
                          </>
                        )}
                      </div>
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

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl font-lato">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-black tracking-tight">Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about the wholesaler application.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Business Name</h4>
                    <p className="font-bold text-black/90 text-lg">{selectedRequest.business_name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Business Address</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.address}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Product Category</h4>
                    <p className="font-medium text-zinc-600 flex items-center gap-2">
                       <Package className="size-4 text-[#966FD6]" /> {selectedRequest.product_category}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Contact Person</h4>
                    <p className="font-bold text-black/90">{selectedRequest.contact_person}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Email Address</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Phone Number</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.phone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Message / Additional Info</h4>
                <div className="bg-zinc-50 rounded-xl p-4 text-sm text-zinc-600 leading-relaxed font-medium min-h-[100px]">
                  {selectedRequest.message || "No message provided."}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">STATUS:</span>
                  <Badge className={cn(
                    "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
                    selectedRequest.status === 'approved' ? "bg-green-50 text-green-600" : 
                    selectedRequest.status === 'rejected' ? "bg-red-50 text-red-600" : 
                    "bg-amber-50 text-amber-600"
                  )}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50 font-black px-6"
                      onClick={() => handleAction(selectedRequest.id, 'rejected')}
                      disabled={isProcessing !== null}
                    >
                      {isProcessing === selectedRequest.id ? <Spinner size="sm" className="mr-2" /> : <X className="size-4 mr-2" />}
                      Reject
                    </Button>
                    <Button 
                      className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white font-black px-6 shadow-lg shadow-[#966FD6]/20"
                      onClick={() => handleAction(selectedRequest.id, 'approved')}
                      disabled={isProcessing !== null}
                    >
                      {isProcessing === selectedRequest.id ? <Spinner size="sm" className="mr-2 border-white" /> : <Check className="size-4 mr-2" />}
                      Approve Business
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
