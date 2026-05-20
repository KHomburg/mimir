import { create } from 'zustand'

export type ActiveView = 'aggregated' | string

interface UiState {
  activeView: ActiveView
  quickReplyDraft: string
  setActiveView: (view: ActiveView) => void
  setQuickReplyDraft: (value: string) => void
  clearQuickReplyDraft: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'aggregated',
  quickReplyDraft: '',
  setActiveView: (view) => set({ activeView: view }),
  setQuickReplyDraft: (value) => set({ quickReplyDraft: value }),
  clearQuickReplyDraft: () => set({ quickReplyDraft: '' }),
}))
