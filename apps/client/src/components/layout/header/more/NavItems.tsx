'use client';
import { useState } from 'react';
import NavItem from './NavItem';
import { navItems } from '@/lib/constants/navItems';

const NavItems = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav className="flex items-center gap-3" onMouseLeave={() => setActiveMenu(null)}>
      {navItems.map((item) => (
        <NavItem item={item} activeMenu={activeMenu} setActiveMenu={setActiveMenu} key={item.id} />
      ))}
    </nav>
  );
};

export default NavItems;
