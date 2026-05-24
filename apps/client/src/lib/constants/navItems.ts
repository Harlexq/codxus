import { NavItem } from '@/components/layout/header/types';
import { Book, Brain, Clock3, Code2, FileText, Folder, Layers, Shield, Users } from 'lucide-react';

export const navItems: NavItem[] = [
  {
    id: 1,
    title: 'Ürün',
    key: 'product',
    children: [
      {
        id: 1,
        title: 'Temel Özellikler',
        items: [
          {
            id: 1,
            title: 'AI Bilgi Sistemi',
            href: '/features/ai',
            desc: 'AI ile otomatik doküman oluştur.',
            icon: Brain,
          },
          {
            id: 2,
            title: 'Workspace Yönetimi',
            href: '/features/workspaces',
            desc: 'Ekiplerini ve projelerini düzenle.',
            icon: Folder,
          },
          {
            id: 3,
            title: 'Markdown Editör',
            href: '/features/editor',
            desc: 'Obsidian tarzı hızlı yazım deneyimi.',
            icon: FileText,
          },
        ],
      },

      {
        id: 2,
        title: 'İş Birliği',
        items: [
          {
            id: 4,
            title: 'Rol Sistemi',
            href: '/features/roles',
            desc: 'Kullanıcı yetkilerini yönet.',
            icon: Shield,
          },
          {
            id: 5,
            title: 'Davet Sistemi',
            href: '/features/invite',
            desc: "Takım üyelerini workspace'e ekle.",
            icon: Users,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Çözümler',
    key: 'solutions',
    children: [
      {
        id: 1,
        title: 'Takımlar',
        items: [
          {
            id: 1,
            title: 'Yazılım Takımları',
            href: '/solutions/engineering',
            desc: 'Teknik dokümantasyon merkezi.',
            icon: Code2,
          },
          {
            id: 2,
            title: 'Ürün Takımları',
            href: '/solutions/product',
            desc: 'Tüm ürün bilgisini tek yerde topla.',
            icon: Layers,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Kaynaklar',
    key: 'resources',
    children: [
      {
        id: 1,
        title: 'Öğren',
        items: [
          {
            id: 1,
            title: 'Dokümantasyon',
            href: '/docs',
            desc: 'Codxus nasıl çalışır öğren.',
            icon: Book,
          },
          {
            id: 2,
            title: 'Güncellemeler',
            href: '/changelog',
            desc: 'Yeni özellikleri takip et.',
            icon: Clock3,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Fiyatlandırma',
    href: '/pricing',
  },
];
