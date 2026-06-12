import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: number;
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export interface NavChildren {
  id: number;
  title: string;
  items: NavItem[];
}

export interface NavGroup {
  id: number;
  href?: string;
  title: string;
  key?: string;
  children?: NavChildren[];
}
