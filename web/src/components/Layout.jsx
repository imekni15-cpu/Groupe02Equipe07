import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./layout.css";

export default function Layout({ title, links }) {
  const { user, logout, switchRole, devMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSwitch = () => {
  const next = user.role === "admin" ? "merchant" : "admin";
  switchRole(next);
  setTimeout(() => navigate(`/${next}`), 0);
};

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🌱 CampusSave</div>
        <div className="role-title">{title}</div>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          {devMode && (
            <button onClick={handleSwitch} className="btn btn-light">
              🔄 Test : {user.role === "admin" ? "commerçant" : "admin"}
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-light">
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}