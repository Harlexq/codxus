'use client';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { FC } from 'react';
import type { NavGroup } from '../types';
import SharedDropdown from './SharedDropdown';

interface NavItemProps {
  item: NavGroup;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

const navItemClassName =
  'group cursor-pointer flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-all duration-300 ease-out hover:bg-neutral-800 hover:text-gray-100';

const NavItem: FC<NavItemProps> = ({ item, activeMenu, setActiveMenu }) => {
  if (item.href) {
    return (
      <Link
        href={item.href}
        onPointerEnter={() => setActiveMenu(null)}
        className={navItemClassName}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onPointerEnter={() => setActiveMenu(item.key ?? null)}
        className={navItemClassName}
      >
        {item.title}
        <ChevronDown
          size={15}
          className="transition-all duration-300 ease-in-out group-hover:rotate-180"
        />
      </button>
      {item.children && <SharedDropdown activeMenu={activeMenu} item={item} />}
    </div>
  );
};

export default NavItem;
