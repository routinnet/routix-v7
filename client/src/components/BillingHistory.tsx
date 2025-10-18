import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Check, Clock, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface BillingHistoryProps {
  limit?: number;
}

export function BillingHistory({ limit = 20 }: BillingHistoryProps) {
  const { data: billingData, isLoading } = trpc.payment.getBillingHistory.useQuery({
    limit,
    offset: 0,
  });

  const { data: invoices } = trpc.payment.getInvoices.useQuery({
    limit: 10,
    offset: 0,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading billing history...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-playfair font-bold mb-2">Billing History</h2>
        <p className="text-gray-600 text-sm">View your payment history and download invoices</p>
      </div>

      {/* Transactions */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {billingData?.transactions && billingData.transactions.length > 0 ? (
            billingData.transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center flex-1">
                  <div className="mr-4">{getStatusIcon(transaction.status)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatAmount(transaction.amount)}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </Card>

      {/* Invoices */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Invoices</h3>
        <div className="space-y-3">
          {invoices?.invoices && invoices.invoices.length > 0 ? (
            invoices.invoices.map((invoice: any) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{invoice.description}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(invoice.date)} • {formatAmount(invoice.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No invoices available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Need help?</strong> Contact our support team if you have any questions about your billing history or invoices.
        </p>
      </div>
    </div>
  );
}

