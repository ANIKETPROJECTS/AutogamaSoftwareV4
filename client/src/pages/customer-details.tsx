import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Mail, DollarSign, Wrench, ArrowLeft, Calendar, User } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDetails() {
  const [match, params] = useRoute("/customer-details/:id");
  const customerId = params?.id;
  const { toast } = useToast();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const customer = customers.find((c: any) => c._id === customerId);
  const jobHistory = jobs.filter((job: any) => job.customerId === customerId);

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/registered-customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/registered-customers">
          <Button variant="outline" size="sm" data-testid="button-back">
            Back
          </Button>
        </Link>
      </div>

      {/* Customer Info - Compact Layout */}
      <Card className="border border-amber-200 dark:border-amber-800" data-testid={`customer-details-${customerId}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div>
            <h1 className="font-bold text-2xl">{customer.name}</h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left Column - Contact & Service */}
            <div className="space-y-3">
              {/* Contact Information */}
              <div>
                <p className="font-semibold text-sm mb-1">Contact</p>
                <div className="space-y-1 text-xs">
                  <p>{customer.phone}</p>
                  {customer.email && <p className="truncate">{customer.email}</p>}
                  {customer.address && <p className="line-clamp-2 text-xs">{customer.address}</p>}
                </div>
              </div>

              {/* Service Information */}
              {customer.service && (
                <div>
                  <p className="font-semibold text-sm mb-1">Service</p>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs space-y-1">
                    <p className="line-clamp-2">{customer.service}</p>
                    {customer.serviceCost && (
                      <div className="font-semibold">
                        ₹{customer.serviceCost.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Vehicles & History */}
            <div className="space-y-3">
              {/* Vehicles */}
              {customer.vehicles && customer.vehicles.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-1">Vehicles</p>
                  <div className="space-y-1">
                    {customer.vehicles.slice(0, 2).map((vehicle: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="font-medium">
                          <span className="truncate">{vehicle.make} {vehicle.model}</span>
                        </div>
                        {vehicle.plateNumber && (
                          <span className="text-xs bg-background px-1.5 py-0.5 rounded mt-1 inline-block">{vehicle.plateNumber}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action Button */}
          <Link href={`/customer-service?customerId=${customer._id}`} className="block">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-sm h-9" data-testid={`button-create-service-${customer._id}`}>
              Create Service
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Service History - Show all below */}
      {jobHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Service History ({jobHistory.length})</h2>
          <div className="grid gap-3">
            {jobHistory.map((job: any) => (
              <Card
                key={job._id}
                className="border border-amber-200 dark:border-amber-800"
                data-testid={`card-history-detail-${job._id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header - Service Title if available */}
                  {job.serviceName && (
                    <div className="text-sm font-bold text-primary">{job.serviceName}</div>
                  )}
                  
                  {/* Header - Vehicle Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base">{job.vehicleName}</h3>
                      <p className="text-xs text-muted-foreground">{job.plateNumber}</p>
                    </div>
                    <span className="text-xs bg-accent px-2 py-1 rounded font-medium">{job.stage}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground font-medium">Date</p>
                      <p className="mt-1">{new Date(job.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Technician</p>
                      <p className="mt-1">{job.technicianName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Amount</p>
                      <p className="font-bold text-primary mt-1">₹{job.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                  </div>

                  {/* Service Items */}
                  {job.serviceItems && job.serviceItems.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="font-semibold text-xs mb-2">Services</p>
                      <div className="space-y-1">
                        {job.serviceItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="truncate">{item.description || item.name || 'Service'}</span>
                            {item.cost && <span className="font-medium whitespace-nowrap ml-2">₹{item.cost.toLocaleString('en-IN')}</span>}
                            {item.price && <span className="font-medium whitespace-nowrap ml-2">₹{item.price.toLocaleString('en-IN')}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="text-xs">
                      <p className="text-muted-foreground font-medium">Payment Status</p>
                      <p className="mt-1">{job.paymentStatus}</p>
                    </div>
                    {job.paidAmount > 0 && (
                      <div className="text-xs text-right">
                        <p className="text-muted-foreground font-medium">Paid</p>
                        <p className="mt-1 font-bold">₹{job.paidAmount.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <div className="border-t pt-3">
                      <p className="font-semibold text-xs mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{job.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
