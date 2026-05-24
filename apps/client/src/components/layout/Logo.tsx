import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="bg-white rounded-xs w-5 h-5 rotate-45 group-hover:rotate-180 transition-all duration-300 ease-in-out" />
      <p className="text-2xl font-bold text-white">Codxus</p>
    </Link>
  );
};

export default Logo;
