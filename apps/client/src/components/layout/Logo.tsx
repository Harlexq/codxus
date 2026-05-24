import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="h-5 w-5 rotate-45 rounded-xs bg-white transition-all duration-300 ease-in-out group-hover:rotate-180" />
      <p className="text-2xl font-bold text-white">Codxus</p>
    </Link>
  );
};

export default Logo;
