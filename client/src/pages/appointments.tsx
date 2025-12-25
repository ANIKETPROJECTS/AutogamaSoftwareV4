import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, User, Phone, Mail, Car, Grid3X3, List, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  'Confirmed': 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
  'Cancelled': 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  'Converted': 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
};

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function Appointments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments.list(),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => api.appointments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDialogOpen(false);
      setFormErrors({});
      toast({ title: 'Appointment booked successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to book appointment', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.appointments.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Status updated' });
    }
  });

  const handleCreateAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const phone = (formData.get('customerPhone') as string) || '';
    const email = (formData.get('customerEmail') as string) || '';
    const errors: Record<string, string> = {};

    if (!validatePhone(phone)) {
      errors.customerPhone = 'Phone must be 10 digits';
    }
    if (email && !validateEmail(email)) {
      errors.customerEmail = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createAppointmentMutation.mutate({
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string || undefined,
      vehicleInfo: formData.get('vehicleInfo') as string,
      serviceType: formData.get('serviceType') as string,
      date: formData.get('date') as string,
      timeSlot: formData.get('timeSlot') as string,
      notes: formData.get('notes') as string || undefined,
      status: 'Scheduled'
    });
    form.reset();
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        appt.customerName?.toLowerCase().includes(query) ||
        appt.customerPhone?.includes(query) ||
        appt.vehicleInfo?.toLowerCase().includes(query)
      );
    });
  }, [appointments, searchQuery]);

  const bookedSlots = filteredAppointments
    .filter((a: any) => a.status !== 'Cancelled')
    .map((a: any) => a.timeSlot);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage service appointments</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-appointment">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input 
                  id="customerName"
                  name="customerName" 
                  required 
                  placeholder="Enter customer name"
                  data-testid="input-appt-name"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input 
                  id="customerPhone"
                  name="customerPhone" 
                  required 
                  placeholder="10 digit phone number"
                  maxLength={10}
                  data-testid="input-appt-phone"
                />
                {formErrors.customerPhone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.customerPhone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input 
                  id="customerEmail"
                  name="customerEmail" 
                  type="email"
                  placeholder="customer@example.com"
                  data-testid="input-appt-email"
                />
                {formErrors.customerEmail && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.customerEmail}
                  </p>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="space-y-2">
                <Label htmlFor="vehicleInfo">Vehicle Info *</Label>
                <Input 
                  id="vehicleInfo"
                  name="vehicleInfo" 
                  required 
                  placeholder="e.g., Toyota Fortuner White"
                  data-testid="input-appt-vehicle"
                />
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Input 
                  id="serviceType"
                  name="serviceType" 
                  required 
                  placeholder="e.g., PPF, Full Service, Detailing"
                  data-testid="input-appt-service"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input 
                    id="date"
                    name="date" 
                    type="date" 
                    required 
                    defaultValue={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    data-testid="input-appt-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time *</Label>
                  <Select name="timeSlot" required>
                    <SelectTrigger id="timeSlot" data-testid="select-appt-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot} disabled={bookedSlots.includes(slot)}>
                          {formatTime(slot)} {bookedSlots.includes(slot) && '(Booked)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  name="notes" 
                  placeholder="Any additional information..."
                  className="resize-none"
                  data-testid="input-appt-notes"
                />
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

      {/* Search and View Mode */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search by name, phone, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-appointments"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            data-testid="button-view-card"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Appointments Display */}
      <div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="py-12 text-center text-muted-foreground">
              No appointments found.
            </CardContent>
          </Card>
        ) : viewMode === "card" ? (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appt: any) => (
              <Card 
                key={appt._id}
                className="hover-elevate overflow-hidden"
                data-testid={`appointment-card-${appt._id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{appt.customerName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(appt.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <Badge className={cn("text-xs whitespace-nowrap", STATUS_COLORS[appt.status])}>
                      {appt.status}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{formatTime(appt.timeSlot)}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{appt.customerPhone}</span>
                  </div>

                  {/* Email */}
                  {appt.customerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-xs">{appt.customerEmail}</span>
                    </div>
                  )}

                  {/* Vehicle */}
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{appt.vehicleInfo}</span>
                  </div>

                  {/* Service Type */}
                  <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                    {appt.serviceType}
                  </div>

                  {/* Actions */}
                  {appt.status !== 'Converted' && appt.status !== 'Cancelled' && (
                    <div className="flex gap-2 pt-2 border-t">
                      {appt.status === 'Scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Confirmed' })}
                          data-testid={`button-confirm-${appt._id}`}
                        >
                          Confirm
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Cancelled' })}
                        data-testid={`button-cancel-${appt._id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredAppointments.map((appt: any) => (
              <Card 
                key={appt._id}
                className="hover-elevate"
                data-testid={`appointment-row-${appt._id}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold">{appt.customerName}</span>
                        <Badge className={cn("text-xs", STATUS_COLORS[appt.status])}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(appt.date), 'MMM dd, yyyy')} at {formatTime(appt.timeSlot)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {appt.customerPhone}
                        </div>
                        {appt.customerEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {appt.customerEmail}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3" />
                          {appt.vehicleInfo} - {appt.serviceType}
                        </div>
                      </div>
                    </div>

                    {appt.status !== 'Converted' && appt.status !== 'Cancelled' && (
                      <div className="flex gap-2">
                        {appt.status === 'Scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Confirmed' })}
                            data-testid={`button-confirm-${appt._id}`}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Cancelled' })}
                          data-testid={`button-cancel-${appt._id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
