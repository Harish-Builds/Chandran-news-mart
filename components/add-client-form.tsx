'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserPlus,
  IndianRupee,
  Fuel,
  Pencil,
  Trash2,
  UserX,
} from 'lucide-react';
import type { Client, NewspaperType, PaymentStatus, NewspaperCost } from '@/lib/types';
import { NEWSPAPER_LABELS, calculateTotalAmount } from '@/lib/types';

interface AddClientFormProps {
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient?: (id: string, client: Omit<Client, 'id' | 'createdAt'>) => void;
  onDeleteClient?: (id: string) => void;
  onInactiveClient?: (id: string) => void;
  editingClient?: Client | null;
  onCancelEdit?: () => void;
}

const ALL_NEWSPAPERS: NewspaperType[] = ['thanthi', 'the-hindu', 'times-of-india', 'dhinamalar'];

export function AddClientForm({
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onInactiveClient,
  editingClient,
  onCancelEdit,
}: AddClientFormProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('unpaid');

  const [selectedNewspapers, setSelectedNewspapers] = useState<Set<NewspaperType>>(new Set());
  const [newspaperCosts, setNewspaperCosts] = useState<Record<NewspaperType, string>>({
    'thanthi': '',
    'the-hindu': '',
    'times-of-india': '',
    'dhinamalar': '',
  });
  const [petrolCharges, setPetrolCharges] = useState('');
  const [prepaidAmount, setPrepaidAmount] = useState('');
  const [startDate, setStartDate] = useState('');

  // Delete confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  const [showInactiveDialog, setShowInactiveDialog] = useState(false);

  const isEditing = !!editingClient;

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setPhoneNumber(editingClient.phoneNumber);
      setAddress(editingClient.address);
      setStatus(editingClient.status);
      setPetrolCharges(editingClient.petrolCharges > 0 ? editingClient.petrolCharges.toString() : '');
      setPrepaidAmount(editingClient.prepaidAmount && editingClient.prepaidAmount > 0 ? editingClient.prepaidAmount.toString() : '');
      setStartDate(editingClient.startDate || '');

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
    setPrepaidAmount('');
    setStartDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phoneNumber || !address || selectedNewspapers.size === 0) return;

    const newspapers: NewspaperCost[] = Array.from(selectedNewspapers).map((np) => ({
      newspaper: np,
      monthlyAmount: parseFloat(newspaperCosts[np]) || 0,
    }));

    const petrol = parseFloat(petrolCharges) || 0;
    const prepaid = parseFloat(prepaidAmount) || 0;

    const clientData = {
      name,
      phoneNumber,
      address,
      status,
      newspapers,
      petrolCharges: petrol,
      totalAmount: calculateTotalAmount(newspapers, petrol),
      prepaidAmount: prepaid,
      startDate: startDate || undefined,
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

  const handleDeleteConfirm1 = () => {
    setShowDeleteDialog(false);
    setShowDeleteConfirm2(true);
  };

  const handleDeleteFinal = () => {
    setShowDeleteConfirm2(false);
    if (editingClient && onDeleteClient) {
      onDeleteClient(editingClient.id);
    }
  };

  const handleInactiveConfirm = () => {
    setShowInactiveDialog(false);
    if (editingClient && onInactiveClient) {
      onInactiveClient(editingClient.id);
    }
  };

  const netBalance = totalAmount - (parseFloat(prepaidAmount) || 0);

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            {isEditing ? (
              <>
                <Pencil className="size-4 text-primary" />
                Edit Client
              </>
            ) : (
              <>
                <UserPlus className="size-4 text-primary" />
                Add New Client
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Client Name</Label>
              <Input
                id="name"
                placeholder="Enter client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Used to track overdue payments (1 month cycle)
              </p>
            </div>

            {/* Newspapers */}
            <div className="flex flex-col gap-2.5">
              <Label className="text-sm font-medium">Newspapers &amp; Monthly Costs</Label>
              <div className="flex flex-col gap-2.5 rounded-lg border bg-secondary/30 p-3">
                {ALL_NEWSPAPERS.map((newspaper) => (
                  <div key={newspaper} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={newspaper}
                        checked={selectedNewspapers.has(newspaper)}
                        onCheckedChange={(checked) =>
                          handleNewspaperToggle(newspaper, checked as boolean)
                        }
                      />
                      <Label htmlFor={newspaper} className="flex-1 cursor-pointer text-sm font-medium">
                        {NEWSPAPER_LABELS[newspaper]}
                      </Label>
                    </div>
                    {selectedNewspapers.has(newspaper) && (
                      <div className="ml-7 flex items-center gap-2">
                        <IndianRupee className="size-4 text-muted-foreground shrink-0" />
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Monthly cost"
                          value={newspaperCosts[newspaper]}
                          onChange={(e) => handleCostChange(newspaper, e.target.value)}
                          className="h-9 flex-1 text-sm"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">/month</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Petrol Charges */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="petrol" className="text-sm font-medium flex items-center gap-2">
                <Fuel className="size-4" />
                Petrol Charges (Monthly)
              </Label>
              <div className="flex items-center gap-2">
                <IndianRupee className="size-4 text-muted-foreground shrink-0" />
                <Input
                  id="petrol"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter petrol charges"
                  value={petrolCharges}
                  onChange={(e) => setPetrolCharges(e.target.value)}
                  className="h-11 flex-1 text-base"
                />
              </div>
            </div>

            {/* Prepaid Amount */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prepaid" className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="size-4" />
                Prepaid Amount
              </Label>
              <div className="flex items-center gap-2">
                <IndianRupee className="size-4 text-muted-foreground shrink-0" />
                <Input
                  id="prepaid"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Amount paid in advance"
                  value={prepaidAmount}
                  onChange={(e) => setPrepaidAmount(e.target.value)}
                  className="h-11 flex-1 text-base"
                />
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-muted-foreground">Total Monthly</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              {(parseFloat(prepaidAmount) || 0) > 0 && (
                <div className="flex items-center justify-between border-t pt-1.5 mt-1.5">
                  <span className="text-xs text-muted-foreground">Net Balance Due</span>
                  <span className={`text-base font-semibold ${netBalance <= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {netBalance <= 0 ? `₹0 (Prepaid ₹${Math.abs(netBalance)})` : `₹${netBalance.toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}
              {selectedNewspapers.size > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                  {Array.from(selectedNewspapers).map((np) => (
                    <span key={np} className="text-xs text-muted-foreground">
                      {NEWSPAPER_LABELS[np]}: ₹{newspaperCosts[np] || 0}
                    </span>
                  ))}
                  {parseFloat(petrolCharges) > 0 && (
                    <span className="text-xs text-muted-foreground">+ Petrol: ₹{petrolCharges}</span>
                  )}
                </div>
              )}
            </div>

            {/* Payment Status */}
            {/* <div className="flex items-center gap-3">
              <Checkbox
                id="paid-status"
                checked={status === 'paid'}
                onCheckedChange={(checked) => setStatus(checked ? 'paid' : 'unpaid')}
              />
              <Label htmlFor="paid-status" className="cursor-pointer text-sm font-medium">
                Mark as Paid
              </Label>
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-1">
              {/* Primary actions */}
              <div className="flex gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 text-sm font-semibold"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="h-11 flex-1 text-sm font-semibold"
                  disabled={selectedNewspapers.size === 0}
                >
                  {isEditing ? 'Update Client' : 'Add Client'}
                </Button>
              </div>

              {/* Edit-only: Inactive & Delete */}
              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1 text-xs font-semibold border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 gap-1.5"
                    onClick={() => setShowInactiveDialog(true)}
                  >
                    <UserX className="size-3.5" />
                    Mark Inactive
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1 text-xs font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete Client
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Inactive Confirmation Dialog */}
      <AlertDialog open={showInactiveDialog} onOpenChange={setShowInactiveDialog}>
        <AlertDialogContent className="max-w-[92vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <UserX className="size-5" />
              Mark as Inactive?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{editingClient?.name}</strong> will be marked as inactive and hidden from the active clients list. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInactiveConfirm}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Mark Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog — Step 1 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[92vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Delete Client?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{editingClient?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm1}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog — Step 2 (Final) */}
      <AlertDialog open={showDeleteConfirm2} onOpenChange={setShowDeleteConfirm2}>
        <AlertDialogContent className="max-w-[92vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              This is your last chance. Permanently delete <strong>{editingClient?.name}</strong> and all their data? There is no recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFinal}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}