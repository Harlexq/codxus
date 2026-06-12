import { FC } from 'react';
import { NavGroup } from '../../header/types';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface SidebarNavProps {
  item: NavGroup;
}

const SidebarNav: FC<SidebarNavProps> = ({ item }) => {
  if (item.href) {
    return <Link href={item.href}>{item.title}</Link>;
  }

  return (
    <button type="button">
      {item.title}
      <ChevronDown
        size={15}
        className="transition-all duration-300 ease-in-out group-hover:rotate-180"
      />
    </button>
  );
};

export default SidebarNav;
