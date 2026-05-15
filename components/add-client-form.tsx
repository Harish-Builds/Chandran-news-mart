'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, IndianRupee, Fuel, Pencil } from 'lucide-react';
import type { Client, NewspaperType, PaymentStatus, NewspaperCost } from '@/lib/types';
import { NEWSPAPER_LABELS, calculateTotalAmount } from '@/lib/types';

interface AddClientFormProps {
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient?: (id: string, client: Omit<Client, 'id' | 'createdAt'>) => void;
  editingClient?: Client | null;
  onCancelEdit?: () => void;
}

const ALL_NEWSPAPERS: NewspaperType[] = ['thanthi', 'the-hindu', 'times-of-india', 'dhinamalar'];

export function AddClientForm({ 
  onAddClient, 
  onUpdateClient, 
  editingClient, 
  onCancelEdit 
}: AddClientFormProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('unpaid');
  
  // Track selected newspapers and their individual costs
  const [selectedNewspapers, setSelectedNewspapers] = useState<Set<NewspaperType>>(new Set());
  const [newspaperCosts, setNewspaperCosts] = useState<Record<NewspaperType, string>>({
    'thanthi': '',
    'the-hindu': '',
    'times-of-india': '',
    'dhinamalar': '',
  });
  const [petrolCharges, setPetrolCharges] = useState('');

  const isEditing = !!editingClient;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setPhoneNumber(editingClient.phoneNumber);
      setAddress(editingClient.address);
      setStatus(editingClient.status);
      setPetrolCharges(editingClient.petrolCharges > 0 ? editingClient.petrolCharges.toString() : '');
      
      const selectedSet = new Set<NewspaperType>(editingClient.newspapers.map((np) => np.newspaper));
      setSelectedNewspapers(selectedSet);
      
      const costs: Record<NewspaperType, string> = {
        'thanthi': '',
        'the-hindu': '',
        'times-of-india': '',
        'dhinamalar': '',
      };
      editingClient.newspapers.forEach((np) => {
        costs[np.newspaper] = np.monthlyAmount > 0 ? np.monthlyAmount.toString() : '';
      });
      setNewspaperCosts(costs);
    }
  }, [editingClient]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    const newspapers: NewspaperCost[] = Array.from(selectedNewspapers).map((np) => ({
      newspaper: np,
      monthlyAmount: parseFloat(newspaperCosts[np]) || 0,
    }));
    const petrol = parseFloat(petrolCharges) || 0;
    return calculateTotalAmount(newspapers, petrol);
  }, [selectedNewspapers, newspaperCosts, petrolCharges]);

  const handleNewspaperToggle = (newspaper: NewspaperType, checked: boolean) => {
    const newSelected = new Set(selectedNewspapers);
    if (checked) {
      newSelected.add(newspaper);
    } else {
      newSelected.delete(newspaper);
      // Clear the cost when unselected
      setNewspaperCosts((prev) => ({ ...prev, [newspaper]: '' }));
    }
    setSelectedNewspapers(newSelected);
  };

  const handleCostChange = (newspaper: NewspaperType, value: string) => {
    setNewspaperCosts((prev) => ({ ...prev, [newspaper]: value }));
  };

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setAddress('');
    setStatus('unpaid');
    setSelectedNewspapers(new Set());
    setNewspaperCosts({
      'thanthi': '',
      'the-hindu': '',
      'times-of-india': '',
      'dhinamalar': '',
    });
    setPetrolCharges('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phoneNumber || !address || selectedNewspapers.size === 0) {
      return;
    }

    const newspapers: NewspaperCost[] = Array.from(selectedNewspapers).map((np) => ({
      newspaper: np,
      monthlyAmount: parseFloat(newspaperCosts[np]) || 0,
    }));

    const petrol = parseFloat(petrolCharges) || 0;

    const clientData = {
      name,
      phoneNumber,
      address,
      status,
      newspapers,
      petrolCharges: petrol,
      totalAmount: calculateTotalAmount(newspapers, petrol),
    };

    if (isEditing && onUpdateClient) {
      onUpdateClient(editingClient.id, clientData);
    } else {
      onAddClient(clientData);
    }

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit?.();
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isEditing ? (
            <>
              <Pencil className="size-5 text-primary" />
              Edit Client
            </>
          ) : (
            <>
              <UserPlus className="size-5 text-primary" />
              Add New Client
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Client Name
            </Label>
            <Input
              id="name"
              placeholder="Enter client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="address"
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="h-11"
            />
          </div>

          {/* Newspaper Selection with Individual Costs */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              Newspapers & Monthly Costs (per rupees)
            </Label>
            <div className="flex flex-col gap-3 rounded-lg border bg-secondary/30 p-3">
              {ALL_NEWSPAPERS.map((newspaper) => (
                <div key={newspaper} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={newspaper}
                      checked={selectedNewspapers.has(newspaper)}
                      onCheckedChange={(checked) =>
                        handleNewspaperToggle(newspaper, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={newspaper}
                      className="flex-1 cursor-pointer text-sm font-medium"
                    >
                      {NEWSPAPER_LABELS[newspaper]}
                    </Label>
                  </div>
                  {selectedNewspapers.has(newspaper) && (
                    <div className="ml-7 flex items-center gap-2">
                      <IndianRupee className="size-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Monthly cost"
                        value={newspaperCosts[newspaper]}
                        onChange={(e) => handleCostChange(newspaper, e.target.value)}
                        className="h-9 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Petrol Charges */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="petrol" className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <Fuel className="size-4" />
                Petrol Charges (Monthly)
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <IndianRupee className="size-4 text-muted-foreground" />
              <Input
                id="petrol"
                type="number"
                min="0"
                step="1"
                placeholder="Enter petrol charges"
                value={petrolCharges}
                onChange={(e) => setPetrolCharges(e.target.value)}
                className="h-11 flex-1"
              />
            </div>
          </div>

          {/* Total Amount Display */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total Monthly Amount
              </span>
              <span className="text-2xl font-bold text-primary">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            {selectedNewspapers.size > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {Array.from(selectedNewspapers).map((np) => (
                  <span key={np} className="mr-2">
                    {NEWSPAPER_LABELS[np]}: ₹{newspaperCosts[np] || 0}
                  </span>
                ))}
                {parseFloat(petrolCharges) > 0 && (
                  <span>+ Petrol: ₹{petrolCharges}</span>
                )}
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="paid-status"
              checked={status === 'paid'}
              onCheckedChange={(checked) => setStatus(checked ? 'paid' : 'unpaid')}
            />
            <Label htmlFor="paid-status" className="cursor-pointer text-sm font-medium">
              Mark as Paid
            </Label>
          </div>

          <div className="mt-2 flex gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 text-base font-semibold"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="h-12 flex-1 text-base font-semibold"
              disabled={selectedNewspapers.size === 0}
            >
              {isEditing ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
