import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, ArrowUp, ArrowDown, Search, Filter, Plus, Info, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const PPF_ITEMS = [
  { name: 'Elite', category: 'Elite' },
  { name: 'Garware Plus', category: 'Garware Plus' },
  { name: 'Garware Premium', category: 'Garware Premium' },
  { name: 'Garware Matt', category: 'Garware Matt' }
];

const UNITS = ['sheets', 'Square Feet'];
const MIN_STOCK = 5;
const DEFAULT_UNIT = 'Square Feet';

const CATEGORY_COLORS: Record<string, string> = {
  'Elite': 'bg-blue-500/20 text-blue-400',
  'Garware Plus': 'bg-purple-500/20 text-purple-400',
  'Garware Premium': 'bg-orange-500/20 text-orange-400',
  'Garware Matt': 'bg-green-500/20 text-green-400'
};

export default function Inventory() {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [rollDialogOpen, setRollDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustAmount, setAdjustAmount] = useState('1');
  const [adjustUnit, setAdjustUnit] = useState(DEFAULT_UNIT);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [rollName, setRollName] = useState('');
  const [rollQuantity, setRollQuantity] = useState('');
  const [expandedRolls, setExpandedRolls] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api.inventory.adjust(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustDialogOpen(false);
      setAdjustAmount('1');
      setAdjustUnit(DEFAULT_UNIT);
      toast({ title: `Stock adjusted successfully` });
    },
    onError: () => {
      toast({ title: 'Failed to adjust stock', variant: 'destructive' });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.inventory.create(data),
    onSuccess: (newItem: any) => {
      // After creating, adjust the stock
      adjustMutation.mutate({
        id: newItem._id,
        quantity: adjustType === 'in' ? parseInt(adjustAmount, 10) : -parseInt(adjustAmount, 10)
      });
    },
    onError: () => {
      toast({ title: 'Failed to create inventory item', variant: 'destructive' });
    }
  });

  const addRollMutation = useMutation({
    mutationFn: (data: { id: string; roll: any }) => api.inventory.addRoll(data.id, data.roll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setRollDialogOpen(false);
      setRollName('');
      setRollQuantity('');
      toast({ title: 'Roll added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add roll', variant: 'destructive' });
    }
  });

  const deleteRollMutation = useMutation({
    mutationFn: ({ id, rollId }: { id: string; rollId: string }) => api.inventory.deleteRoll(id, rollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Roll deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete roll', variant: 'destructive' });
    }
  });

  const handleAdjust = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const amount = parseInt(adjustAmount, 10);
    if (amount <= 0) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }
    
    // If item doesn't have an ID yet, create it first
    if (!selectedItem._id) {
      createMutation.mutate({
        name: selectedItem.name,
        category: selectedItem.category,
        quantity: 0,
        unit: adjustUnit,
        minStock: MIN_STOCK
      });
      return;
    }
    
    // Update the item with the new unit before adjusting
    if (selectedItem.unit !== adjustUnit) {
      // Update unit on the server
      api.inventory.update(selectedItem._id, { unit: adjustUnit }).then(() => {
        adjustMutation.mutate({
          id: selectedItem._id,
          quantity: adjustType === 'in' ? amount : -amount
        });
      }).catch(() => {
        toast({ title: 'Failed to update unit', variant: 'destructive' });
      });
    } else {
      adjustMutation.mutate({
        id: selectedItem._id,
        quantity: adjustType === 'in' ? amount : -amount
      });
    }
  };

  const isLowStock = (item: any) => (item.rolls?.length || 0) <= 1;
  
  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let items = PPF_ITEMS.map((ppfItem) => {
      const item = inventory.find((inv: any) => inv.category === ppfItem.category);
      return item || { name: ppfItem.name, category: ppfItem.category, quantity: 0, unit: DEFAULT_UNIT, minStock: MIN_STOCK, _id: null };
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => 
        item.category.toLowerCase().includes(query) || 
        item.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      items = items.filter((item) => item.category === filterCategory);
    }

    // Apply sorting
    if (sortBy === 'quantity') {
      items.sort((a, b) => (b.rolls?.length || 0) - (a.rolls?.length || 0));
    } else {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    return items;
  }, [inventory, searchQuery, filterCategory, sortBy]);

  const lowStockItems = filteredAndSortedItems.filter(isLowStock);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">PPF Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage stock for PPF products</p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-inventory"
            />
          </div>

          {/* Sort Button */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'quantity')}>
            <SelectTrigger className="w-40" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="quantity">Sort by Quantity</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Button */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40" data-testid="select-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Elite">Elite</SelectItem>
              <SelectItem value="Garware Plus">Garware Plus</SelectItem>
              <SelectItem value="Garware Premium">Garware Premium</SelectItem>
              <SelectItem value="Garware Matt">Garware Matt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">{lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} with low stock (1 or fewer rolls)!</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No products match your search or filters</div>
        ) : (
          filteredAndSortedItems.map((displayItem) => {
            const displayName = displayItem.category;
            
            return (
              <div key={displayItem.category}>
                <Card 
                  className={cn(
                    "card-modern border border-red-300",
                    isLowStock(displayItem) && "border-red-400 shadow-md"
                  )}
                  data-testid={`inventory-card-${displayItem.category}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{displayName}</CardTitle>
                        <Badge className={cn("mt-1", CATEGORY_COLORS[displayItem.category])}>
                          {displayItem.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-display font-bold">
                        {displayItem.rolls?.length || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">rolls</span>
                    </div>
                    
                    {isLowStock(displayItem) && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low stock ({(displayItem.rolls?.length || 0)} roll{(displayItem.rolls?.length || 0) !== 1 ? 's' : ''})
                      </p>
                    )}

                    {(!displayItem._id || (displayItem.rolls?.length || 0) === 0) && (
                      <p className="text-xs text-muted-foreground">
                        No rolls added yet
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedItem(displayItem);
                          setRollDialogOpen(true);
                        }}
                        data-testid={`button-stock-${displayItem.category}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Stock
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setExpandedRolls(expandedRolls === displayItem._id ? '' : displayItem._id)}
                        disabled={!displayItem.rolls || displayItem.rolls.length === 0}
                        data-testid={`button-toggle-rolls-${displayItem.category}`}
                      >
                        {expandedRolls === displayItem._id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {expandedRolls === displayItem._id && displayItem.rolls && displayItem.rolls.length > 0 && (
                  <div className="mt-2 bg-muted/30 border rounded-lg overflow-hidden transition-all animate-in fade-in slide-in-from-top-1">
                    <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        Roll Details
                      </h4>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {displayItem.rolls.length} Rolls
                      </Badge>
                    </div>
                    <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                      {displayItem.rolls.map((roll: any) => (
                        <div 
                          key={roll._id} 
                          className="group relative p-3 bg-card border rounded-md hover:border-primary/50 transition-colors shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{roll.name}</p>
                                <Badge 
                                  variant={roll.status === 'Finished' ? 'outline' : 'secondary'} 
                                  className={cn(
                                    "text-[10px] h-4 px-1.5",
                                    roll.status !== 'Finished' && "bg-green-500/10 text-green-600 border-green-200"
                                  )}
                                >
                                  {roll.status === 'Finished' ? 'Finished' : 'Available'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span className="opacity-70 text-[10px] uppercase tracking-wider font-semibold">Total:</span>
                                  <span className="text-foreground font-medium">{roll.squareFeet?.toFixed(1)}</span>
                                  <span className="text-[9px]">sqft</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="opacity-70 text-[10px] uppercase tracking-wider font-semibold">Left:</span>
                                  <span className={cn(
                                    "font-bold",
                                    (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "text-destructive" : "text-primary"
                                  )}>
                                    {roll.remaining_sqft?.toFixed(1)}
                                  </span>
                                  <span className="text-[9px]">sqft</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteRollMutation.mutate({ id: displayItem._id, rollId: roll._id })}
                              data-testid={`button-delete-roll-${roll._id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {/* Progress Bar for remaining stock */}
                          <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "bg-destructive" : "bg-primary"
                              )}
                              style={{ width: `${Math.min(100, (roll.remaining_sqft / (roll.squareFeet || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={rollDialogOpen} onOpenChange={setRollDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Roll to {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!rollName || !rollQuantity) {
              toast({ title: 'Fill all fields', variant: 'destructive' });
              return;
            }
            const quantity = parseFloat(rollQuantity);
            addRollMutation.mutate({
              id: selectedItem._id,
              roll: {
                name: rollName,
                squareFeet: quantity,
                meters: 0,
                unit: 'Square Feet'
              }
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input 
                placeholder="e.g., ELITE-ROLL-1" 
                value={rollName}
                onChange={(e) => setRollName(e.target.value)}
                data-testid="input-roll-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity (Square Feet)</Label>
              <Input 
                type="number" 
                step="0.1" 
                placeholder="0" 
                value={rollQuantity}
                onChange={(e) => setRollQuantity(e.target.value)}
                data-testid="input-roll-sqft"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={addRollMutation.isPending}
              data-testid="button-save-roll"
            >
              {addRollMutation.isPending ? 'Adding...' : 'Add Roll'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
