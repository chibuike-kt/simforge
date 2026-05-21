'use client';

import { useState } from 'react';
import { User, Bell, Shield, Key, Save, Check } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'security';

export default function SettingsPage() {
  const user = getUser();
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#1a1a1a] flex-shrink-0">
        <span className="text-sm font-medium text-zinc-300">Settings</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left tabs */}
        <div className="w-48 border-r border-zinc-800/60 flex flex-col overflow-hidden flex-shrink-0 p-2">
          {(
            [
              { key: 'profile', label: 'Profile', icon: <User size={13} /> },
              { key: 'notifications', label: 'Notifications', icon: <Bell size={13} /> },
              { key: 'security', label: 'Security', icon: <Shield size={13} /> },
            ] as { key: SettingsTab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors text-left',
                tab === t.key
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg">
            {tab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Profile</h3>
                  <p className="text-xs text-zinc-500">Your account information</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                      Full Name
                    </label>
                    <input
                      defaultValue={user?.name ?? ''}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                      Email
                    </label>
                    <input
                      defaultValue={user?.email ?? ''}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                  >
                    {saved ? <Check size={12} /> : <Save size={12} />}
                    {saved ? 'Saved' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Notifications</h3>
                  <p className="text-xs text-zinc-500">Configure simulation alerts</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Run completed', desc: 'When a simulation finishes' },
                    { label: 'Run failed', desc: 'When a run encounters errors' },
                    { label: 'Approval required', desc: 'When a run needs manual approval' },
                    { label: 'SLO breach', desc: 'When latency or error thresholds are exceeded' },
                    { label: 'Circuit breaker', desc: 'When a circuit breaker opens' },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-3 border-b border-zinc-800/40"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-300">{item.label}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors flex items-center',
                          i < 3 ? 'bg-blue-500' : 'bg-zinc-700',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                            i < 3 ? 'right-0.5' : 'left-0.5',
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Security</h3>
                  <p className="text-xs text-zinc-500">Manage your password and access</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Current Password', type: 'password' },
                    { label: 'New Password', type: 'password' },
                    { label: 'Confirm Password', type: 'password' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider block mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  ))}
                  <button className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
                    <Key size={12} />
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
