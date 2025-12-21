import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navSections = [
  {
    title: 'Main Menu',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/register', label: 'Register Customer', icon: UserPlus },
      { href: '/registered-customers', label: 'Registration Dashboard', icon: Filter },
      { href: '/customer-service', label: 'Service Visits', icon: Wrench },
      { href: '/jobs', label: 'Support & Feedback', icon: MessageCircle },
      { href: '/invoices', label: 'Invoices', icon: FileText },
      { href: '/appointments', label: 'Products', icon: Package },
      { href: '/inventory', label: 'Inventory', icon: Package },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/technicians', label: 'Employees', icon: UserCog },
      { href: '/settings', label: 'Attendance', icon: Calendar },
    ]
  },
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
          "fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 transition-transform duration-300 shadow-sm flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold shadow-md">
                AG
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-slate-900">
                  AutoGarage
                </h1>
                <p className="text-xs text-slate-600 font-medium">CRM System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
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
                              ? "bg-blue-100 text-blue-700"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
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
