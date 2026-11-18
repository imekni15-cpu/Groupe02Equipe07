import api from "./api";

const USE_MOCK = true; // passer à false quand l'API est prête

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// data : { name, email, password, role }
export const registerUser = async (data) => {
  if (USE_MOCK) {
    await delay();
    if (data.email === "deja@essect.tn") throw new Error("Cet email est déjà utilisé.");
    return { id: String(Date.now()), name: data.name, email: data.email, role: data.role };
  }
  try {
    return (await api.post("/auth/register", data)).data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Inscription impossible.");
  }
};