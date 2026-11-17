import api from "./api";

const USE_MOCK = true; // passer à false quand l'API de P2 est prête

let mockOrders = [
  { id: "o1", code: "CS-1001", studentName: "Amine B.", items: [{ title: "Panier sandwichs", qty: 2 }], total: 10, status: "paid", createdAt: "2026-11-17T12:10:00" },
  { id: "o2", code: "CS-1002", studentName: "Sarra M.", items: [{ title: "Pâtisseries assorties", qty: 1 }], total: 3, status: "paid", createdAt: "2026-11-17T13:05:00" },
  { id: "o3", code: "CS-1003", studentName: "Yassine K.", items: [{ title: "Panier sandwichs", qty: 1 }], total: 5, status: "picked_up", createdAt: "2026-11-16T17:40:00" },
  { id: "o4", code: "CS-1004", studentName: "Ines T.", items: [{ title: "Pâtisseries assorties", qty: 3 }], total: 9, status: "cancelled", createdAt: "2026-11-16T18:00:00" },
];

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const getOrders = async () => {
  if (USE_MOCK) {
    await delay();
    return [...mockOrders];
  }
  return (await api.get("/orders/mine")).data;
};

// Valide la récupération d'une commande à partir du code du QR
export const validatePickup = async (code) => {
  if (USE_MOCK) {
    await delay();
    const order = mockOrders.find((o) => o.code === code.trim().toUpperCase());
    if (!order) throw new Error("Code inconnu.");
    if (order.status === "picked_up") throw new Error("Cette commande a déjà été récupérée.");
    if (order.status !== "paid") throw new Error("Cette commande n'est pas payée.");
    order.status = "picked_up";
    return { ...order };
  }
  try {
    return (await api.post("/orders/validate", { code })).data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Validation impossible.");
  }
};