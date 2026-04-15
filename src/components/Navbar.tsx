import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Library, Calendar, User, LogOut, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
}

export function Navbar({ currentView, setView }: NavbarProps) {
  const { logout, profile } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'collection', label: 'Collection', icon: Library },
    { id: 'gamenight', label: 'Game Nights', icon: Calendar },
    { id: 'households', label: 'Households', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col p-6 z-50">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg">🎲</div>
        <span className="font-bold text-2xl text-primary tracking-tight">TableTop</span>
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200",
              currentView === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", currentView === item.id ? "text-white" : "text-muted-foreground")} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-6 border-t border-border space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-primary hover:bg-primary/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
