import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, Mail } from 'lucide-react';

export interface InvoiceViewerProps {
  invoice: {
    invoiceId: string;
    date: Date;
    dueDate: Date;
    status: 'draft' | 'paid' | 'pending' | 'overdue';
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod?: string;
  };
  customer: {
    name: string;
    email: string;
    address?: string;
  };
  onDownload?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
}

export function InvoiceViewer({ invoice, customer, onDownload, onPrint, onEmail }: InvoiceViewerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-playfair font-bold">Invoice</h2>
        <div className="flex gap-2">
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button onClick={onPrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button onClick={onEmail} variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-blue-600">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Routix</h1>
            <p className="text-gray-600">AI-Powered Thumbnail Generator</p>
            <p className="text-sm text-gray-500">Email: billing@routix.app</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
            <p className="text-sm">
              <strong>Invoice #:</strong> {invoice.invoiceId}
            </p>
            <p className="text-sm">
              <strong>Date:</strong> {formatDate(invoice.date)}
            </p>
            <p className="text-sm">
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
            </p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <p className="font-semibold">{customer.name}</p>
          <p className="text-sm text-gray-600">{customer.email}</p>
          {customer.address && <p className="text-sm text-gray-600">{customer.address}</p>}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold">Quantity</th>
                <th className="text-right p-3 font-semibold">Unit Price</th>
                <th className="text-right p-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3">{item.description}</td>
                  <td className="text-right p-3">{item.quantity}</td>
                  <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right p-3">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Tax (8%):</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 px-4 mt-2 rounded">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        {invoice.paymentMethod && (
          <div className="mb-8">
            <p>
              <strong>Payment Method:</strong> {invoice.paymentMethod}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t text-center text-sm text-gray-600">
          <p className="mb-2">Thank you for your business!</p>
          <p>For questions about this invoice, please contact billing@routix.app</p>
        </div>
      </Card>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Payment Terms:</strong> Payment is due within 30 days of the invoice date. Late payments may incur additional fees.
        </p>
      </div>
    </div>
  );
}

