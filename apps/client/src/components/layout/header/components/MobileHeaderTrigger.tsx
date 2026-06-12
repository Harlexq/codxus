'use client';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const MobileHeaderTrigger = () => {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Button type="button" variant="outline">
        AI{"'"}a Sor
      </Button>
      <Button type="button" variant="outline" onClick={() => console.log('alert')}>
        <Menu size={16} />
      </Button>
    </div>
  );
};

export default MobileHeaderTrigger;
