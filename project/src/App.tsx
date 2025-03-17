import React from 'react';
import { Layout } from './components/Layout';
import { SettingsForm } from './components/SettingsForm';
import { ChapterList } from './components/ChapterList';
import { Preview } from './components/Preview';

function App() {
  const [activeTab, setActiveTab] = React.useState<'settings' | 'chapters'>('settings');

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {activeTab === 'settings' ? (
          <SettingsForm />
        ) : (
          <ChapterList />
        )}
      </div>
      <Preview />
    </Layout>
  );
}

export default App;