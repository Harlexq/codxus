import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HeaderActions = () => {
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <Button type="button" variant="outline">
        AI{"'"}a Sor
      </Button>
      <Button type="button" asChild variant="outline">
        <Link href="/auth/login">Giriş Yap</Link>
      </Button>
      <Button type="button" asChild>
        <Link href="/auth/register">Kayıt Ol</Link>
      </Button>
    </div>
  );
};

export default HeaderActions;
