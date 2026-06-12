'use client';
import Logo from '@/components/layout/Logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import RegisterForm from '@/features/auth/components/forms/RegisterForm';
import Link from 'next/link';

const RegisterPage = () => {
  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-3">
        <Logo size="lg" />
        <CardDescription className="text-center">
          Çalışma alanını oluştur ve ekibinle birlikte çalışmaya başla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center">
        <FieldDescription>
          Hesabınız var mı? <Link href="/auth/login">Giriş yapın.</Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  );
};

export default RegisterPage;
