import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  MapPin, 
  Building2, 
  Layers, 
  UserCheck, 
  History, 
  BarChart3, 
  Database, 
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ActiveTab, CadastralStats } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  stats: CadastralStats;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  stats
}) => {
  const navItems = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'map' as ActiveTab, label: '3D GIS Map', icon: Map, badge: 'Live' },
    { id: 'parcels' as ActiveTab, label: 'Land Parcels', icon: MapPin, badge: stats.totalParcels.toString() },
    { id: 'buildings' as ActiveTab, label: 'Buildings', icon: Building2, badge: stats.totalBuildings.toString() },
    { id: 'units' as ActiveTab, label: 'Vertical Properties', icon: Layers, badge: stats.totalUnits.toString() },
    { id: 'ownership' as ActiveTab, label: 'Ownership', icon: UserCheck, badge: null },
    { id: 'transactions' as ActiveTab, label: 'Transactions', icon: History, badge: stats.transferredProperties.toString() },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'explorer' as ActiveTab, label: 'Data Explorer', icon: Database, badge: 'CSV' },
    { id: 'about' as ActiveTab, label: 'About Project', icon: Info, badge: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none shrink-0 h-[calc(100vh-4rem)]">
      {/* Navigation List */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Cadastral Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cadastre Engine</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span>Verified 3D Parcels:</span>
              <strong className="text-slate-900 font-mono">{stats.totalParcels}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Total 3D-ULPIN Titles:</span>
              <strong className="text-slate-900 font-mono">{stats.totalUnits}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Andhra Pradesh Cadastre</span>
            <span className="font-mono">v1.0-SIH</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
