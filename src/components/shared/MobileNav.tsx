import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';

interface MobileNavProps {
  menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  activeView: string;
  onNavigate: (view: string) => void;
}

export function MobileNav({ menuItems, activeView, onNavigate }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate through different sections of the application
        </SheetDescription>
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b">
            <h2 className="font-semibold">Menu</h2>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-base">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}