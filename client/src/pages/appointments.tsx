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
import { Plus, Calendar, Clock, User, Phone, Car, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
];

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Confirmed': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Converted': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

export default function Appointments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => api.appointments.list(selectedDate),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: api.appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDialogOpen(false);
      toast({ title: 'Appointment created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create appointment', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.appointments.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Status updated' });
    }
  });

  const convertMutation = useMutation({
    mutationFn: api.appointments.convert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Appointment converted to job!' });
    },
    onError: () => {
      toast({ title: 'Failed to convert appointment', variant: 'destructive' });
    }
  });

  const handleCreateAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    createAppointmentMutation.mutate({
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      vehicleInfo: formData.get('vehicleInfo') as string,
      plateNumber: formData.get('plateNumber') as string,
      serviceType: formData.get('serviceType') as string,
      date: formData.get('date') as string,
      timeSlot: formData.get('timeSlot') as string,
      notes: formData.get('notes') as string || undefined,
      status: 'Scheduled'
    });
  };

  const bookedSlots = appointments
    .filter((a: any) => a.status !== 'Cancelled')
    .map((a: any) => a.timeSlot);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage service slots</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-appointment">
               
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input name="customerName" required placeholder="Name" data-testid="input-appt-name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input name="customerPhone" required placeholder="+91 98765 43210" data-testid="input-appt-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Info *</Label>
                <Input name="vehicleInfo" required placeholder="e.g., Toyota Fortuner White" data-testid="input-appt-vehicle" />
              </div>
              <div className="space-y-2">
                <Label>Plate Number *</Label>
                <Input name="plateNumber" required placeholder="e.g., MH02 AB 1234" data-testid="input-appt-plate" />
              </div>
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Input name="serviceType" required placeholder="e.g., Full Service, PPF Installation" data-testid="input-appt-service" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    name="date" 
                    type="date" 
                    required 
                    defaultValue={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    data-testid="input-appt-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Slot *</Label>
                  <Select name="timeSlot" required>
                    <SelectTrigger data-testid="select-appt-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot} disabled={bookedSlots.includes(slot)}>
                          {slot} {bookedSlots.includes(slot) && '(Booked)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Additional notes..." data-testid="input-appt-notes" />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createAppointmentMutation.isPending}
                data-testid="button-submit-appointment"
              >
                {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
          data-testid="input-date-filter"
        />
        <span className="text-muted-foreground">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="py-12 text-center text-muted-foreground">
              No appointments scheduled for this date.
            </CardContent>
          </Card>
        ) : (
          appointments.map((appt: any) => (
            <Card 
              key={appt._id} 
              className="card-modern"
              data-testid={`appointment-card-${appt._id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-lg">{appt.timeSlot}</span>
                        <Badge className={cn("border", STATUS_COLORS[appt.status])}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                        <p>{appt.customerName}</p>
                        <p>{appt.customerPhone}</p>
                        <p>{appt.vehicleInfo} ({appt.plateNumber})</p>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Service: </span>
                        <span className="font-medium">{appt.serviceType}</span>
                      </p>
                      {appt.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">{appt.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {appt.status !== 'Converted' && appt.status !== 'Cancelled' && (
                      <>
                        <Select
                          value={appt.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: appt._id, status })}
                        >
                          <SelectTrigger className="w-36" data-testid={`status-select-${appt._id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="bg-primary"
                          onClick={() => convertMutation.mutate(appt._id)}
                          disabled={convertMutation.isPending}
                          data-testid={`button-convert-${appt._id}`}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Convert to Job
                        </Button>
                      </>
                    )}
                    {appt.status === 'Converted' && appt.jobId && (
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                        Job Created
                      </Badge>
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
