import {
  IconLayoutDashboard,
  IconUsers,
  IconMail,
  IconInbox,
  IconMailbox,
  IconUsersGroup,
  IconSettings,
  IconLogout,
  IconActivity,
  IconUser,
  IconSend,
} from '@tabler/icons-react';

export interface MenuItem {
  id: string;
  title: string;
  icon: any;
  href: string;
  chip?: string;
  chipColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export interface MenuSection {
  subheader: string;
  items: MenuItem[];
}

const MenuItems: MenuSection[] = [
  {
    subheader: 'Ana Menu',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: IconLayoutDashboard,
        href: '/dashboard',
      },
      {
        id: 'passengers',
        title: 'Yolcular',
        icon: IconUsers,
        href: '/passengers',
      },
      {
        id: 'groups',
        title: 'Gruplar',
        icon: IconUsersGroup,
        href: '/groups',
      },
    ],
  },
  {
    subheader: 'E-Posta Yonetimi',
    items: [
      {
        id: 'emails',
        title: 'E-Postalar',
        icon: IconMail,
        href: '/emails',
      },
      {
        id: 'send-mail',
        title: 'E-Posta Gonder',
        icon: IconSend,
        href: '/send-mail',
        chip: 'Yeni',
        chipColor: 'success',
      },
      {
        id: 'messages',
        title: 'Gelen Kutusu',
        icon: IconMailbox,
        href: '/messages',
      },
      {
        id: 'inbox',
        title: 'Dogrulama Kodlari',
        icon: IconInbox,
        href: '/inbox',
      },
    ],
  },
  {
    subheader: 'Sistem',
    items: [
      {
        id: 'profile',
        title: 'Profil',
        icon: IconUser,
        href: '/profile',
      },
      {
        id: 'settings',
        title: 'Ayarlar',
        icon: IconSettings,
        href: '/settings',
      },
      {
        id: 'activity',
        title: 'Aktivite Loglari',
        icon: IconActivity,
        href: '/activity',
      },
    ],
  },
];

export default MenuItems;
