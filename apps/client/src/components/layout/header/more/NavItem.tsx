"use client";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import type { NavItem } from "../types";

interface NavItemProps {
  item: NavItem;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

const NavItem: FC<NavItemProps> = ({ item, activeMenu, setActiveMenu }) => {
  if (item.href) {
    return (
      <Link
        href={item.href}
        onMouseEnter={() => setActiveMenu(null)}
        className="group text-neutral-400 transition-all duration-300 ease-out hover:bg-neutral-800 hover:text-gray-100 text-sm flex items-center gap-1 py-1.5 px-3 rounded-full"
      >
        {item.title}
        {item.children && (
          <ChevronDown
            size={15}
            className="group-hover:rotate-180 transition-all duration-300 ease-in-out"
          />
        )}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setActiveMenu(item.key ?? null)}
        className="group text-neutral-400 transition-all duration-300 ease-out hover:bg-neutral-800 hover:text-gray-100 text-sm flex items-center gap-1 py-1.5 px-3 rounded-full cursor-pointer"
      >
        {item.title}
        {item.children && (
          <ChevronDown
            size={15}
            className="group-hover:rotate-180 transition-all duration-300 ease-in-out"
          />
        )}
      </button>
      <div className="absolute top-full left-0 pt-2">
        <AnimatePresence>
          {item.children && activeMenu === item.key && (
            <motion.div
              layoutId="nav-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl w-max"
            >
              <div
                className="grid gap-8"
                style={{
                  gridTemplateColumns: `repeat(${item.children.length}, auto)`,
                }}
              >
                {item.children.map((child) => (
                  <div key={child.id} className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-neutral-500 tracking-wider mb-2">
                      {child.title.toLocaleUpperCase("tr-TR")}
                    </p>
                    {child.items.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className="group flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-800 transition-colors duration-150"
                      >
                        <span className="text-zinc-500 bg-zinc-900 border border-zinc-700 group-hover:bg-white group-hover:border-white group-hover:text-black rounded-md transition-colors duration-150 w-8 h-8 flex items-center justify-center shrink-0">
                          <subItem.icon size={16} />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors duration-150 whitespace-nowrap">
                            {subItem.title}
                          </span>
                          <span className="text-xs text-zinc-500 group-hover:text-zinc-200 transition-colors duration-150 whitespace-nowrap">
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
    </div>
  );
};

export default NavItem;
