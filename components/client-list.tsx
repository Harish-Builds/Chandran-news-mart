'use client';

import { ClientCard } from '@/components/client-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Users, AlertTriangle } from 'lucide-react';
import type { Client, PaymentStatus, NewspaperType, ShopSettings } from '@/lib/types';
import { NEWSPAPER_LABELS } from '@/lib/types';
import { useState, useMemo } from 'react';

interface ClientListProps {
  clients: Client[];
  onToggleStatus: (id: string) => void;
  onEdit: (client: Client) => void;
  shopSettings: ShopSettings | null;
}

/** Returns how many days overdue an unpaid client is (negative = not yet overdue) */
function getOverdueDays(client: Client): number {
  if (client.status !== 'unpaid' || !client.startDate) return -1;
  const start = new Date(client.startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Overdue after 30 days
  return diffDays - 30;
}

export function ClientList({ clients, onToggleStatus, onEdit, shopSettings }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all' | 'overdue'>('all');
  const [newspaperFilter, setNewspaperFilter] = useState<NewspaperType | 'all'>('all');

  // Compute overdue days for all clients
  const clientsWithOverdue = useMemo(() => {
    return clients.map((client) => ({
      client,
      overdueDays: getOverdueDays(client),
    }));
  }, [clients]);

  const filteredAndSorted = useMemo(() => {
    let list = clientsWithOverdue.filter(({ client }) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phoneNumber.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'overdue'
            ? client.status === 'unpaid'
            : client.status === statusFilter;

      // Extra filter for overdue: only those actually overdue
      const matchesOverdue =
        statusFilter !== 'overdue' ||
        clientsWithOverdue.find((c) => c.client.id === client.id)!.overdueDays > 0;

      const matchesNewspaper =
        newspaperFilter === 'all' ||
        client.newspapers.some((np) => np.newspaper === newspaperFilter);

      return matchesSearch && matchesStatus && matchesOverdue && matchesNewspaper;
    });

    // Sort: overdue unpaid clients first (highest overdueDays first), then rest
    list = [...list].sort((a, b) => {
      const aOverdue = a.overdueDays > 0 ? a.overdueDays : -1;
      const bOverdue = b.overdueDays > 0 ? b.overdueDays : -1;
      if (aOverdue > 0 && bOverdue > 0) return bOverdue - aOverdue; // most overdue first
      if (aOverdue > 0) return -1; // a is overdue, goes first
      if (bOverdue > 0) return 1;  // b is overdue, goes first
      return 0;
    });

    return list;
  }, [clientsWithOverdue, searchQuery, statusFilter, newspaperFilter]);

  const activeClients = clients.filter((c) => c.status !== 'inactive');
  const unpaidCount = clients.filter((c) => c.status === 'unpaid').length;
  const paidCount = clients.filter((c) => c.status === 'paid').length;
  const overdueCount = clientsWithOverdue.filter(({ client, overdueDays }) =>
    client.status === 'unpaid' && overdueDays > 0
  ).length;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-card p-2.5 text-center shadow-sm">
          <p className="text-xl font-bold text-foreground">{clients.length}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-center shadow-sm">
          <p className="text-xl font-bold text-primary">{paidCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Paid</p>
        </div>
        <div className="rounded-xl bg-destructive/10 p-2.5 text-center shadow-sm">
          <p className="text-xl font-bold text-destructive">{unpaidCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Unpaid</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-2.5 text-center shadow-sm">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{overdueCount}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Overdue</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && statusFilter !== 'overdue' && (
        <button
          onClick={() => setStatusFilter('overdue')}
          className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-left w-full hover:bg-destructive/15 transition-colors"
        >
          <AlertTriangle className="size-4 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive leading-tight">
              {overdueCount} client{overdueCount !== 1 ? 's' : ''} overdue
            </p>
            <p className="text-xs text-destructive/70">Tap to filter overdue clients</p>
          </div>
        </button>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, or address…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10 text-base"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2.5">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all' | 'overdue')}
        >
          <SelectTrigger className="h-10 w-full text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue Only</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={newspaperFilter}
          onValueChange={(value) => setNewspaperFilter(value as NewspaperType | 'all')}
        >
          <SelectTrigger className="h-10 w-full text-sm">
            <SelectValue placeholder="Newspaper" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Papers</SelectItem>
            {(Object.keys(NEWSPAPER_LABELS) as NewspaperType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {NEWSPAPER_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort label */}
      {filteredAndSorted.some(({ overdueDays }) => overdueDays > 0) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="size-3 text-destructive" />
          Overdue clients shown first, sorted by most days overdue
        </p>
      )}

      {/* Client Cards */}
      <div className="flex flex-col gap-2.5">
        {filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-8 text-center shadow-sm">
            <Users className="size-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground text-sm">No clients found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {clients.length === 0
                  ? 'Add your first client above'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          filteredAndSorted.map(({ client, overdueDays }) => (
            <ClientCard
              key={client.id}
              client={client}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              shopSettings={shopSettings}
              overdueDays={overdueDays > 0 ? overdueDays : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}