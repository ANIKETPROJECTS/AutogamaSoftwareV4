import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, MapPin, Search, Car, Mail, DollarSign, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function RegisteredCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const getCustomerJobHistory = (customerId: string) => {
    return jobs.filter((job: any) => job.customerId === customerId);
  };

  const filteredCustomers = customers.filter((customer: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(query);
    const phoneMatch = customer.phone?.includes(query);
    const vehicleMatch = customer.vehicles?.some((v: any) => 
      v.make?.toLowerCase().includes(query) ||
      v.model?.toLowerCase().includes(query) ||
      v.plateNumber?.toLowerCase().includes(query)
    );
    return nameMatch || phoneMatch || vehicleMatch;
  });

  const selectedCustomer = customers.find((c: any) => c._id === selectedCustomerId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="text-registered-customers-title">
          Registered Customers
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a customer to view details
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search by name, phone, or car..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9"
          data-testid="input-search-customer"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-lg mb-3">Customers</h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No customers found</div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.map((customer: any) => (
                <Card
                  key={customer._id}
                  className={cn(
                    "cursor-pointer hover-elevate transition-all",
                    selectedCustomerId === customer._id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedCustomerId(customer._id)}
                  data-testid={`customer-card-${customer._id}`}
                >
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <Card className="h-full" data-testid={`customer-details-${selectedCustomerId}`}>
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="font-display text-2xl font-bold">{selectedCustomer.name}</h2>
                  <p className="text-muted-foreground text-sm mt-1">Customer Details</p>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicles */}
                {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Vehicles</h3>
                    <div className="space-y-2">
                      {selectedCustomer.vehicles.map((vehicle: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-accent/20 rounded">
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {vehicle.make} {vehicle.model}
                              {vehicle.year && <span className="text-muted-foreground"> ({vehicle.year})</span>}
                            </span>
                          </div>
                          {vehicle.plateNumber && (
                            <span className="text-xs bg-background px-2 py-1 rounded border">{vehicle.plateNumber}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Information */}
                {selectedCustomer.service && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Service Details</h3>
                    <div className="p-3 bg-accent/20 rounded space-y-2">
                      <p className="text-sm">{selectedCustomer.service}</p>
                      {selectedCustomer.serviceCost && (
                        <div className="flex items-center gap-2 font-semibold text-base">
                          <DollarSign className="w-4 h-4" />
                          ₹{selectedCustomer.serviceCost.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Service History */}
                {getCustomerJobHistory(selectedCustomer._id).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Service History ({getCustomerJobHistory(selectedCustomer._id).length})</h3>
                    <div className="space-y-2">
                      {getCustomerJobHistory(selectedCustomer._id).slice(0, 5).map((job: any) => (
                        <div key={job._id} className="p-3 bg-accent/10 rounded text-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium truncate">{job.vehicleName}</span>
                            <span className="text-xs bg-background px-2 py-0.5 rounded border">{job.stage}</span>
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

                {/* Action Button */}
                <Link href={`/customer-service?customerId=${selectedCustomer._id}`} className="block">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600" data-testid={`button-create-service-${selectedCustomer._id}`}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Create New Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full" data-testid="customer-details-empty">
              <CardContent className="p-6 flex items-center justify-center h-full min-h-96">
                <div className="text-center text-muted-foreground">
                  <p>Select a customer to view their details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
