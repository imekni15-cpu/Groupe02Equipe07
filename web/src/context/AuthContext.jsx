import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

// Mettre à false quand la page de connexion et l'API seront prêtes
const DEV_MODE = true;

const DEV_USER = { role: "merchant", name: "Test" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    DEV_MODE
      ? DEV_USER
      : JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Mode test uniquement : basculer entre commerçant et admin
  const switchRole = (role) => setUser((u) => ({ ...u, role }));

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, devMode: DEV_MODE }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);