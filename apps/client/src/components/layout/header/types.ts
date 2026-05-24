import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: number;
  href?: string;
  title: string;
  key?: string;
  children?: {
    id: number;
    title: string;
    items: {
      id: number;
      href: string;
      title: string;
      desc: string;
      icon: LucideIcon;
    }[];
  }[];
}
