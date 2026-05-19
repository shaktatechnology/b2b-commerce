'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { AuthUser } from '@/src/types';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
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
import { MoreHorizontal, Shield, User, Mail, Calendar } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = React.useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const token = getAuthToken();

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>('/admin/users', { token: token || undefined });
      setUsers(res.data ? res.data : res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

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
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Spinner size="lg" className="border-[#966FD6]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-20 text-zinc-500 font-medium">
            No users found in the system.
          </div>
        ) : (
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
              {users.map((user) => (
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

