import QRCode from 'qrcode';

export interface ShopSettings {
  upiId: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  shopName: string;
}

/**
 * Generates a UPI-compliant QR code.
 * When scanned by any UPI app (GPay, PhonePe, Paytm, etc.),
 * it will show the recipient name and pre-fill the amount.
 */
export async function generatePaymentQRCode(
  clientName: string,
  amount: number,
  month: string,
  settings?: ShopSettings | null
): Promise<string> {
  let qrData: string;

  if (settings?.upiId) {
    // UPI Deep Link — recognized by all UPI payment apps
    // pa = payee address (UPI ID), pn = payee name, am = amount, tn = transaction note
    const params = new URLSearchParams({
      pa: settings.upiId,
      pn: settings.accountName || settings.shopName || 'Chandran News Mart',
      am: amount.toString(),
      cu: 'INR',
      tn: `Newspaper payment for ${month} - ${clientName}`,
    });
    qrData = `upi://pay?${params.toString()}`;
  } else {
    // Fallback: plain JSON (no bank linked yet)
    qrData = JSON.stringify({
      recipient: clientName,
      amount,
      currency: 'INR',
      month,
      description: `Newspaper payment for ${month}`,
    });
  }

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Composites the payment details text + QR code into a single PNG image.
 * This single image is what gets shared to WhatsApp — no separate text needed.
 */
export async function generateCompositePaymentImage(
  clientName: string,
  amount: number,
  month: string,
  newspapers: { label: string; amount: number }[],
  petrolCharges: number,
  qrDataUrl: string,
  shopName: string = 'Chandran News Mart'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const W = 600;

    // Calculate height dynamically
    const lineHeight = 28;
    const headerH = 100;
    const amountH = 80;
    const dividerH = 20;
    const itemsH = newspapers.length * lineHeight + (petrolCharges > 0 ? lineHeight : 0);
    const totalRowH = 50;
    const qrSize = 220;
    const footerH = 60;
    const padding = 40;

    const H =
      headerH + dividerH + itemsH + totalRowH + dividerH + qrSize + footerH + padding * 2;

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d')!;

    // ── Background ──────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Top accent bar
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#16a34a');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 6);

    // ── Shop Header ─────────────────────────────────────────────────
    let y = 30;
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shopName, W / 2, y);

    y += 28;
    ctx.fillStyle = '#374151';
    ctx.font = '15px sans-serif';
    ctx.fillText('Payment Reminder', W / 2, y);

    y += 22;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px sans-serif';
    ctx.fillText(month, W / 2, y);

    // ── Client name ─────────────────────────────────────────────────
    y += 28;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(clientName, W / 2, y);

    // ── Divider ──────────────────────────────────────────────────────
    y += 18;
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();

    // ── Line items ───────────────────────────────────────────────────
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    y += 22;

    for (const np of newspapers) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText(np.label, 60, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.fillText(`₹${np.amount}`, W - 60, y);
      ctx.textAlign = 'left';
      y += lineHeight;
    }

    if (petrolCharges > 0) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Petrol Charges', 60, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.fillText(`₹${petrolCharges}`, W - 60, y);
      ctx.textAlign = 'left';
      y += lineHeight;
    }

    // ── Total ─────────────────────────────────────────────────────────
    y += 6;
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
    y += 22;

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    ctx.fillText('Total Due', 60, y);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#16a34a';
    ctx.textAlign = 'right';
    ctx.fillText(`₹${amount.toLocaleString('en-IN')}`, W - 60, y);

    // ── QR Code ───────────────────────────────────────────────────────
    y += 28;
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrX = (W - qrSize) / 2;

      // QR border card
      ctx.fillStyle = '#f9fafb';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      const cardPad = 12;
      roundRect(ctx, qrX - cardPad, y - cardPad, qrSize + cardPad * 2, qrSize + cardPad * 2, 12);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);

      // ── Footer ────────────────────────────────────────────────────
      y += qrSize + 20;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan with any UPI app to pay', W / 2, y);

      y += 18;
      ctx.fillStyle = '#d1fae5';
      ctx.fillRect(0, H - 6, W, 6);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/png',
        1.0
      );
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR image'));
    qrImg.src = qrDataUrl;
  });
}

// Helper: rounded rect path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  const formattedNumber = cleanedNumber.startsWith('+')
    ? cleanedNumber.replace('+', '')
    : cleanedNumber.startsWith('91')
    ? cleanedNumber
    : `91${cleanedNumber}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}