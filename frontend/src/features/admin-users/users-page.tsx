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
import { MoreHorizontal, User, Mail, Calendar } from 'lucide-react';
import { Pagination } from '@/src/components/ui/pagination';

export function UsersPage() {
  const [users, setUsers] = React.useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const token = getAuthToken();

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>(`/admin/users?page=${page}&per_page=10`, { token: token || undefined });
      
      let data: AuthUser[] = [];
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

      setUsers(data);
      setTotalItems(total);
      setTotalPages(lastPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="User Management" 
        description="View and manage all registered users and their roles."
      />

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
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
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-20 text-zinc-500 font-medium italic">
                    No users found in the system.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6]">
                          <User className="size-5" />
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
                        user.role === 'wholeseller' ? "bg-[#966FD6]/10 text-[#966FD6]" : 
                        "bg-blue-50 text-blue-600"
                      )}>
                        {user.role || 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <Calendar className="size-3.5" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5 transition-all">
                        <MoreHorizontal className="size-5" />
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
    </div>
  );
}

