'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Phone,
  Newspaper,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Loader2,
  Fuel,
  Pencil,
  AlertTriangle,
  Clock,
  UserX,
} from 'lucide-react';
import type { Client, ShopSettings } from '@/lib/types';
import { NEWSPAPER_LABELS } from '@/lib/types';
import {
  generatePaymentQRCode,
  generateCompositePaymentImage,
  getWhatsAppUrl,
} from '@/lib/qr-utils';

interface ClientCardProps {
  client: Client;
  onToggleStatus: (id: string) => void;
  onEdit: (client: Client) => void;
  shopSettings: ShopSettings | null;
  overdueDays?: number;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function ClientCard({
  client,
  onToggleStatus,
  onEdit,
  shopSettings,
  overdueDays,
}: ClientCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [compositeBlob, setCompositeBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const isOverdue = client.status === 'unpaid' && overdueDays !== undefined && overdueDays > 0;
  const isInactive = client.status === 'inactive';

  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const shopName = shopSettings?.shopName || 'Chandran News Mart';
  const hasUpi = !!(shopSettings?.upiId);

  const newspaperItems = client.newspapers.map((np) => ({
    label: NEWSPAPER_LABELS[np.newspaper],
    amount: np.monthlyAmount,
  }));

  const getReminderMessage = () => {
    const paperLines = client.newspapers
      .map((np) => `📰 ${NEWSPAPER_LABELS[np.newspaper]} — ₹${np.monthlyAmount}`)
      .join('\n');

    const petrolLine =
      client.petrolCharges > 0 ? `\n⛽ Petrol Charges — ₹${client.petrolCharges}` : '';

    return `Hello ${client.name} 👋

This is your monthly newspaper subscription reminder for *${currentMonth}*.

*Subscription Details:*
${paperLines}${petrolLine}

💰 *Total Amount Due: ₹${client.totalAmount}*

Please scan the QR code in the image above to pay instantly via UPI, or pay at your earliest convenience.

Thank you for your continued subscription! 🙏

— *${shopName}*`;
  };

  const handleWhatsAppClick = async () => {
    setIsDialogOpen(true);
    setIsGenerating(true);
    setShareError(null);
    setCompositeBlob(null);

    try {
      const qrDataUrl = await generatePaymentQRCode(
        client.name,
        client.totalAmount,
        currentMonth,
        shopSettings
      );
      setQrCode(qrDataUrl);

      const blob = await generateCompositePaymentImage(
        client.name,
        client.totalAmount,
        currentMonth,
        newspaperItems,
        client.petrolCharges,
        qrDataUrl,
        shopName
      );
      setCompositeBlob(blob);
    } catch (error) {
      console.error('Failed to generate payment image:', error);
      setShareError('Failed to generate QR. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendWhatsAppReminder = async () => {
    setIsSending(true);
    setShareError(null);

    try {
      let blobToShare = compositeBlob;

      if (!blobToShare) {
        const qrDataUrl = await generatePaymentQRCode(
          client.name,
          client.totalAmount,
          currentMonth,
          shopSettings
        );
        blobToShare = await generateCompositePaymentImage(
          client.name,
          client.totalAmount,
          currentMonth,
          newspaperItems,
          client.petrolCharges,
          qrDataUrl,
          shopName
        );
        setCompositeBlob(blobToShare);
      }

      const fileName = `Payment-${client.name.replace(/\s+/g, '-')}-${currentMonth}.png`;
      const imageFile = new File([blobToShare], fileName, { type: 'image/png' });
      const message = getReminderMessage();

      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: `Newspaper Subscription Reminder — ${currentMonth}`,
          text: message,
          files: [imageFile],
        });
        setIsSending(false);
        return;
      }

      const waUrl = getWhatsAppUrl(client.phoneNumber, message);
      window.open(waUrl, '_blank');

      await new Promise((r) => setTimeout(r, 400));
      downloadComposite();

      setShareError(
        'WhatsApp opened with the reminder text. ' +
          'The payment image has been downloaded — attach it in the chat.'
      );
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setIsSending(false);
        return;
      }
      console.error('Share failed:', error);
      const waUrl = getWhatsAppUrl(client.phoneNumber, getReminderMessage());
      window.open(waUrl, '_blank');
      setShareError('Image share failed. WhatsApp opened with text — attach the image manually.');
      downloadComposite();
    } finally {
      setIsSending(false);
    }
  };

