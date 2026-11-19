import api from "./api";

const USE_MOCK = true;

let mockShop = {
  name: "Café Campus",
  type: "Cafétéria",
  address: "Avenue de l'Université, Tunis",
  phone: "71123456",
  openingHours: "08:00 - 19:00",
  status: "pending", // pending | approved | rejected
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const getShop = async () => {
  if (USE_MOCK) {
    await delay();
    return { ...mockShop };
  }
  return (await api.get("/shops/mine")).data;
};

export const saveShop = async (data) => {
  if (USE_MOCK) {
    await delay();
    mockShop = { ...mockShop, ...data };
    return { ...mockShop };
  }
  return (await api.put("/shops/mine", data)).data;
};