'use client';

import * as React from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface BatchAction<T> {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: (items: T[]) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  batchActions?: BatchAction<T>[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search...',
  batchActions = [],
  onRowClick,
  pageSize = 10,
  isLoading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sorting, setSorting] = React.useState<{ key: keyof T | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);

  // Sorting logic
  const handleSort = (key: keyof T) => {
    setSorting((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtering logic
  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchTerm && searchKey) {
      result = result.filter((item) => {
        const value = item[searchKey];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (sorting.key && sorting.direction) {
      result.sort((a, b) => {
        const aVal = a[sorting.key!];
        const bVal = b[sorting.key!];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sorting.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, searchKey, sorting]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, sorting, data]);

  // Selection logic
  const toggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((item) => item.id)));
    }
  };

  const selectedItems = data.filter((item) => selectedIds.has(item.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl bg-muted/30 border-none h-11"
          />
        </div>

        {selectedIds.size > 0 && batchActions.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Badge variant="secondary" className="h-10 px-4 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20">
              {selectedIds.size} Selected
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-full font-bold px-6 shadow-sm">
                  Batch Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border/50 p-2">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-40 px-3 py-2">Execute for {selectedIds.size} items</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {batchActions.map((action) => (
                  <DropdownMenuItem
                    key={action.value}
                    onClick={() => action.onClick(selectedItems)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 font-bold cursor-pointer transition-colors",
                      action.variant === 'destructive' ? "text-destructive focus:text-destructive focus:bg-destructive/10" : ""
                    )}
                  >
                    {action.icon && <span className="mr-2 opacity-70">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/10 border-border/50">
              <TableHead className="w-[50px] px-6">
                <Checkbox
                  checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                  className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest py-5 px-4 text-muted-foreground",
                    column.className
                  )}
                >
                  {column.sortable && column.accessorKey ? (
                    <button
                      onClick={() => handleSort(column.accessorKey!)}
                      className="flex items-center hover:text-primary transition-colors group"
                    >
                      {column.header}
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sorting.key === column.accessorKey ? (
                          sorting.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell className="px-6"><div className="h-5 w-5 bg-muted/50 rounded animate-pulse" /></TableCell>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-4 py-6"><div className="h-10 bg-muted/50 rounded-xl animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <Filter className="h-12 w-12 opacity-10" />
                    <p className="font-serif italic font-bold text-xl">No results found matching your query</p>
                    <Button variant="link" onClick={() => setSearchTerm('')} className="text-primary font-bold">Clear filters</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    "group transition-all border-border/50",
                    onRowClick ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/10",
                    selectedIds.has(item.id) ? "bg-primary/3" : ""
                  )}
                >
                  <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`Select row ${item.id}`}
                      className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                  {columns.map((column, index) => (
                    <TableCell key={index} className={cn("px-4 py-5", column.className)}>
                      {column.cell
                        ? column.cell(item)
                        : column.accessorKey
                        ? (item[column.accessorKey] as React.ReactNode)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {filteredData.length > 0 ? (
            <>Showing <span className="text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="text-foreground">{filteredData.length}</span> results</>
          ) : (
            <>0 results</>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            className="rounded-full h-10 px-4 font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <div className="font-black text-[10px] uppercase tracking-[0.2em] opacity-40">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            className="rounded-full h-10 px-4 font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
