'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Building2, CreditCard, Hash, Landmark, Store } from 'lucide-react';
import type { ShopSettings } from '@/lib/types';
import { DEFAULT_SHOP_SETTINGS } from '@/lib/types';

const STORAGE_KEY = 'chandran-shop-settings';

interface ShopSettingsFormProps {
  onSettingsChange?: (settings: ShopSettings) => void;
}

export function loadShopSettings(): ShopSettings {
  if (typeof window === 'undefined') return DEFAULT_SHOP_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHOP_SETTINGS;
    return { ...DEFAULT_SHOP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHOP_SETTINGS;
  }
}

export function ShopSettingsForm({ onSettingsChange }: ShopSettingsFormProps) {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<ShopSettings>>({});

  useEffect(() => {
    setSettings(loadShopSettings());
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<ShopSettings> = {};
    if (!settings.shopName.trim()) newErrors.shopName = 'Shop name is required';
    if (!settings.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required for QR payments';
    } else if (!/^[\w.\-]+@[\w]+$/.test(settings.upiId.trim())) {
      newErrors.upiId = 'Invalid UPI ID format (e.g. yourname@upi)';
    }
    if (settings.accountNumber && !/^\d{9,18}$/.test(settings.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9–18 digits';
    }
    if (settings.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(settings.ifsc.toUpperCase())) {
      newErrors.ifsc = 'Invalid IFSC format (e.g. SBIN0001234)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const toSave = { ...settings, ifsc: settings.ifsc.toUpperCase() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSettings(toSave);
    setSaved(true);
    onSettingsChange?.(toSave);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (field: keyof ShopSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  const hasUpi = Boolean(settings.upiId.trim());

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
          hasUpi
            ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
        }`}
      >
        {hasUpi ? (
          <>
            <CheckCircle2 className="size-5 shrink-0" />
            <span>UPI linked — QR codes will show your shop name &amp; auto-fill amount</span>
          </>
        ) : (
          <>
            <AlertCircle className="size-5 shrink-0" />
            <span>No UPI linked yet — add your UPI ID to enable proper payment QR codes</span>
          </>
        )}
      </div>

      {/* Shop Identity */}
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Store className="size-4" />
          Shop Identity
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shopName">Shop / Business Name</Label>
          <Input
            id="shopName"
            placeholder="Chandran News Mart"
            value={settings.shopName}
            onChange={(e) => update('shopName', e.target.value)}
            className={errors.shopName ? 'border-destructive' : ''}
          />
          {errors.shopName && (
            <p className="text-xs text-destructive">{errors.shopName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountName">Account Holder Name</Label>
          <Input
            id="accountName"
            placeholder="Name as in your bank account"
            value={settings.accountName}
            onChange={(e) => update('accountName', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This name appears on the payer's UPI app when they scan the QR.
          </p>
        </div>
      </section>

      {/* UPI */}
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <CreditCard className="size-4" />
          UPI ID <span className="font-normal normal-case text-xs">(Required for QR)</span>
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="upiId">UPI ID</Label>
          <Input
            id="upiId"
            placeholder="yourname@upi  or  9876543210@okaxis"
            value={settings.upiId}
            onChange={(e) => update('upiId', e.target.value)}
            className={`font-mono text-sm ${errors.upiId ? 'border-destructive' : ''}`}
          />
          {errors.upiId ? (
            <p className="text-xs text-destructive">{errors.upiId}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Found in Google Pay, PhonePe, or Paytm under your profile → UPI ID.
            </p>
          )}
        </div>
      </section>

      {/* Bank Account (optional) */}
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Landmark className="size-4" />
          Bank Account <span className="font-normal normal-case text-xs">(Optional — for reference)</span>
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            placeholder="e.g. 012345678901"
            value={settings.accountNumber}
            onChange={(e) => update('accountNumber', e.target.value.replace(/\D/g, ''))}
            className={`font-mono text-sm ${errors.accountNumber ? 'border-destructive' : ''}`}
            inputMode="numeric"
            maxLength={18}
          />
          {errors.accountNumber && (
            <p className="text-xs text-destructive">{errors.accountNumber}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ifsc">IFSC Code</Label>
          <Input
            id="ifsc"
            placeholder="e.g. SBIN0001234"
            value={settings.ifsc}
            onChange={(e) => update('ifsc', e.target.value.toUpperCase())}
            className={`font-mono text-sm ${errors.ifsc ? 'border-destructive' : ''}`}
            maxLength={11}
          />
          {errors.ifsc ? (
            <p className="text-xs text-destructive">{errors.ifsc}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              11-character code on your cheque book or bank passbook.
            </p>
          )}
        </div>
      </section>

      <Button onClick={handleSave} className="h-12 text-base font-semibold">
        {saved ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-5" /> Saved!
          </span>
        ) : (
          'Save Settings'
        )}
      </Button>
    </div>
  );
}