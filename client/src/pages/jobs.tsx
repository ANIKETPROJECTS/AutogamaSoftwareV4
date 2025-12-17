import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Car, User, Phone, ChevronRight, FileText } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const JOB_STAGES = [
  'New Lead',
  'Inspection Done',
  'Work In Progress',
  'Ready for Delivery',
  'Completed',
  'Cancelled'
];

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Inspection Done': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Work In Progress': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Ready for Delivery': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function Jobs() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.invoices.list(),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (jobId: string) => api.jobs.generateInvoice(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Invoice created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    }
  });

  const hasInvoice = (jobId: string) => invoices.some((inv: any) => inv.jobId === jobId);

  const createJobMutation = useMutation({
    mutationFn: api.jobs.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDialogOpen(false);
      toast({ title: 'Job created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create job', variant: 'destructive' });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.jobs.updateStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.stage === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
      toast({ title: 'Stage updated' });
    },
    onError: () => {
      toast({ title: 'Cannot change stage after invoice is created', variant: 'destructive' });
    }
  });

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === '' || 
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      job.plateNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || job.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleCreateJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const customerId = formData.get('customerId') as string;
    const vehicleIndex = parseInt(formData.get('vehicleIndex') as string);
    const customer = customers.find((c: any) => c._id === customerId);
    
    if (!customer) return;
    
    const vehicle = customer.vehicles[vehicleIndex];
    
    createJobMutation.mutate({
      customerId,
      vehicleIndex,
      customerName: customer.name,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      plateNumber: vehicle.plateNumber,
      technicianId: formData.get('technicianId') as string || undefined,
      technicianName: technicians.find((t: any) => t._id === formData.get('technicianId'))?.name,
      notes: formData.get('notes') as string,
      stage: 'New Lead',
      serviceItems: [],
      totalAmount: 0,
      paidAmount: 0,
      paymentStatus: 'Pending'
    });
  };

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage all service jobs</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-job">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select 
                  name="customerId" 
                  required
                  onValueChange={(val) => setSelectedCustomer(customers.find((c: any) => c._id === val))}
                >
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select name="vehicleIndex" required>
                    <SelectTrigger data-testid="select-vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomer.vehicles.map((v: any, i: number) => (
                        <SelectItem key={i} value={i.toString()}>
                          {v.make} {v.model} - {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Assign Technician (Optional)</Label>
                <Select name="technicianId">
                  <SelectTrigger data-testid="select-technician">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech: any) => (
                      <SelectItem key={tech._id} value={tech._id}>
                        {tech.name} - {tech.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  name="notes" 
                  placeholder="Service notes..." 
                  data-testid="input-notes"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createJobMutation.isPending}
                data-testid="button-submit-job"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, vehicle, or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-stage-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {JOB_STAGES.map(stage => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search || stageFilter !== 'all' ? 'No jobs match your filters' : 'No jobs yet. Create your first job!'}
          </div>
        ) : (
          filteredJobs.map((job: any) => (
            <Card 
              key={job._id} 
              className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              data-testid={`job-row-${job._id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{job.vehicleName}</h3>
                        <Badge variant="outline" className="text-xs">{job.plateNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {job.customerName}
                        </span>
                        {job.technicianName && (
                          <span>Assigned: {job.technicianName}</span>
                        )}
                      </div>
                      {job.notes && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">{job.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasInvoice(job._id) ? (
                      <Badge className={cn("w-48 justify-center border py-2", STAGE_COLORS[job.stage])}>
                        {job.stage}
                      </Badge>
                    ) : (
                      <Select
                        value={job.stage}
                        onValueChange={(stage) => updateStageMutation.mutate({ id: job._id, stage })}
                      >
                        <SelectTrigger className={cn("w-48 border", STAGE_COLORS[job.stage])} data-testid={`stage-select-${job._id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_STAGES.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-semibold">₹{job.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid: </span>
                      <span className="font-semibold text-green-500">₹{job.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        job.paymentStatus === 'Paid' && 'border-green-500/30 text-green-500',
                        job.paymentStatus === 'Partially Paid' && 'border-yellow-500/30 text-yellow-500',
                        job.paymentStatus === 'Pending' && 'border-red-500/30 text-red-500'
                      )}
                    >
                      {job.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    {hasInvoice(job._id) ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <FileText className="w-3 h-3 mr-1" />
                        Invoice Created
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => generateInvoiceMutation.mutate(job._id)}
                        disabled={generateInvoiceMutation.isPending || job.totalAmount <= 0}
                        data-testid={`button-create-invoice-${job._id}`}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Create Invoice
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
