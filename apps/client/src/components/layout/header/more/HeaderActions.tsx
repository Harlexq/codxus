import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HeaderActions = () => {
  return (
    <div className="flex items-center gap-3">
      <Button type="button" size="lg" variant="outline">
        Yapay Zekaya Sor
      </Button>
      <Button type="button" asChild size="lg" variant="outline">
        <Link href="/auth/login">Giriş Yap</Link>
      </Button>
      <Button type="button" asChild size="lg">
        <Link href="/auth/register">Kayıt Ol</Link>
      </Button>
    </div>
  );
};

export default HeaderActions;
