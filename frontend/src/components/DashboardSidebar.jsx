import React, { useState } from 'react';
import { LayoutGrid, Settings, Globe, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

// Accepts activeItem (string or number) and onSelect (function) as props
function DashboardSidebar({ activeItem, onSelect, is_superuser }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 0,
      label: 'Overview',
      icon: LayoutGrid
    },
    {
      id: 1,
      label: 'Settings',
      icon: Settings
    },
    {
      id: 2,
      label: 'Sources',
      icon: Globe
    },
    {
      id: 3,
      label: 'Files',
      icon: FileText
    }
  ];

  const handleItemClick = (itemId) => {
    if (onSelect) onSelect(itemId);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`relative bg-gray-50 border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-48'} h-screen`}>
      {/* Navigation Items */}
      <div className="py-4">
        {menuItems.map((item) => {
          if (!is_superuser && item.label === "Files") return;
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse/Expand Button */}
      <button
        onClick={toggleSidebar}
        className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}

export default DashboardSidebar;