interface ResponsiveNavProps {
  menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  activeView: string;
  onNavigate: (view: string) => void;
}

export function ResponsiveNav({ menuItems, activeView, onNavigate }: ResponsiveNavProps) {
  return (
    <nav className="hidden md:flex md:flex-col space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
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
  );
}
