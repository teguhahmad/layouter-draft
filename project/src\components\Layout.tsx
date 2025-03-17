import React from 'react';
import { Settings, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'settings' | 'chapters';
  onTabChange: (tab: 'settings' | 'chapters') => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Ebook Layouter</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="w-96">
            <nav className="flex space-x-4 mb-6">
              <button
                onClick={() => onTabChange('settings')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  activeTab === 'settings'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                onClick={() => onTabChange('chapters')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  activeTab === 'chapters'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <BookOpen size={16} />
                Chapters
              </button>
            </nav>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          </aside>

          <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="aspect-[1/1.4142] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <iframe
                src="about:blank"
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}