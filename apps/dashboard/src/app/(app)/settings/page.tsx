'use client';

import { User, Bell, Shield, Key, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-slide-in-up max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account and platform preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <User size={14} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-white">Profile</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Full Name</Label>
              <Input
                defaultValue="Admin"
                className="h-9 text-sm bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Email</Label>
              <Input
                defaultValue="admin@simforge.dev"
                className="h-9 text-sm bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Save size={12} />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Bell size={14} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Run completed', desc: 'Notify when a simulation run finishes' },
            { label: 'Run failed', desc: 'Alert when a run encounters a failure' },
            { label: 'Approval required', desc: 'Notify when a run needs approval' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-zinc-300">{item.label}</p>
                <p className="text-xs text-zinc-600">{item.desc}</p>
              </div>
              <button className="relative w-9 h-5 rounded-full bg-blue-500 transition-colors flex items-center">
                <span className="absolute right-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Shield size={14} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-white">Security</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">
              Current Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-9 text-sm bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-9 text-sm bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Confirm Password
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-9 text-sm bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Key size={12} />
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}
