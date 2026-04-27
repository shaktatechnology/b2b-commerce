'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    cell?: (row: T) => React.ReactNode;
  }[];
  searchKey?: keyof T;
}

export function DataTable<T>({ data, columns, searchKey }: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;
  
  const filteredData = React.useMemo(() => {
    let result = data;
    if (searchTerm && searchKey) {
      result = data.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 h-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
          <Button size="sm" className="h-10 rounded-xl">
            Export
          </Button>
        </div>
      </div>
      
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.header as string} className="font-bold py-4">
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow key={index} className="group transition-colors hover:bg-muted/30">
                  {columns.map((column) => (
                    <TableCell key={column.header as string} className="py-4">
                      {column.cell ? (
                        column.cell(row)
                      ) : (
                        <span className="font-medium">{String(row[column.accessorKey])}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4 border-t bg-card/50 rounded-b-2xl">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">
            {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)}-
            {Math.min(filteredData.length, currentPage * pageSize)}
          </span> of{' '}
          <span className="font-semibold text-foreground">{filteredData.length}</span> results
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-lg" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            {currentPage}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

