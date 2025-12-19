import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Car, Lock, Mail, Zap, Users, TrendingUp } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user);
      toast({ title: 'Login successful!' });
      setLocation('/');
    } catch (error: any) {
      toast({ 
        title: error.message || 'Login failed', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-950">
      {/* Left Hero Section */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-red-600 via-red-500 to-red-700 dark:from-red-900 dark:via-red-800 dark:to-red-950 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Car className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">AutoGarage</h1>
              <p className="text-red-100 text-sm">CRM System</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-5xl font-bold font-display leading-tight">
              Manage Your Garage With Ease
            </h2>
            <p className="text-red-100 text-lg">
              Streamline your automotive service operations with our comprehensive CRM solution designed for modern garages.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Fast Operations</h3>
                  <p className="text-red-100">Quick service booking and tracking</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Customer Management</h3>
                  <p className="text-red-100">Track customer history and preferences</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-time Analytics</h3>
                  <p className="text-red-100">Monitor sales and performance metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-red-100 text-sm">
          <p>© 2025 AutoGarage CRM. All rights reserved.</p>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Car className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">AutoGarage CRM</h1>
          </div>

          <div className="space-y-8">
            <div className="hidden lg:block">
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to your garage management account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@autogarage.com"
                    className="pl-12 h-11 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-0 transition-colors"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-11 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-red-600 focus:ring-0 transition-colors"
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-red-600/30"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Demo: Use <span className="font-semibold text-foreground">Autogarage@system.com</span> / <span className="font-semibold text-foreground">Autogarage</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
