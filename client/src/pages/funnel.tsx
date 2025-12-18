import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, Wrench, Phone, MapPin, Search, History, Car, Clock } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FUNNEL_STAGES = [
  { key: "Inquired", label: "Inquired", color: "blue" },
  { key: "Working", label: "Working", color: "orange" },
  { key: "Waiting", label: "Waiting", color: "yellow" },
  { key: "Completed", label: "Completed", color: "green" },
];

const PHASE_COLORS: Record<string, string> = {
  Inquired: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Working: "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  Waiting: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  Completed: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
};

const COLUMN_BG_COLORS: Record<string, string> = {
  Inquired: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  Working: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
  Waiting: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
  Completed: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
};

export default function CustomerFunnel() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.customers.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const getCustomersByStatus = (status: string) => {
    return filteredCustomers.filter((customer: any) => (customer.status || 'Inquired') === status);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const customerDate = new Date(date);
    const diffDays = Math.floor(
      (now.getTime() - customerDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const stageCounts = FUNNEL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = getCustomersByStatus(stage.key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="font-display text-3xl font-bold tracking-tight"
            data-testid="text-funnel-title"
          >
            Customer Funnel
          </h1>
          <p className="text-muted-foreground mt-1">
            Track customer journey through different stages
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or car..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-customer"
          />
        </div>
      </div>

      {/* Stage Summary */}
      <div className="flex flex-wrap gap-3">
        {FUNNEL_STAGES.map((stage) => (
          <div key={stage.key} className="text-sm font-medium text-muted-foreground">
            {stage.label} <span className="text-foreground font-bold">({stageCounts[stage.key]})</span>
          </div>
        ))}
      </div>

      {/* Kanban Board - 4 Columns */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage.key} className="space-y-0">
              {/* Column Header */}
              <div className={cn("rounded-t-lg border p-4 border-b-0", COLUMN_BG_COLORS[stage.key])}>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={cn(PHASE_COLORS[stage.key], "text-xs mb-2")}>
                      {stage.label}
                    </Badge>
                    <CardTitle className="text-lg">{stage.label}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {stageCounts[stage.key]}
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className={cn(
                "rounded-b-lg border border-t-0 p-4 min-h-96 max-h-96 overflow-y-auto space-y-3",
                COLUMN_BG_COLORS[stage.key]
              )}>
                {getCustomersByStatus(stage.key).length === 0 ? (
                  <p className="text-muted-foreground text-center py-12 text-sm">
                    No customers
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getCustomersByStatus(stage.key).map((customer: any) => (
                      <Card
                        key={customer._id}
                        className="bg-background border-border hover:shadow-md transition-shadow cursor-pointer"
                        data-testid={`funnel-customer-${customer._id}`}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            {/* Customer Name and Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-sm">{customer.name}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {customer.phone}
                                </p>
                              </div>
                              <Badge className={cn(PHASE_COLORS[stage.key], "text-xs whitespace-nowrap")}>
                                {stage.label}
                              </Badge>
                            </div>

                            {/* Address */}
                            {customer.address && (
                              <div className="text-xs text-muted-foreground flex items-start gap-1">
                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{customer.address}</span>
                              </div>
                            )}

                            {/* Vehicle */}
                            {customer.vehicles && customer.vehicles.length > 0 && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span className="truncate">
                                  {customer.vehicles[0].make} {customer.vehicles[0].model}
                                </span>
                              </div>
                            )}

                            {/* Time */}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(customer.createdAt || new Date().toISOString())}
                            </div>

                            {/* Status Selector */}
                            <div className="pt-2">
                              <Select
                                value={customer.status || 'Inquired'}
                                onValueChange={(value) => {
                                  updateStatusMutation.mutate({
                                    id: customer._id,
                                    status: value,
                                  });
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${customer._id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FUNNEL_STAGES.map((s) => (
                                    <SelectItem key={s.key} value={s.key}>
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-1 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setDetailsOpen(true);
                                }}
                                data-testid={`button-view-${customer._id}`}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              {getCustomerJobHistory(customer._id).length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs flex-1"
                                  onClick={() => {
                                    setHistoryCustomer(customer);
                                    setHistoryOpen(true);
                                  }}
                                  data-testid={`button-history-${customer._id}`}
                                >
                                  <History className="w-3 h-3 mr-1" />
                                  History
                                </Button>
                              )}
                            </div>

                            {/* Create Service Button */}
                            <Link href={`/customer-service?customerId=${customer._id}`}>
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-blue-500 hover:bg-blue-600"
                                data-testid={`button-create-service-${customer._id}`}
                              >
                                <Wrench className="w-3 h-3 mr-1" />
                                Create Service
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedCustomer.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge className={cn(`mt-1`, PHASE_COLORS[selectedCustomer.status || 'Inquired'])}>
                    {selectedCustomer.status || 'Inquired'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                  <p className="font-medium">{selectedCustomer.vehicles?.length || 0} vehicle(s)</p>
                </div>
              </div>

              {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Vehicles</p>
                  <div className="space-y-2">
                    {selectedCustomer.vehicles.map((vehicle: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">Change Status</p>
                <Select
                  value={selectedCustomer.status || 'Inquired'}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({
                      id: selectedCustomer._id,
                      status: value,
                    });
                    setSelectedCustomer({ ...selectedCustomer, status: value });
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNEL_STAGES.map((stage) => (
                      <SelectItem key={stage.key} value={stage.key}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Service History - {historyCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {historyCustomer && (
            <div className="space-y-4">
              {getCustomerJobHistory(historyCustomer._id).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No service history found</p>
              ) : (
                <div className="space-y-3">
                  {getCustomerJobHistory(historyCustomer._id).map((job: any) => (
                    <Card key={job._id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{job.vehicleName}</span>
                              {job.plateNumber && (
                                <Badge variant="outline" className="text-xs">{job.plateNumber}</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Status: </span>
                                <Badge className="text-xs ml-1" variant="outline">{job.stage}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Technician: </span>
                                <span>{job.technicianName || 'Not assigned'}</span>
                              </div>
                            </div>
                            {job.notes && (
                              <p className="text-sm text-muted-foreground mt-2 truncate">{job.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
