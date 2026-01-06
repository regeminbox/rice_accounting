
import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  BarChart3,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  Bot,
  MessageSquare,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';

export const COLORS = {
  primary: '#0ea5e9',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  unpaid: '#fee2e2',
  milled: '#f0fdf4'
};

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Sales: <Receipt size={20} />,
  Inventory: <Package size={20} />,
  Customers: <Users size={20} />,
  Reports: <BarChart3 size={20} />,
  Search: <Search size={20} />,
  Bell: <Bell size={20} />,
  Plus: <Plus size={20} />,
  Filter: <Filter size={20} />,
  Download: <Download size={20} />,
  Bot: <Bot size={20} />,
  Chat: <MessageSquare size={20} />,
  AI: <Sparkles size={16} />,
  ArrowRight: <ChevronRight size={16} />,
  Trending: <TrendingUp size={16} />,
  Alert: <AlertCircle size={16} />,
  Edit: <Pencil size={16} />,
  Delete: <Trash2 size={16} />
};
