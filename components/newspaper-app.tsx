'use client';

import { useState, useEffect } from 'react';
import { AddClientForm } from '@/components/add-client-form';
import { ClientList } from '@/components/client-list';
import { ShopSettingsForm, loadShopSettings } from '@/components/shop-settings-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Newspaper, UserPlus, Users, FileSpreadsheet, Settings } from 'lucide-react';
import type { Client, ShopSettings } from '@/lib/types';
import { NEWSPAPER_LABELS } from '@/lib/types';
import * as XLSX from 'xlsx';

export function NewspaperApp() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    setShopSettings(loadShopSettings());
  }, []);

  const handleAddClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setClients((prev) => [newClient, ...prev]);
    setActiveTab('clients');
  };

  const handleUpdateClient = (id: string, clientData: Omit<Client, 'id' | 'createdAt'>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...clientData, id, createdAt: client.createdAt } : client
      )
    );
    setEditingClient(null);
    setActiveTab('clients');
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const handleToggleStatus = (id: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id
          ? { ...client, status: client.status === 'paid' ? 'unpaid' : 'paid' }
          : client
      )
    );
  };

  const handleExportExcel = () => {
    if (clients.length === 0) return;
    const excelData = clients.map((client) => {
      const thanthiCost =
        client.newspapers.find((np) => np.newspaper === 'thanthi')?.monthlyAmount || 0;
      const hinduCost =
        client.newspapers.find((np) => np.newspaper === 'the-hindu')?.monthlyAmount || 0;
      const toiCost =
        client.newspapers.find((np) => np.newspaper === 'times-of-india')?.monthlyAmount || 0;
      const dhinamalarCost =
        client.newspapers.find((np) => np.newspaper === 'dhinamalar')?.monthlyAmount || 0;
      return {
        Name: client.name,
        'Phone Number': client.phoneNumber,
        Address: client.address,
        Status: client.status === 'paid' ? 'Paid' : 'Unpaid',
        'Daily Thanthi (₹)': thanthiCost || '',
        'The Hindu (₹)': hinduCost || '',
        'Times of India (₹)': toiCost || '',
        'Dhinamalar (₹)': dhinamalarCost || '',
        'Petrol Charges (₹)': client.petrolCharges || '',
        'Total Amount (₹)': client.totalAmount,
        'Created At':
          client.createdAt instanceof Date
            ? client.createdAt.toLocaleDateString('en-IN')
            : new Date(client.createdAt).toLocaleDateString('en-IN'),
      };
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 10 },
      { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Chandran_News_Mart_Clients_${date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Newspaper className="size-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">
              {shopSettings?.shopName || 'Chandran News Mart'}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={clients.length === 0}
            className="h-9 gap-2"
          >
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsContent value="clients" className="mt-0">
            <ClientList
              clients={clients}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditClient}
              shopSettings={shopSettings}
            />
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <AddClientForm
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              editingClient={editingClient}
              onCancelEdit={handleCancelEdit}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="py-2">
              <h2 className="mb-4 text-lg font-semibold">Shop &amp; Payment Settings</h2>
              <ShopSettingsForm onSettingsChange={setShopSettings} />
            </div>
          </TabsContent>

          {/* Bottom Navigation — 3 tabs now */}
          <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <TabsList className="grid h-16 w-full grid-cols-3 gap-0 rounded-none border-0 bg-transparent p-0">
              <TabsTrigger
                value="clients"
                className="flex h-full flex-col items-center justify-center gap-1 rounded-none border-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Users className="size-5" />
                <span className="text-xs font-medium">Clients</span>
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="flex h-full flex-col items-center justify-center gap-1 rounded-none border-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                onClick={() => {
                  if (activeTab === 'add' && !editingClient) return;
                  setEditingClient(null);
                }}
              >
                <UserPlus className="size-5" />
                <span className="text-xs font-medium">
                  {editingClient ? 'Edit Client' : 'Add Client'}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex h-full flex-col items-center justify-center gap-1 rounded-none border-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Settings className="size-5" />
                <span className="text-xs font-medium">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>
    </div>
  );
}