import { create } from 'zustand';

/* Dashboard sidebar layout — same store as the CRM (src/store/sidebar-layout-store.ts there). */

const COLLAPSED_KEY = 'web-dashboard-sidebar-collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    /* storage may be unavailable (private mode) — state still works in memory */
  }
}

/**
 * isCollapsed: sidebar as a 64px icon rail vs the full 232px panel. The
 * choice is remembered per browser.
 */
interface SidebarLayoutState {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  /** Read the saved rail state after mount (server always renders expanded). */
  hydrateCollapsed: () => void;
}

export const useSidebarLayoutStore = create<SidebarLayoutState>((set, get) => ({
  isCollapsed: false,
  hydrateCollapsed: () => set({ isCollapsed: readCollapsed() }),
  setCollapsed: (collapsed) => {
    writeCollapsed(collapsed);
    set({ isCollapsed: collapsed });
  },
  toggleCollapsed: () => get().setCollapsed(!get().isCollapsed),
}));
