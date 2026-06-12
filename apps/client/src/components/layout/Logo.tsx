import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { FC } from 'react';

const squareVariants = cva(
  'rotate-45 rounded-xs bg-white transition-all duration-300 ease-in-out group-hover:rotate-180',
  {
    variants: {
      size: {
        default: 'w-5 h-5',
        sm: 'w-4 h-4',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
      },
      defaultVariants: {
        size: 'default',
      },
    },
  }
);

const textVariants = cva('font-bold text-white', {
  variants: {
    size: {
      default: 'text-2xl',
      sm: 'text-xl',
      lg: 'text-3xl',
      xl: 'text-5xl',
    },
    defaultVariants: {
      size: 'default',
    },
  },
});

interface Props {
  size?: 'default' | 'sm' | 'lg' | 'xl';
  className?: string;
}

const Logo: FC<Props> = ({ size = 'default', className }) => {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className={cn(squareVariants({ size, className }))} />
      <p className={cn(textVariants({ size, className }))}>Codxus</p>
    </Link>
  );
};

export default Logo;
