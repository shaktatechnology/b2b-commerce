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
import { Building2, Mail, Phone, MapPin, Check, X, Clock } from 'lucide-react';
import { Pagination } from '@/src/components/ui/pagination';

export function WholesellerRequestsPage() {
  const [data, setData] = React.useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const token = getAuthToken();

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming endpoint for wholesaler requests/users
      const res = await apiFetch<any>(`/admin/wholesellers?page=${page}&per_page=10`, { token: token || undefined });
      
      let items: AuthUser[] = [];
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

      setData(items);
      setTotalItems(total);
      setTotalPages(lastPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load wholesaler requests');
      // Set some dummy data if API fails to show design
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (id: number, action: 'approve' | 'disapprove') => {
    setIsActionLoading(id);
    try {
      await apiFetch(`/admin/wholesellers/${id}/${action}`, {
        method: 'POST',
        token: token || undefined,
      });
      toast.success(`Wholeseller ${action === 'approve' ? 'approved' : 'disapproved'} successfully`);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} wholeseller`);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="Wholesaler Management" 
        description="Review and manage applications for wholesaler accounts."
      />

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
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
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-5 px-6 text-right font-black"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-20">
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <Building2 className="size-10 stroke-1" />
                      <p className="font-medium italic">No wholesaler requests found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-black/90">{item.company_name || item.name}</p>
                          <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
                            <Mail className="size-3" /> {item.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-black/80">{item.name}</p>
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                          <Phone className="size-3" /> {item.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-start gap-1 text-zinc-500 text-sm max-w-[200px]">
                        <MapPin className="size-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 leading-tight">{item.address || 'No address provided'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
                        item.role === 'wholesaler' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {item.role === 'wholesaler' ? 'Active Wholesaler' : 'Pending Request'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {item.role !== 'wholesaler' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:text-green-700 font-bold text-xs h-9"
                            onClick={() => handleAction(item.id, 'approve')}
                            disabled={isActionLoading === item.id}
                          >
                            {isActionLoading === item.id ? <Spinner size="xs" /> : <Check className="size-3.5 mr-1" />}
                            Approve
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:text-red-700 font-bold text-xs h-9"
                            onClick={() => handleAction(item.id, 'disapprove')}
                            disabled={isActionLoading === item.id}
                          >
                            {isActionLoading === item.id ? <Spinner size="xs" /> : <X className="size-3.5 mr-1" />}
                            Disapprove
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
    </div>
  );
}
