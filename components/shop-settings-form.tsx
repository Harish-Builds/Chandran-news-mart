'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Plus,
  Trash2,
  Pencil,
  Building2,
  CreditCard,
  Hash,
  Landmark,
  Store,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopAccount {
  id: string;
  shopName: string;
  accountName: string;
  upiId: string;
  accountNumber: string;
  ifsc: string;
}

type AccountErrors = Partial<Record<keyof ShopAccount, string>>;

// ─── Storage helpers ──────────────────────────────────────────────────────────

const ACCOUNTS_KEY = 'chandran-shop-accounts-v2';
const ACTIVE_KEY   = 'chandran-shop-active-v2';

const BLANK_ACCOUNT: Omit<ShopAccount, 'id'> = {
  shopName: '',
  accountName: '',
  upiId: '',
  accountNumber: '',
  ifsc: '',
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadAccounts(): ShopAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as ShopAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: ShopAccount[], activeId: string) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  localStorage.setItem(ACTIVE_KEY, activeId);
}

function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function loadActiveAccount(): ShopAccount | null {
  const accounts = loadAccounts();
  if (!accounts.length) return null;
  const id = loadActiveId();
  return accounts.find((a) => a.id === id) ?? accounts[0];
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: Partial<ShopAccount>): AccountErrors {
  const errors: AccountErrors = {};
  if (!data.shopName?.trim()) errors.shopName = 'Shop name is required';
  if (!data.upiId?.trim()) {
    errors.upiId = 'UPI ID is required for QR payments';
  } else if (!/^[\w.\-]+@[\w]+$/.test(data.upiId.trim())) {
    errors.upiId = 'Invalid UPI ID format (e.g. yourname@upi)';
  }
  if (data.accountNumber && !/^\d{9,18}$/.test(data.accountNumber)) {
    errors.accountNumber = 'Account number must be 9–18 digits';
  }
  if (data.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(data.ifsc)) {
    errors.ifsc = 'Invalid IFSC format (e.g. SBIN0001234)';
  }
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  onChange: (v: string) => void;
}

