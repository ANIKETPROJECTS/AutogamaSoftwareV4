import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, Mail, Search, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const PPF_CATEGORIES = {
  Elite: {
    'Small Cars': {
      'TPU 5 Years Gloss': 55000,
      'TPU 5 Years Matt': 60000,
      'TPU 7 Years Gloss': 80000,
      'TPU 10 Years Gloss': 95000,
    },
    'Hatchback / Small Sedan': {
      'TPU 5 Years Gloss': 60000,
      'TPU 5 Years Matt': 70000,
      'TPU 7 Years Gloss': 85000,
      'TPU 10 Years Gloss': 105000,
    },
    'Mid-size Sedan / Compact SUV / MUV': {
      'TPU 5 Years Gloss': 70000,
      'TPU 5 Years Matt': 75000,
      'TPU 7 Years Gloss': 90000,
      'TPU 10 Years Gloss': 112000,
    },
    'SUV / MPV': {
      'TPU 5 Years Gloss': 80000,
      'TPU 5 Years Matt': 85000,
      'TPU 7 Years Gloss': 95000,
      'TPU 10 Years Gloss': 120000,
    },
  },
  'Garware Plus': {
    'Small Cars': { 'TPU 5 Years Gloss': 62000 },
    'Hatchback / Small Sedan': { 'TPU 5 Years Gloss': 65000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 5 Years Gloss': 70000 },
    'SUV / MPV': { 'TPU 5 Years Gloss': 85000 },
  },
  'Garware Premium': {
    'Small Cars': { 'TPU 8 Years Gloss': 80000 },
    'Hatchback / Small Sedan': { 'TPU 8 Years Gloss': 85000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 8 Years Gloss': 90000 },
    'SUV / MPV': { 'TPU 8 Years Gloss': 95000 },
  },
  'Garware Matt': {
    'Small Cars': { 'TPU 5 Years Matt': 105000 },
    'Hatchback / Small Sedan': { 'TPU 5 Years Matt': 110000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 5 Years Matt': 115000 },
    'SUV / MPV': { 'TPU 5 Years Matt': 120000 },
  },
};

const OTHER_SERVICES = {
  'Foam Washing': {
    'Small Cars': 400,
    'Hatchback / Small Sedan': 500,
    'Mid-size Sedan / Compact SUV / MUV': 600,
    'SUV / MPV': 700,
  },
  'Premium Washing': {
    'Small Cars': 600,
    'Hatchback / Small Sedan': 700,
    'Mid-size Sedan / Compact SUV / MUV': 800,
    'SUV / MPV': 900,
  },
  'Interior Cleaning': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4500,
  },
  'Interior Steam Cleaning': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 4000,
    'Mid-size Sedan / Compact SUV / MUV': 4500,
    'SUV / MPV': 5500,
  },
  'Leather Treatment': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7000,
  },
  'Detailing': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 6500,
    'Mid-size Sedan / Compact SUV / MUV': 7000,
    'SUV / MPV': 9000,
  },
  'Paint Sealant Coating (Teflon)': {
    'Small Cars': 6500,
    'Hatchback / Small Sedan': 8500,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 11500,
  },
  'Ceramic Coating – 9H': {
    'Small Cars': 11000,
    'Hatchback / Small Sedan': 12500,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Ceramic Coating – MAFRA': {
    'Small Cars': 12500,
    'Hatchback / Small Sedan': 15000,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
  'Ceramic Coating – MENZA PRO': {
    'Small Cars': 15000,
    'Hatchback / Small Sedan': 18000,
    'Mid-size Sedan / Compact SUV / MUV': 21000,
    'SUV / MPV': 24000,
  },
  'Ceramic Coating – KOCH CHEMIE': {
    'Small Cars': 18000,
    'Hatchback / Small Sedan': 22000,
    'Mid-size Sedan / Compact SUV / MUV': 25000,
    'SUV / MPV': 28000,
  },
  'Corrosion Treatment': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 5000,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7500,
  },
  'Windshield Coating': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4000,
  },
  'Windshield Coating All Glasses': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 6500,
  },
  'Sun Control Film – Economy': {
    'Small Cars': 5200,
    'Hatchback / Small Sedan': 6000,
    'Mid-size Sedan / Compact SUV / MUV': 6500,
    'SUV / MPV': 8400,
  },
  'Sun Control Film – Standard': {
    'Small Cars': 7500,
    'Hatchback / Small Sedan': 8300,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 12500,
  },
  'Sun Control Film – Premium': {
    'Small Cars': 11500,
    'Hatchback / Small Sedan': 13000,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Sun Control Film – Ceramic': {
    'Small Cars': 13500,
    'Hatchback / Small Sedan': 15500,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
};

const CAR_TYPES = ['Small Cars', 'Hatchback / Small Sedan', 'Mid-size Sedan / Compact SUV / MUV', 'SUV / MPV'];

const ALL_SERVICES = [
  'PPF - Elite',
  'PPF - Garware Plus',
  'PPF - Garware Premium',
  'PPF - Garware Matt',
  ...Object.keys(OTHER_SERVICES),
];

function getPriceForService(service: string, carType: string): number | null {
  if (service.startsWith('PPF')) {
    const ppfType = service.replace('PPF - ', '');
    const ppfData = PPF_CATEGORIES[ppfType as keyof typeof PPF_CATEGORIES];
    if (ppfData && ppfData[carType as keyof typeof ppfData]) {
      const variants = ppfData[carType as keyof typeof ppfData];
      const prices = Object.values(variants);
      return prices.length > 0 ? (prices[0] as number) : null;
    }
  } else {
    const serviceData = OTHER_SERVICES[service as keyof typeof OTHER_SERVICES];
    if (serviceData && serviceData[carType as keyof typeof serviceData]) {
      return serviceData[carType as keyof typeof serviceData];
    }
  }
  return null;
}

