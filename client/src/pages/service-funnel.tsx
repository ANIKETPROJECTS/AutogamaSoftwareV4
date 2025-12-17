import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Car, User, Phone, MessageCircle, ChevronRight, IndianRupee } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const SERVICE_STAGES = [
  'New Lead',
  'Inspection Done',
  'Work In Progress',
  'Ready for Delivery',
  'Completed',
  'Cancelled'
];

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-100 text-blue-700 border-blue-200',
  'Inspection Done': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Work In Progress': 'bg-orange-100 text-orange-700 border-orange-200',
  'Ready for Delivery': 'bg-green-100 text-green-700 border-green-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200'
};

const STAGE_BG_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-50 border-blue-200',
  'Inspection Done': 'bg-yellow-50 border-yellow-200',
  'Work In Progress': 'bg-orange-50 border-orange-200',
  'Ready for Delivery': 'bg-green-50 border-green-200',
  'Completed': 'bg-emerald-50 border-emerald-200',
  'Cancelled': 'bg-red-50 border-red-200'
};

export default function ServiceFunnel() {
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

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.jobs.updateStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.stage === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
      toast({ 
        title: 'Status updated',
        description: 'WhatsApp notification will be sent to customer'
      });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  });

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find((c: any) => c._id === customerId);
    return customer?.phone || '';
  };

  const groupedJobs = SERVICE_STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter((job: any) => job.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const activeStages = SERVICE_STAGES.filter(stage => stage !== 'Completed' && stage !== 'Cancelled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Services Funnel</h1>
        <p className="text-muted-foreground mt-1">
          Track service status and send WhatsApp updates automatically
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SERVICE_STAGES.map(stage => (
          <Card key={stage} className={cn("border", STAGE_BG_COLORS[stage])}>
            <CardContent className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <Badge className={cn(STAGE_COLORS[stage], "text-xs")}>{stage}</Badge>
                <span className="text-3xl font-bold">{groupedJobs[stage]?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading services...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No services yet. Create a service from the Customers Service page.
        </div>
      ) : (
        <div className="space-y-6">
          {activeStages.map(stage => (
            groupedJobs[stage]?.length > 0 && (
              <Card key={stage} className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={STAGE_COLORS[stage]}>{stage}</Badge>
                    <span className="text-muted-foreground text-sm font-normal">
                      ({groupedJobs[stage].length} services)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedJobs[stage].map((job: any) => (
                    <div
                      key={job._id}
                      className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`service-item-${job._id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{job.vehicleName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {job.customerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {getCustomerPhone(job.customerId)}
                            </span>
                          </div>
                          {job.notes && (
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">
                              {job.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-bold flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {(job.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={job.stage}
                            onValueChange={(newStage) => updateStageMutation.mutate({ id: job._id, stage: newStage })}
                          >
                            <SelectTrigger 
                              className={cn("w-44", STAGE_COLORS[job.stage])}
                              data-testid={`stage-select-${job._id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_STAGES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div title="WhatsApp notification sent on status change">
                            <MessageCircle className="w-5 h-5 text-green-500" />
                          </div>

                          <Link href="/jobs">
                            <Button variant="ghost" size="icon">
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          ))}

          {(groupedJobs['Completed']?.length > 0 || groupedJobs['Cancelled']?.length > 0) && (
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="text-muted-foreground">Completed & Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...groupedJobs['Completed'] || [], ...groupedJobs['Cancelled'] || []].map((job: any) => (
                  <div
                    key={job._id}
                    className="flex items-center justify-between p-4 bg-accent/20 rounded-lg"
                    data-testid={`service-item-${job._id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <Car className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{job.vehicleName}</p>
                        <p className="text-sm text-muted-foreground">{job.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={job.stage}
                        onValueChange={(newStage) => updateStageMutation.mutate({ id: job._id, stage: newStage })}
                      >
                        <SelectTrigger 
                          className={cn("w-44", STAGE_COLORS[job.stage])}
                          data-testid={`stage-select-${job._id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_STAGES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Link href="/jobs">
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
