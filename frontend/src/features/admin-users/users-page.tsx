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
import { 
  User, 
  Mail, 
  Calendar, 
  Search, 
  Filter, 
  RotateCcw, 
  Eye, 
  Trash2, 
  History,
  ShoppingBag,
  Building2
} from 'lucide-react';
import { Pagination } from '@/src/components/ui/pagination';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useDebounce } from '@/src/hooks/use-debounce';
import { ConfirmDialog } from '@/src/components/modals/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

export function UsersPage() {
  const [users, setUsers] = React.useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  
  // Filters
  const [role, setRole] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [selectedUser, setSelectedUser] = React.useState<AuthUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [history, setHistory] = React.useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const token = getAuthToken();
  const perPage = 10;

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (role !== 'all') queryParams.append('role', role);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const res = await apiFetch<any>(`/admin/users?${queryParams.toString()}`, { token: token || undefined });
      
      const items = Array.isArray(res.data) ? res.data : [];
      setUsers(items);
      setTotalItems(items.length);
      setTotalPages(Math.ceil(items.length / perPage) || 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [token, role, debouncedSearch]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsDeleting(selectedUser.id);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        token: token || undefined
      });
      toast.success('User deleted successfully');
      loadUsers();
      setIsConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  const loadHistory = async (userId: string) => {
    setIsHistoryLoading(true);
    setHistory([]);
    try {
      const res = await apiFetch<any>(`/admin/users/${userId}/history`, { token: token || undefined });
      setHistory(Array.isArray(res.data) ? res.data : []);
      setIsHistoryOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load purchase history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const paginatedUsers = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return users.slice(start, start + perPage);
  }, [users, page]);

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="User Management" 
        description="View and manage all registered users, their roles, and purchase history."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search by name, email or company..." 
            className="pl-10 h-11 bg-zinc-50 border-zinc-100 focus:bg-white transition-all rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-11 bg-zinc-50 border-zinc-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-zinc-400" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="wholesaler">Wholesaler</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-11 px-4 border-zinc-200 text-zinc-500 hover:text-black rounded-xl w-full flex items-center gap-2"
            onClick={() => {
              setSearch('');
              setRole('all');
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
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">User</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Role</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Joined Date</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6 italic font-bold text-zinc-300">#</TableCell>
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
                      <Skeleton className="h-6 w-20 rounded-full" />
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
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-20 text-zinc-500 font-medium italic">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <TableRow key={user.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6 font-bold text-zinc-400 text-sm">
                      {(page - 1) * perPage + index + 1}.
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                          {user.role === 'wholesaler' ? <Building2 className="size-5" /> : <User className="size-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-black/90">{user.name}</p>
                          <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
                            <Mail className="size-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-none",
                        user.role === 'admin' ? "bg-red-50 text-red-600" : 
                        user.role === 'wholesaler' ? "bg-[#966FD6]/10 text-[#966FD6]" : 
                        "bg-blue-50 text-blue-600"
                      )}>
                        {user.role || 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <Calendar className="size-3.5" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5 transition-all"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDetailsOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="size-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          onClick={() => loadHistory(user.id)}
                          title="Purchase History"
                        >
                          {isHistoryLoading && selectedUser?.id === user.id ? <Spinner size="sm" /> : <History className="size-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsConfirmOpen(true);
                          }}
                          title="Delete User"
                        >
                          <Trash2 className="size-5" />
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
        <DialogContent className="max-w-xl font-lato">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-black tracking-tight">User Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the registered user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-6 pb-6 border-b border-zinc-100">
                <div className="h-20 w-20 rounded-3xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                  <User className="size-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">{selectedUser.name}</h3>
                  <p className="text-zinc-500 font-medium">{selectedUser.email}</p>
                  <Badge className="mt-2 bg-zinc-100 text-zinc-600 border-none shadow-none uppercase text-[10px] font-black">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Company</h4>
                  <p className="font-bold text-black/90">{selectedUser.company_name || 'Individual'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Phone</h4>
                  <p className="font-bold text-black/90">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Address</h4>
                  <p className="font-bold text-black/90">{selectedUser.address || 'No address on file'}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 flex justify-end">
                <Button 
                  className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white font-black px-8 rounded-xl"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl font-lato max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-black tracking-tight">Purchase History</DialogTitle>
            <DialogDescription>
              Complete list of orders placed by this user.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <ShoppingBag className="size-12 mb-4 opacity-20" />
                <p className="font-medium italic">No purchase history found for this user.</p>
              </div>
            ) : (
              <div className="border border-zinc-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                      <TableHead className="w-[60px] text-[10px] font-black uppercase tracking-widest text-zinc-500 py-3 pl-4">S.N.</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-3">Order info</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-3">Items</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-3">Total</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-3 text-right pr-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((order, idx) => (
                      <TableRow key={order.id} className="hover:bg-zinc-50/30 transition-colors">
                        <TableCell className="text-xs font-bold text-zinc-400 pl-4">{idx + 1}.</TableCell>
                        <TableCell>
                          <p className="text-xs font-black text-[#966FD6] uppercase tracking-wider">#{order.order_number}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-zinc-700 line-clamp-1 max-w-[150px]">
                            {order.items?.[0]?.variant?.product?.name || 'Unnamed Product'}
                            {order.items?.length > 1 && ` + ${order.items.length - 1} more`}
                          </p>
                          <p className="text-[10px] text-zinc-500">{order.items?.length || 0} items</p>
                        </TableCell>
                        <TableCell className="text-xs font-black text-zinc-900">Rs. {order.total}</TableCell>
                        <TableCell className="text-right pr-4">
                          <Badge className={cn(
                            "rounded-full border-none shadow-none text-[9px] uppercase font-black px-2 py-0.5",
                            order.status === 'completed' ? "bg-green-50 text-green-600" :
                            order.status === 'cancelled' ? "bg-red-50 text-red-600" :
                            "bg-blue-50 text-blue-600"
                          )}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete user "${selectedUser?.name}"? This action cannot be undone and will remove all associated records.`}
        variant="destructive"
        isLoading={isDeleting !== null}
        confirmLabel="Force Delete"
      />
    </div>
  );
}