function Field({
  id, label, placeholder, value, error, hint, mono, inputMode, maxLength, onChange,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${mono ? 'font-mono text-sm' : ''} ${error ? 'border-destructive' : ''}`}
        inputMode={inputMode}
        maxLength={maxLength}
      />
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface AccountAvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

function AccountAvatar({ name, size = 'md' }: AccountAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-green-100 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400
        ${size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'}`}
    >
      {initials(name)}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'main' | 'switch' | 'edit';

interface ShopSettingsFormProps {
  onActiveAccountChange?: (account: ShopAccount) => void;
}

export function ShopSettingsForm({ onActiveAccountChange }: ShopSettingsFormProps) {
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>('main');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ShopAccount | null>(null);
  const [editErrors, setEditErrors] = useState<AccountErrors>({});
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    let stored = loadAccounts();
    let id = loadActiveId();
    if (!stored.length) {
      const defaultAcct: ShopAccount = { id: uid(), ...BLANK_ACCOUNT };
      stored = [defaultAcct];
      id = defaultAcct.id;
      saveAccounts(stored, id);
    }
    if (!id || !stored.find((a) => a.id === id)) id = stored[0].id;
    setAccounts(stored);
    setActiveId(id);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeId) ?? accounts[0];

  const persist = useCallback(
    (updated: ShopAccount[], newActiveId: string) => {
      saveAccounts(updated, newActiveId);
      setAccounts(updated);
      setActiveId(newActiveId);
      const next = updated.find((a) => a.id === newActiveId) ?? updated[0];
      if (next) onActiveAccountChange?.(next);
    },
    [onActiveAccountChange],
  );

  // ── Edit helpers ─────────────────────────────────────────────────────────────

  function openEdit(acct: ShopAccount, isNew = false) {
    setEditId(acct.id);
    setEditData({ ...acct });
    setEditErrors({});
    setIsNewAccount(isNew);
    setSavedFlash(false);
    setView('edit');
  }

  function openNewAccount() {
    const fresh: ShopAccount = { id: uid(), ...BLANK_ACCOUNT };
    openEdit(fresh, true);
  }

  function updateEditField<K extends keyof ShopAccount>(key: K, raw: string) {
    let value = raw;
    if (key === 'accountNumber') value = raw.replace(/\D/g, '');
    if (key === 'ifsc') value = raw.toUpperCase();
    setEditData((prev) => (prev ? { ...prev, [key]: value } : prev));
    setEditErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSave() {
    if (!editData) return;
    const errs = validate(editData);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    const cleaned: ShopAccount = { ...editData, ifsc: editData.ifsc.toUpperCase() };
    let updated: ShopAccount[];
    let nextActiveId = activeId ?? cleaned.id;

    if (isNewAccount) {
      updated = [...accounts, cleaned];
      nextActiveId = cleaned.id; // auto-activate new account
    } else {
      updated = accounts.map((a) => (a.id === editId ? cleaned : a));
    }

    persist(updated, nextActiveId);
    setSavedFlash(true);
    setTimeout(() => { setSavedFlash(false); goBack(); }, 1200);
  }

  // ── Switch helpers ────────────────────────────────────────────────────────────

  function activateAccount(id: string) {
    persist(accounts, id);
    setView('main');
  }

  function deleteAccount(id: string) {
    if (accounts.length <= 1) return;
    const updated = accounts.filter((a) => a.id !== id);
    const newId = activeId === id ? updated[0].id : (activeId ?? updated[0].id);
    persist(updated, newId);
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  function goBack() {
    if (view === 'edit' && isNewAccount) setView('switch');
    else setView('main');
    setEditErrors({});
    setSavedFlash(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
    return (
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4" />
        {children}
      </h3>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Views
  // ═══════════════════════════════════════════════════════════════════════════════

  if (!activeAccount) return null;

  // ── EDIT VIEW ────────────────────────────────────────────────────────────────
  if (view === 'edit' && editData) {
    return (
      <div className="flex flex-col gap-6 pb-4">
        <button onClick={goBack} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>

        <h2 className="text-base font-semibold">
          {isNewAccount ? 'Add new account' : 'Edit account settings'}
        </h2>

        {/* Shop Identity */}
        <section className="flex flex-col gap-4">
          <SectionHeading icon={Store}>Shop identity</SectionHeading>
          <Field
            id="shopName" label="Shop / business name" placeholder="Chandran News Mart"
            value={editData.shopName} error={editErrors.shopName}
            onChange={(v) => updateEditField('shopName', v)}
          />
          <Field
            id="accountName" label="Account holder name" placeholder="Name as in your bank account"
            value={editData.accountName}
            hint="This name appears on the payer's UPI app when they scan your QR."
            onChange={(v) => updateEditField('accountName', v)}
          />
        </section>

        {/* UPI */}
        <section className="flex flex-col gap-4">
          <SectionHeading icon={CreditCard}>
            UPI ID <span className="font-normal normal-case text-xs">(required for QR)</span>
          </SectionHeading>
          <Field
            id="upiId" label="UPI ID" placeholder="yourname@upi  or  9876543210@okaxis"
            value={editData.upiId} error={editErrors.upiId} mono
            hint="Found in Google Pay, PhonePe, or Paytm under profile → UPI ID."
            onChange={(v) => updateEditField('upiId', v)}
          />
        </section>

        {/* Bank */}
        <section className="flex flex-col gap-4">
          <SectionHeading icon={Landmark}>
            Bank account <span className="font-normal normal-case text-xs">(optional)</span>
          </SectionHeading>
          <Field
            id="accountNumber" label="Account number" placeholder="e.g. 012345678901"
            value={editData.accountNumber} error={editErrors.accountNumber} mono
            inputMode="numeric" maxLength={18}
            onChange={(v) => updateEditField('accountNumber', v)}
          />
          <Field
            id="ifsc" label="IFSC code" placeholder="e.g. SBIN0001234"
            value={editData.ifsc} error={editErrors.ifsc} mono maxLength={11}
            hint="11-character code on your cheque book or passbook."
            onChange={(v) => updateEditField('ifsc', v)}
          />
        </section>

        <Button onClick={handleSave} className="h-12 text-base font-semibold">
          {savedFlash ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-5" /> Saved!
            </span>
          ) : (
            isNewAccount ? 'Add account' : 'Save changes'
          )}
        </Button>
      </div>
    );
  }

  // ── SWITCH VIEW ──────────────────────────────────────────────────────────────
  if (view === 'switch') {
    return (
      <div className="flex flex-col gap-6 pb-4">
        <button onClick={goBack} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>

        <section className="flex flex-col gap-3">
          <SectionHeading icon={ArrowRightLeft}>Switch account</SectionHeading>

          <div className="divide-y rounded-xl border">
            {accounts.map((acct) => {
              const isActive = acct.id === activeId;
              return (
                <div key={acct.id} className="flex items-center gap-3 px-4 py-3">
                  <AccountAvatar name={acct.shopName || acct.accountName} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {acct.shopName || '(No name)'}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {acct.upiId || 'No UPI linked'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        <span className="size-1.5 rounded-full bg-green-500" /> Active
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => activateAccount(acct.id)}>
                        Use
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(acct)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    {accounts.length > 1 && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteAccount(acct.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="outline" onClick={openNewAccount} className="h-11 gap-2">
            <Plus className="size-4" /> Add new account
          </Button>
        </section>
      </div>
    );
  }

  // ── MAIN VIEW ────────────────────────────────────────────────────────────────
  const hasUpi = Boolean(activeAccount.upiId.trim());

  function DetailRow({ icon: Icon, label, value, mono = false }: {
    icon: React.ElementType; label: string; value?: string; mono?: boolean;
  }) {
    return (
      <div className="flex items-center gap-3 py-2 text-sm">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
        <span className={`truncate ${mono ? 'font-mono' : ''} ${value ? '' : 'text-muted-foreground/50'}`}>
          {value || '—'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
        hasUpi
          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      }`}>
        {hasUpi ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertCircle className="size-5 shrink-0" />}
        <span>
          {hasUpi
            ? `UPI linked — QR codes will show "${activeAccount.shopName}" & auto-fill amount`
            : 'No UPI linked yet — edit this account to enable payment QR codes'}
        </span>
      </div>

      {/* Active account card */}
      <section className="flex flex-col gap-3">
        <SectionHeading icon={Building2}>Active account</SectionHeading>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            <AccountAvatar name={activeAccount.shopName || activeAccount.accountName} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {activeAccount.shopName || '(No name set)'}
              </p>
              <p className="text-xs text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setView('switch')}>
              <ArrowRightLeft className="size-3.5" /> Change
            </Button>
          </div>

          <div className="divide-y">
            <DetailRow icon={Store}    label="Shop name"     value={activeAccount.shopName} />
            <DetailRow icon={CreditCard} label="UPI ID"      value={activeAccount.upiId} mono />
            <DetailRow icon={Landmark} label="Bank account"  value={activeAccount.accountNumber ? '••••' + activeAccount.accountNumber.slice(-4) : ''} mono />
            <DetailRow icon={Hash}     label="IFSC"          value={activeAccount.ifsc} mono />
          </div>
        </div>
      </section>

      {/* Edit button */}
      <Button
        variant="outline"
        className="h-12 gap-2 text-base"
        onClick={() => openEdit(activeAccount)}
      >
        <Pencil className="size-4" /> Edit account settings
      </Button>
    </div>
  );
}