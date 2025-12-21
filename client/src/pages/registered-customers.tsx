import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Mail, MapPin, Car, Users, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

export default function RegisteredCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const districts = new Set<string>();
    const states = new Set<string>();

    customers.forEach((customer: any) => {
      if (customer.city) cities.add(customer.city);
      if (customer.district) districts.add(customer.district);
      if (customer.state) states.add(customer.state);
    });

    return {
      cities: Array.from(cities).sort(),
      districts: Array.from(districts).sort(),
      states: Array.from(states).sort(),
    };
  }, [customers]);

  const filteredCustomers = customers.filter((customer: any) => {
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = customer.name?.toLowerCase().includes(query);
      const emailMatch = customer.email?.toLowerCase().includes(query);
      const phoneMatch = customer.phone?.includes(query);
      const referenceMatch = customer.customerId?.toLowerCase().includes(query);
      const vehicleMatch = customer.vehicles?.some((v: any) => 
        v.make?.toLowerCase().includes(query) ||
        v.model?.toLowerCase().includes(query) ||
        v.plateNumber?.toLowerCase().includes(query) ||
        v.vin?.toLowerCase().includes(query)
      );
      const chassisMatch = customer.vehicles?.some((v: any) => 
        v.vin?.toLowerCase().includes(query)
      );

      if (!nameMatch && !emailMatch && !phoneMatch && !referenceMatch && !vehicleMatch && !chassisMatch) {
        return false;
      }
    }

    // Apply location filters
    if (selectedCity !== "all" && customer.city !== selectedCity) {
      return false;
    }
    if (selectedDistrict !== "all" && customer.district !== selectedDistrict) {
      return false;
    }
    if (selectedState !== "all" && customer.state !== selectedState) {
      return false;
    }

    // Apply status filter
    if (selectedStatus !== "all" && customer.status !== selectedStatus) {
      return false;
    }

    // Apply date range filter
    const customerDate = customer.createdAt ? new Date(customer.createdAt) : null;
    
    if (dateRange !== "all" && customerDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateRange === "today") {
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        if (customerDate < today || customerDate > endOfDay) return false;
      } else if (dateRange === "week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (customerDate < startOfWeek) return false;
      } else if (dateRange === "month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (customerDate < startOfMonth) return false;
      } else if (dateRange === "custom") {
        if (fromDate) {
          const from = new Date(fromDate);
          if (customerDate < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (customerDate > to) return false;
        }
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedDistrict("all");
    setSelectedState("all");
    setSelectedStatus("all");
    setDateRange("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>
        <p className="text-sm text-slate-600">Filter customers by various criteria</p>
      </div>

      {/* Comprehensive Search & Filter Section */}
      <div className="space-y-4">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, mobile, email, reference code, vehicle number, or chassis number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm"
            data-testid="input-search-comprehensive"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-city">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {filterOptions.cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-district">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {filterOptions.districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-state">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {filterOptions.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm" data-testid="select-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Inquired">Inquired</SelectItem>
              <SelectItem value="Working">Working</SelectItem>
              <SelectItem value="Waiting">Waiting</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort & Date Filters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Sort & Date Filters</h3>
          </div>
          <div className="flex flex-col gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg shadow-sm w-full md:w-64" data-testid="select-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="pl-10 h-11 w-full bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm"
                    placeholder="From Date"
                    data-testid="input-from-date"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="pl-10 h-11 w-full bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm"
                    placeholder="To Date"
                    data-testid="input-to-date"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="text-slate-700 hover:text-slate-900"
          data-testid="button-clear-filters"
        >
          Clear All Filters
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse mb-4 mx-auto" />
            <p className="text-slate-600 font-medium">Loading customers...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
          <div className="w-16 h-16 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">No customers found</p>
          <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer: any) => (
            <Link key={customer._id} href={`/customer-details/${customer._id}`}>
              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group" data-testid={`customer-card-${customer._id}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors">{customer.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {customer.customerId}</p>
                      <p className="text-sm text-slate-600 mt-1">{customer.phone}</p>
                    </div>
                    {customer.vehicles && customer.vehicles.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{customer.vehicles.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate text-slate-700">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-700">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {customer.vehicles && customer.vehicles.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 font-medium">
                        <Car className="w-4 h-4" />
                        Vehicles
                      </div>
                      <div className="space-y-3">
                        {customer.vehicles.slice(0, 2).map((vehicle: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            {vehicle.image && (
                              <div className="relative w-full h-32 bg-slate-200 rounded-lg overflow-hidden border border-slate-300">
                                <img 
                                  src={vehicle.image} 
                                  alt={`${vehicle.make} ${vehicle.model}`}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-vehicle-${idx}`}
                                />
                              </div>
                            )}
                            <div className="px-2.5 py-1.5 bg-slate-100 rounded border border-slate-200 text-xs font-medium text-slate-900">
                              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''} - {vehicle.plateNumber}
                            </div>
                          </div>
                        ))}
                        {customer.vehicles.length > 2 && (
                          <div className="px-2.5 py-1.5 bg-slate-100 rounded border border-slate-200 text-xs font-medium text-slate-600">
                            +{customer.vehicles.length - 2} more vehicle(s)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
