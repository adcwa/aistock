import Link from 'next/link';
import { Suspense } from 'react';
import { Circle } from 'lucide-react';
import { UserMenu } from './user-menu';

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Circle className="h-6 w-6 text-blue-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">InsightTrader</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/stocks" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Stock Analysis
          </Link>
          <Link href="/ai-config" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            AI Config
          </Link>
          <Link href="/ai-prompt" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            AI Prompt
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
