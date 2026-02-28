import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const getInitialIsOpen = () => {
  if (typeof window !== 'undefined') {
    // If screen width >= 768px (md breakpoint), open by default
    return window.matchMedia('(min-width: 768px)').matches;
  }
  // Default false for SSR
  return false;
};
export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: getInitialIsOpen(),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
