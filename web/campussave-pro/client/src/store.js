import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ───────── Session ───────── */
export const useAuth = create(
  persist(
    set => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      setUser: user => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'cs_auth' }
  )
)

/* ───────── Panier (un seul commerce par commande) ───────── */
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      shop: null,
      // retourne 'ok' | 'conflict' (autre commerce) | 'max' (stock atteint)
      add: (o, qty = 1) => {
        const { items, shop } = get()
        if (items.length && shop?.id !== o.shopId) return 'conflict'
        const cur = items.find(i => i.offerId === o.id)
        const next = Math.min((cur?.qty || 0) + qty, o.quantity)
        if (next <= (cur?.qty || 0)) return 'max'
        const line = {
          offerId: o.id, title: o.title, category: o.category, shopName: o.shopName, photoUrl: o.photoUrl,
          unitPrice: o.discountPrice, originalPrice: o.originalPrice, qty: next, max: o.quantity,
          pickupStart: o.pickupStart, pickupEnd: o.pickupEnd,
        }
        set({
          shop: { id: o.shopId, name: o.shopName },
          items: cur ? items.map(i => (i.offerId === o.id ? line : i)) : [...items, line],
        })
        return 'ok'
      },
      replaceWith: (o, qty) => { set({ items: [], shop: null }); return get().add(o, qty) },
      setQty: (id, qty) =>
        set(s => ({ items: s.items.map(i => (i.offerId === id ? { ...i, qty: Math.max(1, Math.min(qty, i.max)) } : i)) })),
      remove: id =>
        set(s => {
          const items = s.items.filter(i => i.offerId !== id)
          return { items, shop: items.length ? s.shop : null }
        }),
      clear: () => set({ items: [], shop: null }),
    }),
    { name: 'cs_cart' }
  )
)
export const cartCount = s => s.items.reduce((n, i) => n + i.qty, 0)
export const cartTotal = items => items.reduce((n, i) => n + i.unitPrice * i.qty, 0)

/* ───────── Interface : thème + notifications ───────── */
export const useUi = create(
  persist(
    (set, get) => ({
      theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      toasts: [],
      paletteOpen: false,
      setPalette: v => set({ paletteOpen: v }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      toast: (message, type = 'ok') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, type }] })
        setTimeout(() => get().dismiss(id), 3800)
      },
      dismiss: id => set({ toasts: get().toasts.filter(t => t.id !== id) }),
    }),
    { name: 'cs_ui', partialize: s => ({ theme: s.theme }) }
  )
)
