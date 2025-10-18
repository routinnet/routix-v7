// Invoice Generation Utility for Routix
import { getUser } from "./db";

export interface InvoiceData {
  invoiceId: string;
  userId: string;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "paid" | "pending" | "overdue";
  paymentMethod?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculate tax based on user location and amount
 */
export async function calculateTax(
  userId: string,
  amount: number
): Promise<TaxCalculation> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  // Default tax rate (in production, use location-based tax calculation)
  let taxRate = 0.08; // 8% sales tax

  try {
    // Implement location-based tax calculation
    // - Fetch user's billing address
    // - Determine tax jurisdiction
    // - Apply appropriate tax rate
    // For now, using default rate
  } catch (error) {
    console.error('Error calculating location-based tax:', error);
    // Fall back to default rate
  }

  const taxAmount = amount * taxRate;
  const total = amount + taxAmount;

  return {
    subtotal: amount,
    taxRate,
    taxAmount,
    total,
  };
}

/**
 * Generate invoice data for a transaction
 */
export async function generateInvoice(
  userId: string,
  items: InvoiceItem[],
  paymentMethod?: string
): Promise<InvoiceData> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const date = new Date();
  const dueDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxCalculation = await calculateTax(userId, subtotal);

  return {
    invoiceId,
    userId,
    date,
    dueDate,
    items,
    subtotal,
    tax: taxCalculation.taxAmount,
    total: taxCalculation.total,
    status: "pending",
    paymentMethod,
  };
}

/**
 * Generate invoice HTML for rendering or PDF generation
 */
export function generateInvoiceHTML(invoice: InvoiceData, user: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceId}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #3b82f6;
      font-size: 32px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .customer-info {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals tr td {
      padding: 8px 12px;
    }
    .totals .grand-total {
      font-size: 18px;
      font-weight: bold;
      background-color: #f3f4f6;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
    }
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>Routix</h1>
      <p>AI-Powered Thumbnail Generator</p>
      <p>Email: billing@routix.app</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoiceId}</p>
      <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
      <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
      <p><span class="status status-${invoice.status}">${invoice.status}</span></p>
    </div>
  </div>

  <div class="customer-info">
    <h3>Bill To:</h3>
    <p><strong>${user.name || "Customer"}</strong></p>
    <p>${user.email}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right">${formatCurrency(item.total)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td><strong>Subtotal:</strong></td>
      <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
    </tr>
    <tr>
      <td><strong>Tax (8%):</strong></td>
      <td class="text-right">${formatCurrency(invoice.tax)}</td>
    </tr>
    <tr class="grand-total">
      <td><strong>Total:</strong></td>
      <td class="text-right">${formatCurrency(invoice.total)}</td>
    </tr>
  </table>

  ${
    invoice.paymentMethod
      ? `<p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>`
      : ""
  }

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>For questions about this invoice, please contact billing@routix.app</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate a PDF invoice (placeholder - requires PDF library)
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  user: any
): Promise<Buffer> {
  try {
    // Implement PDF generation using a library like puppeteer or pdfkit
    // For now, return a placeholder with HTML content
    const html = generateInvoiceHTML(invoice, user);
    return Buffer.from(html, "utf-8");
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
}

export default {
  calculateTax,
  generateInvoice,
  generateInvoiceHTML,
  generateInvoicePDF,
};

