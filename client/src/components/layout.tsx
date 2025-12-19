import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/register', label: 'Register Customers', icon: UserPlus },
  { href: '/registered-customers', label: 'Registered Customers', icon: Filter },
  { href: '/customer-service', label: 'Customers Service', icon: Wrench },
  { href: '/jobs', label: 'Service Funnel', icon: Wrench },
  { href: '/invoices', label: 'Invoices & Tracking', icon: FileText },
  { href: '/technicians', label: 'Technicians', icon: UserCog },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        data-testid="button-menu-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 shadow-sm",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                AG
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-gray-900">
                  AutoGarage
                </h1>
                <p className="text-xs text-gray-500">CRM System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium",
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 space-y-4">
            {user && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">
                    {user.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-gray-500 text-xs truncate">{user.email}</p>
                </div>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen bg-gray-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
