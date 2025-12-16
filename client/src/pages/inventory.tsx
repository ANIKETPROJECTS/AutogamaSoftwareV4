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
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['PPF', 'Ceramic', 'Tools', 'Parts', 'Chemicals'];

const CATEGORY_COLORS: Record<string, string> = {
  'PPF': 'bg-blue-500/20 text-blue-400',
  'Ceramic': 'bg-purple-500/20 text-purple-400',
  'Tools': 'bg-gray-500/20 text-gray-400',
  'Parts': 'bg-orange-500/20 text-orange-400',
  'Chemicals': 'bg-green-500/20 text-green-400'
};

export default function Inventory() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: api.inventory.lowStock,
  });

  const createItemMutation = useMutation({
    mutationFn: api.inventory.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDialogOpen(false);
      toast({ title: 'Item added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add item', variant: 'destructive' });
    }
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api.inventory.adjust(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustDialogOpen(false);
      toast({ title: 'Stock adjusted' });
    }
  });

  const handleCreateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    createItemMutation.mutate({
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      quantity: parseInt(formData.get('quantity') as string, 10),
      unit: formData.get('unit') as string,
      minStock: parseInt(formData.get('minStock') as string, 10),
      price: parseInt(formData.get('price') as string, 10)
    });
  };

  const handleAdjust = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const type = formData.get('type') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    
    adjustMutation.mutate({
      id: selectedItem._id,
      quantity: type === 'in' ? amount : -amount
    });
  };

  const filteredInventory = categoryFilter === 'all' 
    ? inventory 
    : inventory.filter((item: any) => item.category === categoryFilter);

  const isLowStock = (item: any) => item.quantity <= item.minStock;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track PPF, ceramic products, and tools</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-item">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" required placeholder="Item name" data-testid="input-item-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Input name="unit" required placeholder="e.g., meters, pcs" data-testid="input-unit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input name="quantity" type="number" step="1" min="0" required placeholder="0" data-testid="input-quantity" />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock *</Label>
                  <Input name="minStock" type="number" step="1" min="0" required placeholder="0" data-testid="input-min-stock" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Price per Unit (₹) *</Label>
                <Input name="price" type="number" step="1" min="0" required placeholder="0" data-testid="input-price" />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createItemMutation.isPending}
                data-testid="button-submit-item"
              >
                {createItemMutation.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">{lowStock.length} items are running low on stock!</span>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
          data-testid="filter-all"
        >
          All
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
            data-testid={`filter-${cat.toLowerCase()}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No items in inventory. Add your first item!
          </div>
        ) : (
          filteredInventory.map((item: any) => (
            <Card 
              key={item._id} 
              className={cn(
                "bg-card border-border",
                isLowStock(item) && "border-red-500/30"
              )}
              data-testid={`inventory-card-${item._id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge className={cn("mt-1", CATEGORY_COLORS[item.category])}>
                      {item.category}
                    </Badge>
                  </div>
                  <div className="p-2 bg-accent rounded-lg">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className={cn(
                    "text-3xl font-display font-bold",
                    isLowStock(item) && "text-red-400"
                  )}>
                    {item.quantity}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.unit}</span>
                </div>
                
                {isLowStock(item) && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Below minimum ({item.minStock} {item.unit})
                  </p>
                )}

                <div className="text-sm text-muted-foreground">
                  ₹{item.price.toLocaleString('en-IN')} per {item.unit}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedItem({ ...item, adjustType: 'in' });
                      setAdjustDialogOpen(true);
                    }}
                    data-testid={`button-stock-in-${item._id}`}
                  >
                    <ArrowUp className="w-3 h-3 mr-1 text-green-500" />
                    In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedItem({ ...item, adjustType: 'out' });
                      setAdjustDialogOpen(true);
                    }}
                    data-testid={`button-stock-out-${item._id}`}
                  >
                    <ArrowDown className="w-3 h-3 mr-1 text-red-500" />
                    Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="type" defaultValue={selectedItem?.adjustType || 'in'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({selectedItem?.unit})</Label>
              <Input name="amount" type="number" step="1" min="1" required placeholder="0" />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={adjustMutation.isPending}
            >
              {adjustMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
