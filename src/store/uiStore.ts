import { create } from 'zustand'

export type ActiveView = 'aggregated' | string

interface UiState {
  activeView: ActiveView
  selectedThreadId?: string
  quickReplyDraft: string
  setActiveView: (view: ActiveView) => void
  setSelectedThreadId: (threadId?: string) => void
  setQuickReplyDraft: (value: string) => void
  clearQuickReplyDraft: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'aggregated',
  selectedThreadId: undefined,
  quickReplyDraft: '',
  setActiveView: (view) => set({ activeView: view, selectedThreadId: undefined }),
  setSelectedThreadId: (selectedThreadId) => set({ selectedThreadId }),
  setQuickReplyDraft: (value) => set({ quickReplyDraft: value }),
  clearQuickReplyDraft: () => set({ quickReplyDraft: '' }),
}))
