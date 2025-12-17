import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndianRupee, CreditCard, Search, CheckCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

export default function PaymentTracking() {
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.invoices.list(),
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const isLoading = invoicesLoading || jobsLoading;

  const paidInvoices = invoices.filter((inv: any) => inv.paymentStatus === 'Paid');

  const filteredInvoices = paidInvoices.filter((inv: any) => {
    const matchesSearch = 
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const paidCount = paidInvoices.length;

  const totalCollected = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'Partially Paid': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
    }
  };

  const getPaymentStatusIcon = () => {
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground" data-testid="text-payments-title">
          Payment Tracking
        </h1>
        <p className="text-muted-foreground mt-1">View all completed and paid invoices</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-collected">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue Collected</p>
                <p className="text-3xl font-bold mt-1 text-green-900 dark:text-green-100 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {totalCollected.toLocaleString('en-IN')}
                </p>
              </div>
              <IndianRupee className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" data-testid="card-paid-count">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Paid Invoices</p>
                <p className="text-3xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">{paidCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-payments"
          />
        </div>
      </div>

      {/* Payment List */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Records (Invoices)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment records found</p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice: any) => (
                <div 
                  key={invoice._id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors flex-wrap gap-4"
                  data-testid={`payment-item-${invoice._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {getPaymentStatusIcon()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.vehicleName} - {invoice.plateNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total (incl. GST)</p>
                      <p className="font-bold text-foreground flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(invoice.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="font-bold text-green-600 flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(invoice.paidAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold text-red-600 flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Badge className={`${getPaymentStatusColor(invoice.paymentStatus)} min-w-[100px] justify-center`}>
                      {invoice.paymentStatus}
                    </Badge>
                    <Link href="/billing">
                      <Button variant="outline" size="sm" data-testid={`button-view-invoice-${invoice._id}`}>
                        View Invoice
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
