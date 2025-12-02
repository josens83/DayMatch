import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  LinkIcon,
  CreditCardIcon,
  FlagIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '사용자 관리', href: '/users', icon: UsersIcon },
  { name: '일자리 관리', href: '/jobs', icon: BriefcaseIcon },
  { name: '매칭 관리', href: '/matches', icon: LinkIcon },
  { name: '결제 관리', href: '/payments', icon: CreditCardIcon },
  { name: '신고 관리', href: '/reports', icon: FlagIcon },
  { name: '설정', href: '/settings', icon: CogIcon },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <span className="text-xl font-bold text-indigo-600">DayMatch</span>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === item.href
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r">
          <div className="flex h-16 items-center px-4 border-b">
            <span className="text-xl font-bold text-indigo-600">DayMatch Admin</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === item.href
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4">
            <button className="w-full text-left text-sm text-gray-500 hover:text-gray-700">
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:px-8">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
          <div className="flex flex-1 justify-end">
            <span className="text-sm text-gray-500">관리자</span>
          </div>
        </div>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
