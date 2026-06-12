'use client';
import Logo from '@/components/layout/Logo';
import AuthHeaderActions from './components/AuthHeaderActions';

const AuthHeader = () => {
  return (
    <div className="fixed inset-0 z-50 h-16 w-full border-b border-neutral-800 bg-black">
      <div className="container-fluid flex h-full items-center justify-between">
        <Logo />
        <AuthHeaderActions />
      </div>
    </div>
  );
};

export default AuthHeader;
