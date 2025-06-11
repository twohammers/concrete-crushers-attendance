import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  Menu,
  Zap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Check In', icon: Home },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/roster', label: 'Roster', icon: Users },
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;
        
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-2 ${
                isActive ? 'bg-primary text-primary-foreground' : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Concrete Crushers</h1>
                <p className="text-xs text-gray-600">Team Attendance</p>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              <NavContent />
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Concrete Crushers</h1>
            </div>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-2 mt-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h2 className="font-bold text-gray-900">Concrete Crushers</h2>
                  <p className="text-sm text-gray-600">Team Attendance</p>
                </div>
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}