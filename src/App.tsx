import React, { useState, useEffect } from 'react';
import { Monster } from './types';
import { DEFAULT_MONSTERS } from './data/defaultMonsters';
import { Navigation, ActiveTab } from './components/Navigation';
import { RTADraftView } from './components/rta/RTADraftView';
import { SiegeView } from './components/siege/SiegeView';
import { MonsterManagerView } from './components/monsters/MonsterManagerView';
import { MonsterFormModal } from './components/monsters/MonsterFormModal';
import {
  subscribeToMonsters,
  saveMonsterToFirestore,
  deleteMonsterFromFirestore,
} from './lib/monsterService';

const STORAGE_KEY = 'sw_monsters_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rta');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Load monsters initially from localStorage as fallback
  const [monsters, setMonsters] = useState<Monster[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_MONSTERS;
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);

  // Subscribe to Firebase Firestore in realtime
  useEffect(() => {
    const unsubscribe = subscribeToMonsters(
      (firestoreList) => {
        setIsFirebaseConnected(true);
        if (firestoreList.length > 0) {
          // Merge with DEFAULT_MONSTERS so newly added RTA meta superstars are always available
          const firestoreIds = new Set(firestoreList.map((m) => m.id));
          const missingDefaults = DEFAULT_MONSTERS.filter((m) => !firestoreIds.has(m.id));
          const merged = [...firestoreList, ...missingDefaults];
          setMonsters(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
        } else {
          setMonsters(DEFAULT_MONSTERS);
        }
      },
      (err) => {
        console.warn('Firebase sync warning, relying on local state:', err);
        setIsFirebaseConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync monsters to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(monsters));
    } catch {
      // storage quota or private mode
    }
  }, [monsters]);

  const handleOpenAddMonster = () => {
    setEditingMonster(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditMonster = (monster: Monster) => {
    setEditingMonster(monster);
    setIsFormModalOpen(true);
  };

  // Save monster (Add/Edit) -> Auto save to Firebase Firestore
  const handleSaveMonster = async (saved: Monster) => {
    // Optimistic UI update
    setMonsters((prev) => {
      const existsIndex = prev.findIndex((m) => m.id === saved.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    // Auto save to Firestore
    try {
      setIsSyncing(true);
      await saveMonsterToFirestore(saved);
    } catch (err) {
      console.error('Failed to auto-save to Firebase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete monster -> Auto delete from Firebase Firestore
  const handleDeleteMonster = async (monsterId: string) => {
    setMonsters((prev) => prev.filter((m) => m.id !== monsterId));
    try {
      setIsSyncing(true);
      await deleteMonsterFromFirestore(monsterId);
    } catch (err) {
      console.error('Failed to delete from Firebase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateAvatarUrl = async (monsterId: string, newUrl: string) => {
    const target = monsters.find((m) => m.id === monsterId);
    if (!target) return;
    const updated: Monster = { ...target, avatarUrl: newUrl };

    setMonsters((prev) =>
      prev.map((m) => (m.id === monsterId ? updated : m))
    );

    try {
      setIsSyncing(true);
      await saveMonsterToFirestore(updated);
    } catch (err) {
      console.error('Failed to update avatar in Firebase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] art-ambient-glow text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950">
      
      {/* Sticky Top Header Navigation with 3 sections */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        monsterCount={monsters.length}
        onOpenAddMonster={handleOpenAddMonster}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-5">
        {activeTab === 'rta' && (
          <RTADraftView
            allMonsters={monsters}
            onOpenAddMonster={handleOpenAddMonster}
          />
        )}

        {activeTab === 'siege' && (
          <SiegeView
            allMonsters={monsters}
            onOpenAddMonster={handleOpenAddMonster}
          />
        )}

        {activeTab === 'monsters' && (
          <MonsterManagerView
            monsters={monsters}
            onAddMonster={handleOpenAddMonster}
            onEditMonster={handleOpenEditMonster}
            onDeleteMonster={handleDeleteMonster}
            onUpdateAvatarUrl={handleUpdateAvatarUrl}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Global Pet Form Modal (Add / Edit / Load Avatar Link) */}
      <MonsterFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingMonster(null);
        }}
        onSaveMonster={handleSaveMonster}
        editingMonster={editingMonster}
        allMonsters={monsters}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-5 text-center text-xs text-slate-500 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-400">
            Summoners War Helper
          </p>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isFirebaseConnected ? 'Firebase Realtime Connected' : 'Local Storage Mode'}
            </span>
            <span>•</span>
            <span>Load CDN / Swarfarm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
