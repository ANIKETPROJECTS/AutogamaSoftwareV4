import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Car, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Friend/Family",
  "Advertisement",
  "Walk-in",
  "Other",
];

const CUSTOMER_STATUSES = [
  { value: "Inquired", label: "Inquired" },
  { value: "Working", label: "Working" },
  { value: "Waiting", label: "Waiting" },
  { value: "Completed", label: "Completed" },
];

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Luxury",
  "Sports",
  "Other",
];

const PPF_CATEGORIES = {
  Elite: {
    "Small Cars": {
      "TPU 5 Years Gloss": 55000,
      "TPU 5 Years Matt": 60000,
      "TPU 7 Years Gloss": 80000,
      "TPU 10 Years Gloss": 95000,
    },
    "Hatchback / Small Sedan": {
      "TPU 5 Years Gloss": 60000,
      "TPU 5 Years Matt": 70000,
      "TPU 7 Years Gloss": 85000,
      "TPU 10 Years Gloss": 105000,
    },
    "Mid-size Sedan / Compact SUV / MUV": {
      "TPU 5 Years Gloss": 70000,
      "TPU 5 Years Matt": 75000,
      "TPU 7 Years Gloss": 90000,
      "TPU 10 Years Gloss": 112000,
    },
    "SUV / MPV": {
      "TPU 5 Years Gloss": 80000,
      "TPU 5 Years Matt": 85000,
      "TPU 7 Years Gloss": 95000,
      "TPU 10 Years Gloss": 120000,
    },
  },
  "Garware Plus": {
    "Small Cars": { "TPU 5 Years Gloss": 62000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Gloss": 65000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Gloss": 70000 },
    "SUV / MPV": { "TPU 5 Years Gloss": 85000 },
  },
  "Garware Premium": {
    "Small Cars": { "TPU 8 Years Gloss": 80000 },
    "Hatchback / Small Sedan": { "TPU 8 Years Gloss": 85000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 8 Years Gloss": 90000 },
    "SUV / MPV": { "TPU 8 Years Gloss": 95000 },
  },
  "Garware Matt": {
    "Small Cars": { "TPU 5 Years Matt": 105000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Matt": 110000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Matt": 115000 },
    "SUV / MPV": { "TPU 5 Years Matt": 120000 },
  },
};

const OTHER_SERVICES = {
  "Foam Washing": {
    "Small Cars": 400,
    "Hatchback / Small Sedan": 500,
    "Mid-size Sedan / Compact SUV / MUV": 600,
    "SUV / MPV": 700,
  },
  "Premium Washing": {
    "Small Cars": 600,
    "Hatchback / Small Sedan": 700,
    "Mid-size Sedan / Compact SUV / MUV": 800,
    "SUV / MPV": 900,
  },
  "Interior Cleaning": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4500,
  },
  "Interior Steam Cleaning": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 4000,
    "Mid-size Sedan / Compact SUV / MUV": 4500,
    "SUV / MPV": 5500,
  },
  "Leather Treatment": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7000,
  },
  Detailing: {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 6500,
    "Mid-size Sedan / Compact SUV / MUV": 7000,
    "SUV / MPV": 9000,
  },
  "Paint Sealant Coating (Teflon)": {
    "Small Cars": 6500,
    "Hatchback / Small Sedan": 8500,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 11500,
  },
  "Ceramic Coating – 9H": {
    "Small Cars": 11000,
    "Hatchback / Small Sedan": 12500,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Ceramic Coating – MAFRA": {
    "Small Cars": 12500,
    "Hatchback / Small Sedan": 15000,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
  "Ceramic Coating – MENZA PRO": {
    "Small Cars": 15000,
    "Hatchback / Small Sedan": 18000,
    "Mid-size Sedan / Compact SUV / MUV": 21000,
    "SUV / MPV": 24000,
  },
  "Ceramic Coating – KOCH CHEMIE": {
    "Small Cars": 18000,
    "Hatchback / Small Sedan": 22000,
    "Mid-size Sedan / Compact SUV / MUV": 25000,
    "SUV / MPV": 28000,
  },
  "Corrosion Treatment": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 5000,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7500,
  },
  "Windshield Coating": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4000,
  },
  "Windshield Coating All Glasses": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 6500,
  },
  "Sun Control Film – Economy": {
    "Small Cars": 5200,
    "Hatchback / Small Sedan": 6000,
    "Mid-size Sedan / Compact SUV / MUV": 6500,
    "SUV / MPV": 8400,
  },
  "Sun Control Film – Standard": {
    "Small Cars": 7500,
    "Hatchback / Small Sedan": 8300,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 12500,
  },
  "Sun Control Film – Premium": {
    "Small Cars": 11500,
    "Hatchback / Small Sedan": 13000,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Sun Control Film – Ceramic": {
    "Small Cars": 13500,
    "Hatchback / Small Sedan": 15500,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function CustomerRegistration() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});

  // Customer info
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "Maharashtra",
    referralSource: "",
    status: "Inquired",
    ppfCategory: "",
    ppfVehicleType: "",
    ppfWarranty: "",
    ppfPrice: 0,
    serviceName: "",
    serviceVehicleType: "",
    servicePrice: 0,
  });

  // Vehicle info
  const [vehicleData, setVehicleData] = useState({
    make: "",
    model: "",
    year: "",
    plateNumber: "",
    chassisNumber: "",
    color: "",
    vehicleType: "",
  });

  const createCustomerMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer registered successfully!" });
      setLocation("/funnel");
    },
    onError: () => {
      toast({ title: "Failed to register customer", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const selectedService = customerData.ppfCategory 
      ? `${customerData.ppfCategory} - ${customerData.ppfWarranty}`
      : customerData.serviceName;
    
    // Calculate total service cost (PPF + Other Services if both selected)
    const totalServiceCost = (customerData.ppfPrice || 0) + (customerData.serviceName ? customerData.servicePrice : 0);
    
    createCustomerMutation.mutate({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || undefined,
      address: `${customerData.address}, ${customerData.city}, ${customerData.district}, ${customerData.state}`,
      status: customerData.status,
      service: selectedService || undefined,
      serviceCost: totalServiceCost || 0,
      vehicles: [
        {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          plateNumber: vehicleData.plateNumber,
          color: vehicleData.color,
          vin: vehicleData.chassisNumber,
        },
      ],
    });
  };

  const validateStep1 = () => {
    const newErrors: { phone?: string; email?: string } = {};
    
    if (!validatePhone(customerData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }
    
    if (!validateEmail(customerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const canProceedStep1 = customerData.name && customerData.phone;
  const canProceedStep2 =
    vehicleData.make && vehicleData.model && vehicleData.plateNumber;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <h1
            className="font-display text-xl font-bold tracking-tight"
            data-testid="text-registration-title"
          >
            Customer Registration
          </h1>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card
            className="border-orange-200 dark:border-orange-800"
            data-testid="card-customer-info"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-blue-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    data-testid="input-full-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        phone: e.target.value,
                      });
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="10-digit mobile number"
                    data-testid="input-mobile"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        email: e.target.value,
                      });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="your@email.com (optional)"
                    data-testid="input-email"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label>How did you hear about us?</Label>
                  <Select
                    value={customerData.referralSource}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        referralSource: value,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-referral">
                      <SelectValue placeholder="Select referral source" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Customer Status</Label>
                  <Select
                    value={customerData.status}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PPF & Services in 2 Columns */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PPF Selection - Left Column */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">PPF Services</h3>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={customerData.ppfCategory}
                        onValueChange={(value) =>
                          setCustomerData({
                            ...customerData,
                            ppfCategory: value,
                            ppfVehicleType: "",
                            ppfWarranty: "",
                            ppfPrice: 0,
                          })
                        }
                      >
                        <SelectTrigger data-testid="select-ppf-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(PPF_CATEGORIES).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {customerData.ppfCategory && (
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select
                          value={customerData.ppfVehicleType}
                          onValueChange={(value) =>
                            setCustomerData({
                              ...customerData,
                              ppfVehicleType: value,
                              ppfWarranty: "",
                              ppfPrice: 0,
                            })
                          }
                        >
                          <SelectTrigger data-testid="select-ppf-vehicle">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {customerData.ppfVehicleType && (
                      <div>
                        <Label>Warranty & Price</Label>
                        <Select
                          value={customerData.ppfWarranty}
                          onValueChange={(value) => {
                            const price = PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES][customerData.ppfVehicleType as string][value as string] as number;
                            setCustomerData({
                              ...customerData,
                              ppfWarranty: value,
                              ppfPrice: price,
                            });
                          }}
                        >
                          <SelectTrigger data-testid="select-ppf-warranty">
                            <SelectValue placeholder="Select warranty" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES][customerData.ppfVehicleType as string]).map(([warranty, price]) => (
                              <SelectItem key={warranty} value={warranty}>
                                {warranty} - ₹{(price as number).toLocaleString('en-IN')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Other Services Selection - Right Column */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Other Services</h3>
                    <div>
                      <Label>Service</Label>
                      <Select
                        value={customerData.serviceName}
                        onValueChange={(value) =>
                          setCustomerData({
                            ...customerData,
                            serviceName: value,
                            serviceVehicleType: "",
                            servicePrice: 0,
                          })
                        }
                      >
                        <SelectTrigger data-testid="select-service-name">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto">
                          {Object.keys(OTHER_SERVICES).map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {customerData.serviceName && (
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select
                          value={customerData.serviceVehicleType}
                          onValueChange={(value) => {
                            const serviceData = OTHER_SERVICES[customerData.serviceName as keyof typeof OTHER_SERVICES];
                            const price = serviceData[value as keyof typeof serviceData] as number;
                            setCustomerData({
                              ...customerData,
                              serviceVehicleType: value,
                              servicePrice: price,
                            });
                          }}
                        >
                          <SelectTrigger data-testid="select-service-vehicle">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(OTHER_SERVICES[customerData.serviceName as keyof typeof OTHER_SERVICES]).map(([type, price]) => (
                              <SelectItem key={type} value={type}>
                                {type} - ₹{(price as number).toLocaleString('en-IN')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={customerData.address}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Street address"
                    data-testid="input-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={customerData.city}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, city: e.target.value })
                    }
                    placeholder="City"
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Input
                    value={customerData.district}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        district: e.target.value,
                      })
                    }
                    placeholder="District"
                    data-testid="input-district"
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={customerData.state}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        state: e.target.value,
                      })
                    }
                    placeholder="State"
                    data-testid="input-state"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedStep1}
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-next-step"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Vehicle Details */}
        {step === 2 && (
          <Card
            className="border-orange-200 dark:border-orange-800"
            data-testid="card-vehicle-info"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Vehicle Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your vehicle information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Make *</Label>
                  <Input
                    value={vehicleData.make}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, make: e.target.value })
                    }
                    placeholder="e.g., Toyota, BMW"
                    data-testid="input-vehicle-make"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Model *</Label>
                  <Input
                    value={vehicleData.model}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, model: e.target.value })
                    }
                    placeholder="e.g., Fortuner, 3 Series"
                    data-testid="input-vehicle-model"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={vehicleData.vehicleType}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, vehicleType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-vehicle-type">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year of Manufacture</Label>
                  <Input
                    value={vehicleData.year}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, year: e.target.value })
                    }
                    placeholder="e.g., 2023"
                    data-testid="input-vehicle-year"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Number *</Label>
                  <Input
                    value={vehicleData.plateNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        plateNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., MH02 AB 1234"
                    data-testid="input-plate-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chassis Number</Label>
                  <Input
                    value={vehicleData.chassisNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        chassisNumber: e.target.value,
                      })
                    }
                    placeholder="Vehicle chassis number"
                    data-testid="input-chassis"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={vehicleData.color}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, color: e.target.value })
                    }
                    placeholder="e.g., White, Black"
                    data-testid="input-color"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !canProceedStep2 || createCustomerMutation.isPending
                  }
                  className="bg-green-500 hover:bg-green-600"
                  data-testid="button-submit-registration"
                >
                  {createCustomerMutation.isPending
                    ? "Registering..."
                    : "Complete Registration"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
