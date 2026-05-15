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
import { Search, Users } from 'lucide-react';
import type { Client, PaymentStatus, NewspaperType, ShopSettings } from '@/lib/types';
import { NEWSPAPER_LABELS } from '@/lib/types';
import { useState, useMemo } from 'react';

interface ClientListProps {
  clients: Client[];
  onToggleStatus: (id: string) => void;
  onEdit: (client: Client) => void;
  shopSettings: ShopSettings | null;
}

export function ClientList({ clients, onToggleStatus, onEdit, shopSettings }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [newspaperFilter, setNewspaperFilter] = useState<NewspaperType | 'all'>('all');

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phoneNumber.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all' || client.status === statusFilter;

      const matchesNewspaper =
        newspaperFilter === 'all' ||
        client.newspapers.some((np) => np.newspaper === newspaperFilter);

      return matchesSearch && matchesStatus && matchesNewspaper;
    });
  }, [clients, searchQuery, statusFilter, newspaperFilter]);

  const unpaidCount = clients.filter((c) => c.status === 'unpaid').length;
  const paidCount = clients.filter((c) => c.status === 'paid').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-foreground">{clients.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary">{paidCount}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </div>
        <div className="rounded-xl bg-destructive/10 p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-destructive">{unpaidCount}</p>
          <p className="text-xs text-muted-foreground">Unpaid</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={newspaperFilter}
          onValueChange={(value) =>
            setNewspaperFilter(value as NewspaperType | 'all')
          }
        >
          <SelectTrigger className="h-10 w-full">
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

      {/* Client Cards */}
      <div className="flex flex-col gap-3">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-8 text-center shadow-sm">
            <Users className="size-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No clients found</p>
              <p className="text-sm text-muted-foreground/70">
                {clients.length === 0
                  ? 'Add your first client above'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              shopSettings={shopSettings}
            />
          ))
        )}
      </div>
    </div>
  );
}