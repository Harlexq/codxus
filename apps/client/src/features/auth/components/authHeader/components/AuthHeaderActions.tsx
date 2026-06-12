'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const AuthHeaderActions = () => {
  return (
    <Button type="button" asChild>
      <Link href="/auth/register">Kayıt Ol</Link>
    </Button>
  );
};

export default AuthHeaderActions;
