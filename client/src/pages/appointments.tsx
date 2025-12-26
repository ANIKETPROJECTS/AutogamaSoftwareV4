import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Grid3X3, List, AlertCircle, X, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TimePicker = ({ value, onChange, error }: { value: string, onChange: (val: string) => void, error?: string }) => {
  // Parse initial value HH:mm
  const initialHours = value ? parseInt(value.split(':')[0]) : 9;
  const initialMinutes = value ? parseInt(value.split(':')[1]) : 0;
  
  const [hours, setHours] = useState(initialHours === 0 ? 12 : initialHours > 12 ? initialHours - 12 : initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [ampm, setAmpm] = useState(initialHours >= 12 ? 'PM' : 'AM');

  const updateTime = (h: number, m: number, p: string) => {
    let finalHours = h;
    if (p === 'PM' && h < 12) finalHours += 12;
    if (p === 'AM' && h === 12) finalHours = 0;
    const timeStr = `${finalHours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(timeStr);
  };

  const incrementHours = () => {
    const next = hours === 12 ? 1 : hours + 1;
    setHours(next);
    updateTime(next, minutes, ampm);
  };
  const decrementHours = () => {
    const next = hours === 1 ? 12 : hours - 1;
    setHours(next);
    updateTime(next, minutes, ampm);
  };
  const incrementMinutes = () => {
    const next = (minutes + 1) % 60;
    setMinutes(next);
    updateTime(hours, next, ampm);
  };
  const decrementMinutes = () => {
    const next = (minutes - 1 + 60) % 60;
    setMinutes(next);
    updateTime(hours, next, ampm);
  };
  const toggleAmpm = () => {
    const next = ampm === 'AM' ? 'PM' : 'AM';
    setAmpm(next);
    updateTime(hours, minutes, next);
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 w-fit gap-6",
        error && "border-red-200 bg-red-50/30"
      )}>
        <div className="flex items-center gap-4">
          <Clock className="w-5 h-5 text-slate-400" />
          
          {/* Hours Column */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={incrementHours} className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronUp className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-2xl font-bold text-slate-800 w-10 text-center tabular-nums">
              {hours.toString().padStart(2, '0')}
            </span>
            <button type="button" onClick={decrementHours} className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronDown className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <span className="text-2xl font-bold text-slate-400 mb-1">:</span>

          {/* Minutes Column */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={incrementMinutes} className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronUp className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-2xl font-bold text-slate-800 w-10 text-center tabular-nums">
              {minutes.toString().padStart(2, '0')}
            </span>
            <button type="button" onClick={decrementMinutes} className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronDown className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* AM/PM Toggle */}
        <Button 
          type="button" 
          variant="outline" 
          className="h-12 w-16 text-lg font-bold border-2 border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm"
          onClick={toggleAmpm}
        >
          {ampm}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-1 text-sm font-medium text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
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

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  'Done': 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
};

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', searchQuery],
    queryFn: () => api.appointments.list({ 
      date: undefined
    }),
  });
  const appointments = appointmentsData?.appointments || [];
  const totalAppointments = appointmentsData?.total || 0;

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => api.appointments.create(data),
    onMutate: async (newAppointment) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments', searchQuery]);
      
      const optimisticAppointment = {
        ...newAppointment,
        _id: 'temp-' + Date.now(),
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['appointments', searchQuery], (old: any) => ({
        ...old,
        appointments: [optimisticAppointment, ...(old?.appointments || [])]
      }));

      return { previousAppointments };
    },
    onError: (err, newAppointment, context: any) => {
      queryClient.setQueryData(['appointments', searchQuery], context.previousAppointments);
      toast({ title: 'Failed to book appointment', variant: 'destructive' });
    },
    onSuccess: () => {
      setShowForm(false);
      setFormErrors({});
      toast({ title: 'Appointment booked successfully' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => api.appointments.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments', searchQuery]);
      
      queryClient.setQueryData(['appointments', searchQuery], (old: any) => ({
        ...old,
        appointments: old?.appointments?.filter((a: any) => a._id !== id)
      }));

      return { previousAppointments };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['appointments', searchQuery], context.previousAppointments);
      toast({ title: 'Failed to delete appointment', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Appointment deleted' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.appointments.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments', searchQuery]);
      
      queryClient.setQueryData(['appointments', searchQuery], (old: any) => ({
        ...old,
        appointments: old?.appointments?.map((a: any) => a._id === id ? { ...a, status } : a)
      }));

      return { previousAppointments };
    },
    onError: (err, { id, status }, context: any) => {
      queryClient.setQueryData(['appointments', searchQuery], context.previousAppointments);
    },
    onSuccess: () => {
      toast({ title: 'Status updated' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const phone = (formData.get('customerPhone') as string) || '';
    const email = (formData.get('customerEmail') as string) || '';
    const selectedDate = (formData.get('date') as string) || '';
    const errors: Record<string, string> = {};

    if (!validatePhone(phone)) {
      errors.customerPhone = 'Phone must be 10 digits';
    }
    if (email && !validateEmail(email)) {
      errors.customerEmail = 'Invalid email address';
    }

    // Validate that appointment time is not in the past
    if (selectedDate && time) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      
      if (selectedDate === todayString) {
        const [hours, minutes] = time.split(':');
        const appointmentTime = new Date();
        appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (appointmentTime <= today) {
          errors.time = 'Cannot book appointments for past times. Please select a future time.';
        }
      }
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
      date: selectedDate,
      time: time,
      notes: formData.get('notes') as string || undefined,
      status: 'Scheduled'
    });
    
    form.reset();
    setTime('09:00');
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

  return (
    <div className="space-y-6">
      {/* Header and View Controls */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="flex items-center gap-2"
              data-testid="button-view-card"
            >
              <Grid3X3 className="w-4 h-4" />
              Card
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="mb-6"
            data-testid="button-add-appointment"
          >
            Book Appointment
          </Button>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      placeholder="John Doe"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      data-testid="input-phone"
                      className={formErrors.customerPhone ? 'border-red-500' : ''}
                    />
                    {formErrors.customerPhone && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.customerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email (Optional)</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      data-testid="input-email"
                      className={formErrors.customerEmail ? 'border-red-500' : ''}
                    />
                    {formErrors.customerEmail && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.customerEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Vehicle and Service Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleInfo">Vehicle Info *</Label>
                    <Input
                      id="vehicleInfo"
                      name="vehicleInfo"
                      placeholder="e.g., Toyota Fortuner White"
                      required
                      data-testid="input-vehicle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Input
                      id="serviceType"
                      name="serviceType"
                      placeholder="e.g., PPF, Full Service, Detailing"
                      required
                      data-testid="input-service"
                    />
                  </div>
                </div>

                {/* Row 4: Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      data-testid="input-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <TimePicker 
                      value={time} 
                      onChange={setTime} 
                      error={formErrors.time}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional information..."
                    className="resize-none"
                    data-testid="input-notes"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createAppointmentMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointments List/Grid */}
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
                className="hover-elevate border-slate-200 shadow-sm overflow-hidden"
                data-testid={`appointment-card-${appt._id}`}
              >
                <CardContent className="p-0">
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-bold text-base text-slate-900 truncate">
                          {appt.customerName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={cn(
                              "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0", 
                              STATUS_COLORS[appt.status]
                            )}
                          >
                            {appt.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-900">
                          {format(new Date(appt.date), 'MMM dd')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {appt.time}
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Phone</span>
                        <p className="text-xs font-medium text-slate-700">{appt.customerPhone}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Vehicle</span>
                        <p className="text-xs font-medium text-slate-700 truncate">{appt.vehicleInfo}</p>
                      </div>
                      <div className="space-y-0.5 col-span-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Service</span>
                        <p className="text-xs font-medium text-slate-700 truncate">{appt.serviceType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border-t border-slate-100">
                    {appt.status === 'Scheduled' && (
                      <Button
                        size="sm"
                        className="flex-1 font-bold text-[10px] h-7"
                        onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Done' })}
                        data-testid={`button-done-${appt._id}`}
                      >
                        Mark Done
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-destructive border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => setDeleteId(appt._id)}
                      data-testid={`button-delete-${appt._id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredAppointments.map((appt: any) => (
              <Card
                key={appt._id}
                className="hover-elevate border-slate-200 shadow-sm overflow-hidden"
                data-testid={`appointment-row-${appt._id}`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{appt.customerName}</h3>
                        <Badge 
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5", 
                            STATUS_COLORS[appt.status]
                          )}
                        >
                          {appt.status}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-500 ml-auto md:ml-0">
                          {format(new Date(appt.date), 'MMM dd, yyyy')} at {appt.time}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Phone</span>
                          <p className="text-sm font-medium text-slate-700">{appt.customerPhone}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Vehicle</span>
                          <p className="text-sm font-medium text-slate-700 truncate">{appt.vehicleInfo}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Service</span>
                          <p className="text-sm font-medium text-slate-700 truncate">{appt.serviceType}</p>
                        </div>
                        {appt.customerEmail && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Email</span>
                            <p className="text-sm font-medium text-slate-700 truncate">{appt.customerEmail}</p>
                          </div>
                        )}
                      </div>
                      
                      {appt.notes && (
                        <p className="text-xs text-slate-500 italic mt-3 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                          Note: {appt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {appt.status === 'Scheduled' && (
                        <Button
                          size="sm"
                          className="font-bold text-xs h-8 px-4"
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Done' })}
                          data-testid={`button-done-${appt._id}`}
                        >
                          Mark Done
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-destructive border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={() => deleteAppointmentMutation.mutate(appt._id)}
                        data-testid={`button-delete-${appt._id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) {
                  deleteAppointmentMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
