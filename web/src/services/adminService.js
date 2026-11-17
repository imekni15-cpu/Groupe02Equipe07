import api from "./api";

const USE_MOCK = true; // passer à false quand l'API de P1 est prête

let mockShops = [
  { id: "s1", name: "Café Campus", type: "Cafétéria", owner: "Mohamed A.", address: "Avenue de l'Université, Tunis", status: "pending", createdAt: "2026-11-15" },
  { id: "s2", name: "Pizza Express", type: "Fast-food", owner: "Leila H.", address: "Rue Ibn Khaldoun, Tunis", status: "pending", createdAt: "2026-11-16" },
  { id: "s3", name: "Boulangerie El Bey", type: "Boulangerie", owner: "Karim S.", address: "Rue de la Liberté, Tunis", status: "approved", createdAt: "2026-11-10" },
  { id: "s4", name: "Snack Chez Ali", type: "Restaurant", owner: "Ali R.", address: "Avenue Habib Bourguiba, Tunis", status: "rejected", createdAt: "2026-11-12" },
];

let mockUsers = [
  { id: "u1", name: "Amine Ben Salah", email: "amine@essect.tn", role: "student", active: true },
  { id: "u2", name: "Sarra Mejri", email: "sarra@essect.tn", role: "student", active: true },
  { id: "u3", name: "Yassine Khemiri", email: "yassine@essect.tn", role: "student", active: false },
  { id: "u4", name: "Mohamed Azizi", email: "mohamed@cafecampus.tn", role: "merchant", active: true },
  { id: "u5", name: "Karim Sassi", email: "karim@elbey.tn", role: "merchant", active: true },
  { id: "u6", name: "Admin CampusSave", email: "admin@campussave.tn", role: "admin", active: true },
];

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const getShops = async () => {
  if (USE_MOCK) {
    await delay();
    return [...mockShops];
  }
  return (await api.get("/admin/shops")).data;
};

// status : "approved" ou "rejected"
export const updateShopStatus = async (id, status) => {
  if (USE_MOCK) {
    await delay();
    mockShops = mockShops.map((s) => (s.id === id ? { ...s, status } : s));
    return mockShops.find((s) => s.id === id);
  }
  return (await api.patch(`/admin/shops/${id}/status`, { status })).data;
};

export const getUsers = async () => {
  if (USE_MOCK) {
    await delay();
    return [...mockUsers];
  }
  return (await api.get("/admin/users")).data;
};

export const setUserActive = async (id, active) => {
  if (USE_MOCK) {
    await delay();
    mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, active } : u));
    return mockUsers.find((u) => u.id === id);
  }
  return (await api.patch(`/admin/users/${id}`, { active })).data;
};

export const getAdminStats = async () => {
  if (USE_MOCK) {
    await delay();
    return {
      orders: 148,
      revenue: 612,
      mealsSaved: 231,
      weekly: [
        { label: "Lun", value: 18 },
        { label: "Mar", value: 25 },
        { label: "Mer", value: 31 },
        { label: "Jeu", value: 22 },
        { label: "Ven", value: 29 },
        { label: "Sam", value: 14 },
        { label: "Dim", value: 9 },
      ],
    };
  }
  return (await api.get("/admin/stats")).data;
};