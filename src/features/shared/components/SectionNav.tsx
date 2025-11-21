import React from 'react';
import { 
  OverviewIcon, 
  LendingIcon, 
  BorrowingIcon, 
  LiquidationIcon, 
  AdminIcon 
} from '../../../components/ThemedIcons';

export type DashboardSection = 'overview' | 'lending' | 'borrowing' | 'liquidations' | 'admin';

interface SectionNavProps {
  selectedSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
}

const sections: { 
  id: DashboardSection; 
  label: string; 
  icon: React.ComponentType<{ className?: string; size?: number }>; 
  description: string 
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: OverviewIcon,
    description: 'Protocol metrics and pool analytics',
  },
  {
    id: 'lending',
    label: 'Lending',
    icon: LendingIcon,
    description: 'Supply positions and supplier analytics',
  },
  {
    id: 'borrowing',
    label: 'Borrowing',
    icon: BorrowingIcon,
    description: 'Margin managers and borrow activity',
  },
  {
    id: 'liquidations',
    label: 'Liquidations',
    icon: LiquidationIcon,
    description: 'Liquidation history and opportunities',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: AdminIcon,
    description: 'Fee withdrawals and config changes',
  },
];

export function SectionNav({ selectedSection, onSelectSection }: SectionNavProps) {
  return (
    <div className="mb-8">
      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex items-center gap-2 bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/10">
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`flex-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                selectedSection === section.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IconComponent size={24} className={selectedSection === section.id ? "opacity-100" : "opacity-60"} />
                <span className="text-sm font-semibold">{section.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Dropdown Navigation */}
      <div className="md:hidden">
        <select
          value={selectedSection}
          onChange={e => onSelectSection(e.target.value as DashboardSection)}
          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:outline-none focus:border-cyan-400"
        >
          {sections.map(section => (
            <option key={section.id} value={section.id} className="bg-slate-900">
              {section.label}
            </option>
          ))}
        </select>
        
        {/* Selected section description */}
        <p className="mt-2 text-sm text-white/60 text-center">
          {sections.find(s => s.id === selectedSection)?.description}
        </p>
      </div>
    </div>
  );
}

