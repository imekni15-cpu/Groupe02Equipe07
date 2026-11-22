import { create } from 'zustand'
import { favService } from './services'

export const useFav = create((set, get) => ({
  ids: [],
  load: () => favService.list().then(ids => set({ ids })).catch(() => {}),
  clear: () => set({ ids: [] }),
  // mise à jour optimiste : le cœur réagit immédiatement, on annule si l'API échoue
  toggle: async id => {
    const prev = get().ids
    set({ ids: prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id] })
    try { set({ ids: await favService.toggle(id) }) } catch { set({ ids: prev }) }
  },
}))
