'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { AuthUser } from '@/src/types';
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
import { Check, X, Eye, Building2, User, Mail, Calendar, Phone, MapPin } from 'lucide-react';
import { Pagination } from '@/src/components/ui/pagination';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Search, Filter, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/src/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ConfirmDialog } from '@/src/components/modals/confirm-dialog';

export function WholesalerRequestsPage() {
  const [requests, setRequests] = React.useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedRequest, setSelectedRequest] = React.useState<AuthUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  
  // Confirmation Dialog State
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    id: string;
    action: 'approve' | 'reject';
  }>({
    isOpen: false,
    id: '',
    action: 'approve'
  });
  
  // Filters
  const [status, setStatus] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);

  const token = getAuthToken();
  const perPage = 10;

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (status !== 'all') queryParams.append('status', status);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const res = await apiFetch<{ message: string; data: AuthUser[] }>(
        `/admin/wholesalers?${queryParams.toString()}`, 
        { token: token || undefined }
      );
      
      const items = Array.isArray(res.data) ? res.data : [];
      setRequests(items);
      setTotalItems(items.length);
      setTotalPages(Math.ceil(items.length / perPage) || 1);
      setPage(1); // Reset to first page on filter change
    } catch (err: any) {
      console.error('Failed to load wholesalers:', err);
      toast.error(err.message || 'Failed to load wholesalers');
      setRequests([]); 
    } finally {
      setIsLoading(false);
    }
  }, [token, status, debouncedSearch]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(id);
    try {
      await apiFetch(`/admin/wholesalers/${id}/${action}`, {
        method: 'PATCH',
        token: token || undefined
      });
      toast.success(`Wholesaler ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadRequests();
      if (selectedRequest?.id === id) setIsDetailsOpen(false);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} wholesaler`);
    } finally {
      setIsProcessing(null);
    }
  };

  const openDetails = (request: AuthUser) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  // Client-side pagination of the full list
  const paginatedRequests = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return requests.slice(start, start + perPage);
  }, [requests, page]);

  const getStatusBadge = (user: AuthUser) => {
    const status = user.wholeseller_status || 'pending';
    return (
      <Badge className={cn(
        "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
        status === 'approved' ? "bg-green-50 text-green-600" : 
        status === 'rejected' ? "bg-red-50 text-red-600" : 
        "bg-amber-50 text-amber-600"
      )}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="Wholesaler Management" 
        description="View and manage all wholesale business accounts, applications, and status."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search by company, name or email..." 
            className="pl-10 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 bg-zinc-50 border-zinc-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-zinc-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-11 px-4 border-zinc-200 text-zinc-500 hover:text-black rounded-xl w-full flex items-center gap-2"
            onClick={() => {
              setSearch('');
              setStatus('all');
            }}
          >
            <RotateCcw className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest w-[80px]">S.N.</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Business Info</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Contact</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Address</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Status</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
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
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-20 text-zinc-500 font-medium italic">
                    No wholesalers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((req, index) => (
                  <TableRow key={req.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6 font-bold text-zinc-400 text-sm">
                      {(page - 1) * perPage + index + 1}.
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-black/90">{req.company_name || req.name}</p>
                          <p className="text-zinc-400 text-xs font-medium flex items-center gap-1">
                            <Mail className="size-3" /> {req.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="space-y-1">
                        <p className="font-bold text-black/90 text-sm flex items-center gap-1.5">
                          <User className="size-3 text-zinc-400" /> {req.name}
                        </p>
                        <p className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                          <Phone className="size-3" /> {req.phone || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-start gap-1 text-zinc-500 text-sm max-w-[200px]">
                        <MapPin className="size-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 leading-tight">{req.address || 'No address provided'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      {getStatusBadge(req)}
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-30"
                          onClick={() => setConfirmState({ isOpen: true, id: req.id, action: 'approve' })}
                          disabled={isProcessing === req.id || req.wholeseller_status === 'approved'}
                          title="Approve"
                        >
                          {isProcessing === req.id ? <Spinner size="sm" /> : <Check className="size-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30"
                          onClick={() => setConfirmState({ isOpen: true, id: req.id, action: 'reject' })}
                          disabled={isProcessing === req.id || req.wholeseller_status === 'rejected'}
                          title="Reject"
                        >
                          {isProcessing === req.id ? <Spinner size="sm" /> : <X className="size-5" />}
                        </Button>
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
              itemsPerPage={perPage}
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
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Business / Company</h4>
                    <p className="font-bold text-black/90 text-lg">{selectedRequest.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Address</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.address || 'No address provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Verified</h4>
                    <p className="font-medium text-zinc-600">
                      {selectedRequest.is_verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Contact Person</h4>
                    <p className="font-bold text-black/90">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Email Address</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Phone Number</h4>
                    <p className="font-medium text-zinc-600">{selectedRequest.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">STATUS:</span>
                  {getStatusBadge(selectedRequest)}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50 font-black px-6"
                    onClick={() => setConfirmState({ isOpen: true, id: selectedRequest.id, action: 'reject' })}
                    disabled={isProcessing !== null || selectedRequest.wholeseller_status === 'rejected'}
                  >
                    {isProcessing === selectedRequest.id ? <Spinner size="sm" className="mr-2" /> : <X className="size-4 mr-2" />}
                    Reject
                  </Button>
                  <Button 
                    className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white font-black px-6 shadow-lg shadow-[#966FD6]/20"
                    onClick={() => setConfirmState({ isOpen: true, id: selectedRequest.id, action: 'approve' })}
                    disabled={isProcessing !== null || selectedRequest.wholeseller_status === 'approved'}
                  >
                    {isProcessing === selectedRequest.id ? <Spinner size="sm" className="mr-2 border-white" /> : <Check className="size-4 mr-2" />}
                    Approve Business
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => handleAction(confirmState.id, confirmState.action)}
        title={`Confirm ${confirmState.action === 'approve' ? 'Approval' : 'Rejection'}`}
        description={`Are you sure you want to ${confirmState.action} this wholesaler application?`}
        variant={confirmState.action === 'reject' ? 'destructive' : 'default'}
        isLoading={isProcessing !== null}
        confirmLabel={confirmState.action === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
}
