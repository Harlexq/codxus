'use client';
import Logo from '@/components/layout/Logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import LoginForm from '@/features/auth/components/forms/LoginForm';
import Link from 'next/link';

const LoginPage = () => {
  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-3">
        <Logo size="lg" />
        <CardDescription>Çalışma alanına erişmek için giriş yap.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center">
        <FieldDescription>
          Hesabınız yok mu? <Link href="/auth/register">Kayıt olun.</Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
};

export default LoginPage;
