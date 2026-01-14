
import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { auth } from '../src/lib/firebase';
import { aiService, AIProvider } from '../services/aiService';
import { settingsService } from '../services/settingsService';

const SettingsView: React.FC<{ navigate: (view: View) => void }> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations'>('general');
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [modelNames, setModelNames] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!auth.currentUser) return;

    // Real-time subscription to settings
    const unsubscribe = settingsService.subscribeSettings(auth.currentUser.uid, (settings) => {
      if (settings) {
        // Load AI Config
        if (settings.aiConfig) {
          const ai = settings.aiConfig;
          setActiveProvider((ai.provider as AIProvider) || 'gemini');
          setApiKeys(prev => ({ ...prev, [ai.provider]: ai.apiKey }));
          if (ai.baseUrl) setBaseUrls(prev => ({ ...prev, [ai.provider]: ai.baseUrl }));
          if (ai.model) setModelNames(prev => ({ ...prev, [ai.provider]: ai.model }));

          // Update Runtime Service
          aiService.setConfig({
            provider: (ai.provider as AIProvider),
            apiKey: ai.apiKey,
            baseUrl: ai.baseUrl,
            model: ai.model
          });
        }

        // Load Preferences
        if (settings.jobPreferences) {
          setPrefs(prev => ({ ...prev, ...settings.jobPreferences }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const [prefs, setPrefs] = useState({
    keywords: 'Research Assistant',
    location: '',
    minSalary: '30000',
    jobType: 'Full Time'
  });
  const [saved, setSaved] = useState(false);

  const handleSavePrefs = async () => {
    if (!auth.currentUser) return;
    try {
      await settingsService.saveSettings(auth.currentUser.uid, {
        jobPreferences: prefs
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to save preferences.");
    }
  };

  const handleSaveAIConfig = async () => {
    if (!apiKeys[activeProvider]) {
      alert(`Please enter an API Key for ${activeProvider}`);
      return;
    }

    if (!auth.currentUser) {
      alert("Please log in to save settings to the cloud.");
      return;
    }

    const aiConfig = {
      provider: activeProvider,
      apiKey: apiKeys[activeProvider],
      baseUrl: baseUrls[activeProvider] || "",
      model: modelNames[activeProvider] || ""
    };

    try {
      await settingsService.saveSettings(auth.currentUser.uid, { aiConfig });
      aiService.setConfig(aiConfig); // Update runtime immediately
      alert(`AI Configuration Saved! Synced to Cloud.`);
    } catch (e) {
      console.error(e);
      alert("Failed to save AI config.");
    }
  };

  const PROVIDERS: { id: AIProvider; name: string; icon: string; models: string }[] = [
    { id: 'openai', name: 'OpenAI', icon: 'smart_toy', models: 'GPT-4o, GPT-3.5 Turbo' },
    { id: 'claude', name: 'Anthropic Claude', icon: 'psychology', models: 'Claude 3.5 Sonnet, Haiku' },
    { id: 'gemini', name: 'Google Gemini', icon: 'temp_preferences_custom', models: 'Gemini 1.5 Pro, Flash' },
    { id: 'groq', name: 'Groq', icon: 'speed', models: 'Llama 3 70B, Mixtral' },
    { id: 'deepseek', name: 'DeepSeek', icon: 'code', models: 'DeepSeek Chat, Coder' },
  ];

  const INPUT_CLASS = "w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-[#324467] rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white outline-none";
  const LABEL_CLASS = "text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto h-full">
      <main className="flex-1 flex justify-center py-8 lg:px-40 px-4">
        <div className="flex w-full max-w-[1200px] gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal px-3">Configuration</h1>
              <p className="text-slate-500 dark:text-[#92a4c9] text-sm font-normal leading-normal px-3">Manage your academic AI tools</p>
            </div>
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('general')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'general' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <span className="material-symbols-outlined text-[22px]">settings</span><span className="text-sm">General Settings</span>
              </button>
              <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <span className="material-symbols-outlined text-[22px] fill-1">neurology</span><span className="text-sm">AI Providers</span>
              </button>
            </nav>
            <div className="mt-auto p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Current Active Model</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{activeProvider} ({aiService.getConfig()?.model || 'Default'})</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-6">

            {/* GENERAL SETTINGS TAB */}
            {activeTab === 'general' && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">Job Search Preferences</h2>
                  <p className="text-slate-500 dark:text-[#92a4c9] text-base">Customize how our AI scouts for academic opportunities.</p>
                </div>
                <div className="bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] rounded-xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className={LABEL_CLASS}>Keywords / Roles</label>
                      <input className={INPUT_CLASS} value={prefs.keywords} onChange={e => setPrefs({ ...prefs, keywords: e.target.value })} placeholder="e.g. Research Assistant..." />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Preferred Location</label>
                      <input className={INPUT_CLASS} value={prefs.location} onChange={e => setPrefs({ ...prefs, location: e.target.value })} placeholder="e.g. London" />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Minimum Salary (GBP)</label>
                      <select className={INPUT_CLASS} value={prefs.minSalary} onChange={e => setPrefs({ ...prefs, minSalary: e.target.value })}>
                        <option value="0">Any Salary</option><option value="25000">£25,000+</option><option value="35000">£35,000+</option><option value="45000">£45,000+</option><option value="60000">£60,000+</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#232f48] flex justify-end">
                    <button onClick={handleSavePrefs} className={`px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-blue-600 shadow-lg shadow-primary/20'}`}>
                      <span className="material-symbols-outlined">{saved ? 'check' : 'save'}</span>{saved ? 'Preferences Saved' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* AI CONFIG TAB */}
            {activeTab === 'ai' && (
              <section className="bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-[#232f48]">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Providers</h2>
                  <p className="text-slate-500 text-sm">Select your default AI provider and configure API keys. Keys are stored locally.</p>
                </div>

                <div className="flex flex-col md:flex-row h-[600px]">
                  {/* Provider List */}
                  <div className="w-full md:w-1/3 border-r border-slate-100 dark:border-[#232f48] overflow-y-auto">
                    {PROVIDERS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProvider(p.id)}
                        className={`w-full text-left px-5 py-4 border-b border-slate-50 dark:border-[#232f48] transition-colors flex items-center gap-3 ${activeProvider === p.id ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:hover:bg-[#111722] border-l-4 border-l-transparent'}`}
                      >
                        <div className={`size-10 rounded-lg flex items-center justify-center text-white shrink-0 ${activeProvider === p.id ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <span className="material-symbols-outlined">{p.icon}</span>
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${activeProvider === p.id ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{p.models}</p>
                        </div>
                        {activeProvider === p.id && <span className="ml-auto material-symbols-outlined text-primary text-lg">chevron_right</span>}
                      </button>
                    ))}
                  </div>

                  {/* Config Panel */}
                  <div className="flex-1 p-6 flex flex-col h-full bg-slate-50/50 dark:bg-[#111722]/50">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Configure {PROVIDERS.find(p => p.id === activeProvider)?.name}
                          {apiKeys[activeProvider] && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase">Connected</span>}
                        </h3>
                      </div>
                      <button
                        onClick={handleSaveAIConfig}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90"
                      >
                        Set as Default
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={LABEL_CLASS}>API Key <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          className={INPUT_CLASS}
                          placeholder={`sk-... (${activeProvider.toUpperCase()} Key)`}
                          value={apiKeys[activeProvider] || ''}
                          onChange={e => setApiKeys({ ...apiKeys, [activeProvider]: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">lock</span>
                          Stored locally in your browser
                        </p>
                      </div>

                      <div>
                        <label className={LABEL_CLASS}>Model Name (Optional)</label>
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          placeholder={PROVIDERS.find(p => p.id === activeProvider)?.models.split(',')[0].trim() || 'gpt-4o'}
                          value={modelNames[activeProvider] || ''}
                          onChange={e => setModelNames({ ...modelNames, [activeProvider]: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1.5">Override default model (e.g. <code>deepseek-chat</code>, <code>claude-3-opus</code>)</p>
                      </div>

                      <div>
                        <label className={LABEL_CLASS}>Base URL (Optional)</label>
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          placeholder="https://api.example.com/v1"
                          value={baseUrls[activeProvider] || ''}
                          onChange={e => setBaseUrls({ ...baseUrls, [activeProvider]: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1.5">Leave empty to use default endpoint</p>
                      </div>
                    </div>

                    <div className="mt-auto bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Provider Information</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            This provider supports <strong>{PROVIDERS.find(p => p.id === activeProvider)?.models}</strong>.
                            Ensure your API key has credits/quota available.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsView;