export default function PriceInquiries() {
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedCarType, setSelectedCarType] = useState('');
  const [autoPrice, setAutoPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/price-inquiries'],
    queryFn: api.priceInquiries.list,
  });

  const createMutation = useMutation({
    mutationFn: api.priceInquiries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      setShowForm(false);
      setSelectedService('');
      setSelectedCarType('');
      setAutoPrice(null);
      toast({ title: 'Price inquiry saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save inquiry', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.priceInquiries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Inquiry deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete inquiry', variant: 'destructive' });
    }
  });

  const handleServiceChange = (service: string) => {
    setSelectedService(service);
    setSelectedCarType('');
    setAutoPrice(null);
  };

  const handleCarTypeChange = (carType: string) => {
    setSelectedCarType(carType);
    const price = getPriceForService(selectedService, carType);
    setAutoPrice(price);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const newErrors: { phone?: string; email?: string } = {};

    if (!validatePhone(phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedService || !selectedCarType || autoPrice === null) {
      toast({ title: 'Please select service and car type', variant: 'destructive' });
      return;
    }

    setErrors({});
    createMutation.mutate({
      name: formData.get('name'),
      phone: phone,
      email: email || '',
      service: `${selectedService} - ${selectedCarType}`,
      priceOffered: autoPrice,
      priceStated: parseFloat(formData.get('priceStated') as string),
      notes: formData.get('notes') || ''
    });
    
    form.reset();
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry: any) => {
      const matchesSearch = 
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.phone.includes(searchQuery) ||
        inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterService === 'all' || !filterService || inquiry.service.includes(filterService);
      
      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchQuery, filterService]);

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div>
        <h1 className="text-3xl font-bold mb-6">Inquiry</h1>
        
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="mb-6"
            data-testid="button-add-inquiry"
          >
            Add Inquiry
          </Button>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      data-testid="input-phone"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Row 2: Email and Service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      data-testid="input-email"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="service">Service Type</Label>
                    <Select value={selectedService} onValueChange={handleServiceChange}>
                      <SelectTrigger id="service" data-testid="select-service">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_SERVICES.map((service) => (
                          <SelectItem key={service} value={service} data-testid={`option-service-${service}`}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Car Type and Auto Price */}
                {selectedService && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carType">Car Type</Label>
                      <Select value={selectedCarType} onValueChange={handleCarTypeChange}>
                        <SelectTrigger id="carType" data-testid="select-car-type">
                          <SelectValue placeholder="Select car type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAR_TYPES.map((carType) => (
                            <SelectItem key={carType} value={carType} data-testid={`option-car-${carType}`}>
                              {carType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priceOffered">Our Price (Auto) (₹)</Label>
                      <Input
                        id="priceOffered"
                        name="priceOffered"
                        type="number"
                        value={autoPrice || 0}
                        disabled
                        data-testid="input-price-offered"
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Customer Price and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceStated">Price Stated by Customer (₹)</Label>
                    <Input
                      id="priceStated"
                      name="priceStated"
                      type="number"
                      min="0"
                      placeholder="0"
                      required
                      data-testid="input-price-stated"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Any additional notes..."
                      data-testid="input-notes"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-inquiry"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Inquiry'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedService('');
                      setSelectedCarType('');
                      setAutoPrice(null);
                    }}
                    data-testid="button-cancel-inquiry"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Inquiry List</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
            <Input
              placeholder="Search by name, phone, or email..."
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
          
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger data-testid="select-filter">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {ALL_SERVICES.map((service) => (
                <SelectItem key={service} value={service} data-testid={`filter-option-${service}`}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inquiries List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredInquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-secondary">
            {inquiries.length === 0 ? 'No inquiries yet. Start by adding one!' : 'No inquiries match your search or filter.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry: any) => {
            const priceDifference = inquiry.priceOffered - inquiry.priceStated;
            const percentageDifference = ((priceDifference / inquiry.priceOffered) * 100).toFixed(1);

            return (
              <Card key={inquiry._id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-name-${inquiry._id}`}>
                        {inquiry.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-secondary">
                        <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-phone-${inquiry._id}`}>
                          <Phone className="w-4 h-4" />
                          {inquiry.phone}
                        </a>
                        {inquiry.email && (
                          <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-email-${inquiry._id}`}>
                            <Mail className="w-4 h-4" />
                            {inquiry.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(inquiry._id.toString ? inquiry._id.toString() : inquiry._id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${inquiry._id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary">Service</p>
                      <p className="font-semibold" data-testid={`text-service-${inquiry._id}`}>{inquiry.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">Date</p>
                      <p className="font-semibold" data-testid={`text-date-${inquiry._id}`}>
                        {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-secondary/10 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-secondary mb-1">Our Price</p>
                      <p className="text-lg font-bold text-primary" data-testid={`text-offered-${inquiry._id}`}>
                        ₹{inquiry.priceOffered.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Customer Price</p>
                      <p className="text-lg font-bold text-destructive" data-testid={`text-stated-${inquiry._id}`}>
                        ₹{inquiry.priceStated.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Difference</p>
                      <p className={`text-lg font-bold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-difference-${inquiry._id}`}>
                        {priceDifference >= 0 ? '+' : ''}₹{priceDifference.toLocaleString()}
                        <span className="text-sm ml-1">({percentageDifference}%)</span>
                      </p>
                    </div>
                  </div>

                  {inquiry.notes && (
                    <div>
                      <p className="text-sm text-secondary mb-1">Notes</p>
                      <p className="text-sm" data-testid={`text-notes-${inquiry._id}`}>{inquiry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
