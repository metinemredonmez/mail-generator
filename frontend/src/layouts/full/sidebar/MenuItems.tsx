import {
  IconLayoutDashboard,
  IconUsers,
  IconMail,
  IconInbox,
  IconUsersGroup,
  IconSettings,
  IconLogout,
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
        id: 'inbox',
        title: 'Gelen Kutusu',
        icon: IconInbox,
        href: '/inbox',
        chip: 'Yeni',
        chipColor: 'primary',
      },
    ],
  },
  {
    subheader: 'Sistem',
    items: [
      {
        id: 'settings',
        title: 'Ayarlar',
        icon: IconSettings,
        href: '/settings',
      },
    ],
  },
];

export default MenuItems;
