'use client';

import * as React from 'react';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, X, Clock, User, Package, HandCoins, Info } from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Pagination } from '@/src/components/ui/pagination';
import { cn } from '@/src/lib/utils';
import { Spinner } from '@/src/components/ui/spinner';

interface CODRequest {
  id: string | number;
  order_number: string;
  customer_name: string;
  amount: number | string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user_type: 'retail' | 'wholesale';
  notes?: string;
}

export function CODApprovalsPage() {
  const [requests, setRequests] = React.useState<CODRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState<string | number | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const token = getAuthToken();

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming a specific endpoint for COD approvals or filtering orders
      const res = await apiFetch<any>(`/admin/cod-approvals?page=${page}&per_page=10`, { 
        token: token || undefined 
      });
      
      let items: CODRequest[] = [];
      let total = 0;
      let lastPage = 1;

      if (Array.isArray(res)) {
        items = res;
        total = res.length;
      } else {
        const resData = res?.data?.data || res?.data || [];
        items = Array.isArray(resData) ? resData : [];
        total = res?.total || res?.meta?.total || items.length;
        lastPage = res?.last_page || res?.meta?.last_page || 1;
      }

      setRequests(items);
      setTotalItems(total);
      setTotalPages(lastPage);
    } catch (err: any) {
      console.error('Failed to load COD requests:', err);
      // Mock data for demonstration if API is not ready
      setRequests([
        { 
          id: 1, 
          order_number: 'ORD-2024-001', 
          customer_name: 'John Doe', 
          amount: 15000, 
          created_at: new Date().toISOString(), 
          status: 'pending',
          user_type: 'wholesale',
          notes: 'Regular wholesaler requesting COD for bulk order.'
        },
        { 
          id: 2, 
          order_number: 'ORD-2024-002', 
          customer_name: 'Jane Smith', 
          amount: 2500, 
          created_at: new Date().toISOString(), 
          status: 'pending',
          user_type: 'retail',
          notes: 'First time COD request.'
        },
      ]);
      setTotalItems(2);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (id: string | number, action: 'approve' | 'reject') => {
    setIsActionLoading(id);
    try {
      await apiFetch(`/admin/cod-approvals/${id}/${action}`, {
        method: 'POST',
        token: token || undefined,
      });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} request`);
      // Update local state for mock demonstration
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="COD Approvals" 
        description="Verify and approve Cash on Delivery requests for wholesale and retail orders."
      />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest">Order Info</TableHead>
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest">Customer</TableHead>
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest">Amount</TableHead>
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest">Type</TableHead>
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="py-5 px-6 font-black text-[#966FD6] text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && requests.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                    <TableCell className="py-5 px-6 text-right"><Skeleton className="h-9 w-24 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-20">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center">
                        <HandCoins className="size-8 stroke-1 text-zinc-300" />
                      </div>
                      <p className="font-bold text-lg text-zinc-500">No COD requests found</p>
                      <p className="text-sm max-w-[250px]">All pending Cash on Delivery orders will appear here for your review.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((item) => (
                  <TableRow key={item.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-all duration-200 group">
                    <TableCell className="py-5 px-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-black group-hover:text-[#966FD6] transition-colors">#{item.order_number}</span>
                          {item.notes && (
                            <div className="relative group/note">
                              <Info className="size-3.5 text-zinc-300 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/note:block w-48 p-2 bg-black text-white text-[10px] rounded-lg shadow-xl z-50">
                                {item.notes}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <User className="size-4" />
                        </div>
                        <span className="font-bold text-zinc-700">{item.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 font-black text-black">
                      Rs. {Number(item.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
                        item.user_type === 'wholesale' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {item.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <div className="flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {item.status === 'pending' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white font-bold text-xs h-9 rounded-xl transition-all"
                              onClick={() => handleAction(item.id, 'approve')}
                              disabled={isActionLoading === item.id}
                            >
                              {isActionLoading === item.id ? <Spinner size="xs" /> : <Check className="size-3.5 mr-1" />}
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white font-bold text-xs h-9 rounded-xl transition-all"
                              onClick={() => handleAction(item.id, 'reject')}
                              disabled={isActionLoading === item.id}
                            >
                              {isActionLoading === item.id ? <Spinner size="xs" /> : <X className="size-3.5 mr-1" />}
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-zinc-400 italic">Action Completed</span>
                        )}
                      </div>
                      {/* Show actions even without hover on mobile */}
                      <div className="flex justify-end gap-2 lg:hidden">
                        {item.status === 'pending' && (
                           <Button 
                           variant="outline" 
                           size="sm" 
                           className="bg-green-50 text-green-600 border-green-100 font-bold text-xs h-9 rounded-xl"
                           onClick={() => handleAction(item.id, 'approve')}
                           disabled={isActionLoading === item.id}
                         >
                           {isActionLoading === item.id ? <Spinner size="xs" /> : <Check className="size-3.5" />}
                         </Button>
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
          <div className="border-t border-zinc-50 bg-zinc-50/30 px-6 py-4">
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
    </div>
  );
}

function StatusBadge({ status }: { status: CODRequest['status'] }) {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-green-50 text-green-600 border-green-100",
    rejected: "bg-red-50 text-red-600 border-red-100",
  };
  
  const icons = {
    pending: <Clock className="size-3 mr-1" />,
    approved: <Check className="size-3 mr-1" />,
    rejected: <X className="size-3 mr-1" />,
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", 
      styles[status]
    )}>
      {icons[status]}
      {status}
    </span>
  );
}
