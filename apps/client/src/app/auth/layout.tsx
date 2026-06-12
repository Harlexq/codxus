import AuthHeader from '@/features/auth/components/authHeader/AuthHeader';
import { ReactNode } from 'react';

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <AuthHeader />
      <div className="flex min-h-svh w-full items-center justify-center pt-21 pb-5 md:pt-0 md:pb-0">
        <div className="w-[90%] max-w-sm">{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;
