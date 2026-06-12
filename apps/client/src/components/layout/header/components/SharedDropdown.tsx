'use client';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { NavGroup } from '../types';
import { FC } from 'react';
import Link from 'next/link';

interface SharedDropdownProps {
  item: NavGroup;
  activeMenu: string | null;
}

const SharedDropdown: FC<SharedDropdownProps> = ({ item, activeMenu }) => {
  return (
    <div className="absolute top-full left-0 pt-2">
      <AnimatePresence>
        {item.children && activeMenu === item.key && (
          <motion.div
            layoutId="nav-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-max rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl"
          >
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: `repeat(${item.children.length}, auto)`,
              }}
            >
              {item.children.map((child) => (
                <div key={child.id} className="flex flex-col gap-1">
                  <p className="mb-2 text-xs font-semibold tracking-wider text-neutral-500">
                    {child.title.toLocaleUpperCase('tr-TR')}
                  </p>
                  {child.items.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className="group flex items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-neutral-800"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 transition-colors duration-150 group-hover:border-white group-hover:bg-white group-hover:text-black">
                        <subItem.icon size={16} />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium whitespace-nowrap text-neutral-300 transition-colors duration-150 group-hover:text-white">
                          {subItem.title}
                        </span>
                        <span className="text-xs whitespace-nowrap text-zinc-500 transition-colors duration-150 group-hover:text-zinc-200">
                          {subItem.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharedDropdown;
