'use client';

import * as React from 'react';
import { DataTable } from '@/src/components/tables/data-table';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' },
  { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'Editor', status: 'Active' },
  { id: 4, name: 'Bob Wilson', email: 'bob@example.com', role: 'User', status: 'Active' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'Pending' },
];

const columns = [
  { header: 'Name', accessorKey: 'name' as const },
  { header: 'Email', accessorKey: 'email' as const },
  { 
    header: 'Role', 
    accessorKey: 'role' as const,
    cell: (row: any) => (
      <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold">
        {row.role}
      </Badge>
    ) 
  },
  { 
    header: 'Status', 
    accessorKey: 'status' as const,
    cell: (row: any) => {
      const variants: any = {
        Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none',
        Inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-none',
      };
      return (
        <Badge className={variants[row.status] || ''}>
          {row.status}
        </Badge>
      );
    }
  },
];

export function UserTable() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Oversee your team members and their access levels."
      >
        <Button className="gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
          <UserPlus className="size-5" />
          Add New User
        </Button>
      </PageHeader>
      
      <DataTable 
        data={users} 
        columns={columns} 
        searchKey="name" 
      />
    </div>
  );
}