  const downloadComposite = () => {
    if (!compositeBlob) return;
    const url = URL.createObjectURL(compositeBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment-${client.name.replace(/\s+/g, '-')}-${currentMonth}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Card border / bg styling based on state
  const cardClassName = isInactive
    ? 'border-0 shadow-sm opacity-60 bg-muted/40'
    : isOverdue
      ? 'border-l-4 border-l-destructive shadow-md bg-destructive/5 dark:bg-destructive/10'
      : 'border-0 shadow-sm';

  return (
    <>
      <Card className={cardClassName}>
        <CardContent className="p-3.5">
          <div className="flex flex-col gap-3">

            {/* Overdue Banner */}
            {isOverdue && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 -mx-0.5">
                <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                <span className="text-xs font-semibold text-destructive">
                  Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Inactive Banner */}
            {isInactive && (
              <div className="flex items-center gap-2 rounded-md bg-amber-100/80 border border-amber-200 px-2.5 py-1.5 -mx-0.5 dark:bg-amber-950/30 dark:border-amber-800">
                <UserX className="size-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Inactive Client</span>
              </div>
            )}

            {/* Header: Name + Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                  {client.name}
                </h3>
                {client.startDate && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Since {new Date(client.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant={client.status === 'paid' ? 'default' : client.status === 'inactive' ? 'secondary' : 'destructive'}
                  className={`text-xs px-2 py-0.5 ${
                    client.status === 'paid'
                      ? 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400'
                      : client.status === 'inactive'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400'
                  }`}
                >
                  {client.status === 'paid' ? (
                    <CheckCircle2 className="size-3 mr-1" />
                  ) : client.status === 'inactive' ? (
                    <UserX className="size-3 mr-1" />
                  ) : (
                    <XCircle className="size-3 mr-1" />
                  )}
                  {client.status === 'paid' ? 'Paid' : client.status === 'inactive' ? 'Inactive' : 'Unpaid'}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span className="truncate">{client.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{client.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Newspaper className="mt-0.5 size-3.5 shrink-0" />
                <span className="leading-relaxed">
                  {client.newspapers.map((np, idx) => (
                    <span key={np.newspaper}>
                      {NEWSPAPER_LABELS[np.newspaper]} (₹{np.monthlyAmount})
                      {idx < client.newspapers.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </div>
              {client.petrolCharges > 0 && (
                <div className="flex items-center gap-2">
                  <Fuel className="size-3.5 shrink-0" />
                  <span>Petrol: ₹{client.petrolCharges}</span>
                </div>
              )}
            </div>

            {/* Amount row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 flex-1">
                <IndianRupee className="size-3.5 text-primary" />
                <span className="text-base font-bold text-primary">
                  ₹{client.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              {(client.prepaidAmount ?? 0) > 0 && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 text-right">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    Prepaid ₹{(client.prepaidAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isInactive ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(client)}
                  className="h-9 w-9 shrink-0 p-0"
                  aria-label="Edit client"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(client.id)}
                  className="h-9 flex-1 text-xs font-medium"
                >
                  {client.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                </Button>
                <Button
                  onClick={handleWhatsAppClick}
                  className="h-9 flex-1 gap-1.5 bg-[#25D366] text-white hover:bg-[#20BD5A] text-xs font-medium"
                  size="sm"
                >
                  <WhatsAppIcon className="size-3.5" />
                  Remind
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(client)}
                className="h-9 w-full text-xs font-medium"
              >
                <Pencil className="size-3.5 mr-1.5" />
                Edit / Reactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Reminder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[92vw] rounded-xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-base">Payment Reminder</DialogTitle>
            <DialogDescription className="sr-only">
              Send a payment reminder with QR code to {client.name} via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-1">
            <div className="text-center">
              <p className="font-medium text-sm">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                {client.newspapers.map((np) => NEWSPAPER_LABELS[np.newspaper]).join(', ')}
              </p>
            </div>

            {/* Breakdown */}
            <div className="w-full rounded-lg bg-secondary p-3">
              <div className="flex flex-col gap-1 text-sm">
                {client.newspapers.map((np) => (
                  <div key={np.newspaper} className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{NEWSPAPER_LABELS[np.newspaper]}</span>
                    <span className="text-xs">₹{np.monthlyAmount}</span>
                  </div>
                ))}
                {client.petrolCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Petrol</span>
                    <span className="text-xs">₹{client.petrolCharges}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2">
                  <span className="font-medium text-sm">Total Due</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{client.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">{currentMonth}</p>
            </div>

            {/* Message preview */}
            <div className="w-full rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 max-h-28 overflow-y-auto">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Message Preview
              </p>
              <p className="whitespace-pre-line text-xs text-foreground/80 leading-relaxed">
                {getReminderMessage()}
              </p>
            </div>

            {/* QR / Composite preview */}
            {isGenerating ? (
              <div className="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-lg border bg-muted">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Generating payment image…</p>
              </div>
            ) : compositeBlob ? (
              <div className="flex flex-col items-center gap-1">
                <img
                  src={URL.createObjectURL(compositeBlob)}
                  alt="Payment reminder with QR"
                  className="w-48 rounded-lg border shadow-sm"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {hasUpi
                    ? '✓ UPI QR — payer sees your shop name & amount'
                    : '⚠ No UPI linked — go to Settings to enable'}
                </p>
              </div>
            ) : null}

            {shareError && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                {shareError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={sendWhatsAppReminder}
                disabled={isSending || isGenerating}
                className="h-11 w-full gap-2 bg-[#25D366] text-sm font-semibold text-white hover:bg-[#20BD5A]"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <WhatsAppIcon className="size-4" />
                )}
                {isSending ? 'Opening WhatsApp…' : 'Send Reminder + Image'}
              </Button>

              <div className="flex gap-2">
                {compositeBlob && (
                  <Button
                    onClick={downloadComposite}
                    variant="outline"
                    className="h-9 flex-1 gap-1.5 text-xs"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const url = getWhatsAppUrl(client.phoneNumber, getReminderMessage());
                    window.open(url, '_blank');
                  }}
                  variant="outline"
                  className="h-9 flex-1 gap-1.5 text-xs"
                >
                  <WhatsAppIcon className="size-3.5" />
                  Text Only
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}