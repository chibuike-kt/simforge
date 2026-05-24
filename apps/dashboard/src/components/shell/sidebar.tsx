'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Target,
  GitBranch,
  Play,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Zap,
  Folder,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  MoreHorizontal,
  Trash2,
  FolderPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAuth, getUser } from '@/lib/auth';
import { useCollections, useCreateCollection, useAddScenarioToCollection } from '@/hooks/use-api';
import { useScenarios } from '@/hooks/use-api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  connected: boolean;
  isSimulating: boolean;
}

interface Collection {
  id: string;
  name: string;
  color: string;
  description?: string;
  scenarios: { id: string; name: string; status: string }[];
}

interface Scenario {
  id: string;
  name: string;
  status: string;
}

const COLLECTION_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#ef4444',
];

export function Sidebar({ collapsed, onToggle, connected, isSimulating }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#3b82f6');
  const [showAddScenario, setShowAddScenario] = useState<string | null>(null);

  const { data: collectionsData, isLoading: collectionsLoading } = useCollections();
  const { data: scenariosData } = useScenarios();
  const createCollection = useCreateCollection();
  const addScenarioToCollection = useAddScenarioToCollection();

  const collections = (collectionsData as Collection[]) ?? [];
  const allScenarios = (scenariosData as Scenario[]) ?? [];

  function toggleCollection(id: string) {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    await createCollection.mutateAsync({
      name: newCollectionName.trim(),
      color: newCollectionColor,
    });
    setNewCollectionName('');
    setShowNewCollection(false);
  }

  async function handleAddScenario(collectionId: string, scenarioId: string) {
    await addScenarioToCollection.mutateAsync({ collectionId, scenarioId });
    setShowAddScenario(null);
  }

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[#1a1a1a] border-r border-zinc-800/60 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-12' : 'w-56',
      )}
    >
      {/* Logo + collapse */}
      <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-800/60 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">SimForge</span>
          </div>
        )}
        {collapsed && (
          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center mx-auto">
            <Zap size={12} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-8 text-zinc-600 hover:text-zinc-400 transition-colors border-b border-zinc-800/60"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={13} className="flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Runs */}
        <Link
          href="/runs"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/runs')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Runs' : undefined}
        >
          <Play size={13} className="flex-shrink-0" />
          {!collapsed && <span>Runs</span>}
          {!collapsed && isSimulating && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </Link>

        {/* Reports */}
        <Link
          href="/reports"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/reports')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Reports' : undefined}
        >
          <BarChart2 size={13} className="flex-shrink-0" />
          {!collapsed && <span>Reports</span>}
        </Link>

        {/* Collections section */}
        {!collapsed && (
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Collections
              </span>
              <button
                onClick={() => setShowNewCollection(true)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                title="New collection"
              >
                <FolderPlus size={11} />
              </button>
            </div>

            {/* New collection form */}
            {showNewCollection && (
              <div className="mx-2 mb-2 p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCollection();
                    if (e.key === 'Escape') setShowNewCollection(false);
                  }}
                  placeholder="Collection name"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-600"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={cn(
                        'w-4 h-4 rounded-full transition-transform',
                        newCollectionColor === color && 'scale-125 ring-2 ring-white/30',
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreateCollection}
                    disabled={createCollection.isPending || !newCollectionName.trim()}
                    className="flex-1 py-1 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-[11px] font-medium transition-colors"
                  >
                    {createCollection.isPending ? (
                      <Loader2 size={10} className="animate-spin mx-auto" />
                    ) : (
                      'Create'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCollection(false);
                      setNewCollectionName('');
                    }}
                    className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Collections list */}
            {collectionsLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={12} className="text-zinc-600 animate-spin" />
              </div>
            )}

            {!collectionsLoading && collections.length === 0 && !showNewCollection && (
              <button
                onClick={() => setShowNewCollection(true)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors"
              >
                <Plus size={10} />
                <span>New collection</span>
              </button>
            )}

            <div className="space-y-0.5">
              {collections.map((collection) => (
                <div key={collection.id}>
                  {/* Collection header */}
                  <div className="flex items-center group">
                    <button
                      onClick={() => toggleCollection(collection.id)}
                      className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all text-left"
                    >
                      {expandedCollections.has(collection.id) ? (
                        <ChevronDown size={10} className="text-zinc-600 flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon size={10} className="text-zinc-600 flex-shrink-0" />
                      )}
                      <Folder
                        size={11}
                        className="flex-shrink-0"
                        style={{ color: collection.color }}
                      />
                      <span className="truncate">{collection.name}</span>
                      <span className="ml-auto text-[10px] text-zinc-700 flex-shrink-0">
                        {collection.scenarios?.length ?? 0}
                      </span>
                    </button>
                  </div>

                  {/* Scenarios inside collection */}
                  {expandedCollections.has(collection.id) && (
                    <div className="ml-3 pl-2 border-l border-zinc-800 space-y-0.5 mt-0.5 mb-1">
                      {collection.scenarios?.map((scenario) => (
                        <Link
                          key={scenario.id}
                          href={`/scenarios/${scenario.id}`}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all',
                            isActive(`/scenarios/${scenario.id}`)
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
                          )}
                        >
                          <Activity size={10} className="flex-shrink-0 text-zinc-600" />
                          <span className="truncate">{scenario.name}</span>
                          {scenario.status === 'published' && (
                            <span className="ml-auto w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                          )}
                        </Link>
                      ))}

                      {/* Add scenario to collection */}
                      {showAddScenario === collection.id ? (
                        <div className="space-y-1 py-1">
                          {allScenarios
                            .filter((s) => !collection.scenarios?.find((cs) => cs.id === s.id))
                            .map((scenario) => (
                              <button
                                key={scenario.id}
                                onClick={() => handleAddScenario(collection.id, scenario.id)}
                                className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors text-left"
                              >
                                <Plus size={9} className="flex-shrink-0" />
                                <span className="truncate">{scenario.name}</span>
                              </button>
                            ))}
                          {allScenarios.filter(
                            (s) => !collection.scenarios?.find((cs) => cs.id === s.id),
                          ).length === 0 && (
                            <p className="text-[10px] text-zinc-700 px-2">All scenarios added</p>
                          )}
                          <button
                            onClick={() => setShowAddScenario(null)}
                            className="w-full text-[10px] text-zinc-600 hover:text-zinc-400 px-2 py-0.5"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddScenario(collection.id)}
                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <Plus size={9} />
                          <span>Add scenario</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {!collapsed && <div className="h-px bg-zinc-800/60 mx-2 my-2" />}

        {/* Targets */}
        <Link
          href="/targets"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/targets')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Targets' : undefined}
        >
          <Target size={13} className="flex-shrink-0" />
          {!collapsed && <span>Targets</span>}
        </Link>

        {/* Behaviors */}
        <Link
          href="/behaviors"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/behaviors')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Behaviors' : undefined}
        >
          <GitBranch size={13} className="flex-shrink-0" />
          {!collapsed && <span>Behaviors</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-all',
            isActive('/settings')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={13} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                connected ? 'bg-green-400' : 'bg-zinc-600',
              )}
            />
            <span className="text-[10px] text-zinc-600">{connected ? 'Connected' : 'Offline'}</span>
            {isSimulating && (
              <span className="ml-auto text-[10px] text-blue-400 animate-pulse">Simulating</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-semibold text-blue-400">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-zinc-400 truncate">{user?.name}</p>
            </div>
            <button
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <LogOut size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
