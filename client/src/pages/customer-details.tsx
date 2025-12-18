import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Mail, DollarSign, Wrench, ArrowLeft } from "lucide-react";
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
            <ArrowLeft className="w-4 h-4 mr-2" />
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
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 text-xs">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Information */}
              {customer.service && (
                <div>
                  <p className="font-semibold text-sm mb-1">Service</p>
                  <div className="p-2 bg-accent/20 rounded border text-xs space-y-1">
                    <p className="line-clamp-2">{customer.service}</p>
                    {customer.serviceCost && (
                      <div className="flex items-center gap-1 font-semibold">
                        <DollarSign className="w-3 h-3" />
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
                      <div key={i} className="p-2 bg-accent/10 rounded border text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          <Car className="w-3 h-3" />
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

              {/* Service History */}
              {jobHistory.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-1">History ({jobHistory.length})</p>
                  <div className="p-2 bg-accent/10 rounded border text-xs space-y-1 max-h-20 overflow-y-auto">
                    {jobHistory.slice(0, 3).map((job: any) => (
                      <div key={job._id} className="pb-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium text-xs">{job.vehicleName}</span>
                          <span className="text-xs bg-background px-1 py-0.5 rounded whitespace-nowrap">{job.stage}</span>
                        </div>
                        {job.createdAt && (
                          <p className="text-muted-foreground text-xs">
                            {new Date(job.createdAt).toLocaleDateString('en-IN')}
                          </p>
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
              <Wrench className="w-3 h-3 mr-2" />
              Create Service
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
