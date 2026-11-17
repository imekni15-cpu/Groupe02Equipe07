import api from "./api";

const USE_MOCK = true; // passer à false quand l'API de P2 est prête

let mockOffers = [
  {
    id: "1",
    title: "Panier sandwichs",
    category: "Sandwich",
    description: "3 sandwichs variés du jour",
    originalPrice: 12,
    discountPrice: 5,
    quantity: 6,
    pickupStart: "17:00",
    pickupEnd: "18:30",
    photoUrl: "",
  },
  {
    id: "2",
    title: "Pâtisseries assorties",
    category: "Pâtisserie",
    description: "",
    originalPrice: 8,
    discountPrice: 3,
    quantity: 10,
    pickupStart: "18:00",
    pickupEnd: "19:00",
    photoUrl: "",
  },
];

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// Transforme l'objet en FormData (nécessaire pour envoyer la photo à l'API)
const toFormData = (data) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  return form;
};

export const getOffers = async () => {
  if (USE_MOCK) {
    await delay();
    return [...mockOffers];
  }
  return (await api.get("/offers/mine")).data;
};

export const getOffer = async (id) => {
  if (USE_MOCK) {
    await delay();
    return mockOffers.find((o) => o.id === id);
  }
  return (await api.get(`/offers/${id}`)).data;
};

export const createOffer = async (data) => {
  if (USE_MOCK) {
    await delay();
    const { photo, ...rest } = data;
    const offer = {
      ...rest,
      id: String(Date.now()),
      photoUrl: photo ? URL.createObjectURL(photo) : "",
    };
    mockOffers.push(offer);
    return offer;
  }
  return (await api.post("/offers", toFormData(data))).data;
};

export const updateOffer = async (id, data) => {
  if (USE_MOCK) {
    await delay();
    const { photo, ...rest } = data;
    mockOffers = mockOffers.map((o) =>
      o.id === id
        ? { ...o, ...rest, photoUrl: photo ? URL.createObjectURL(photo) : o.photoUrl }
        : o
    );
    return;
  }
  await api.put(`/offers/${id}`, toFormData(data));
};

export const deleteOffer = async (id) => {
  if (USE_MOCK) {
    await delay();
    mockOffers = mockOffers.filter((o) => o.id !== id);
    return;
  }
  await api.delete(`/offers/${id}`);
};