// store/workspaceStore.ts
// Live workspace list for AI Studio. Seeded from the samples; Home AI (and the
// Studio create flow) add new typed workspaces here so they appear instantly.
import { create } from 'zustand';
import { mockWorkspaces } from '@/services/workspaces';
import type { Workspace } from '@/services/types';

interface WorkspaceState {
  workspaces: Workspace[];
  add: (w: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: mockWorkspaces,
  add: (w) => set((s) => ({ workspaces: [w, ...s.workspaces] })),
}));
