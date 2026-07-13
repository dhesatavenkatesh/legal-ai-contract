import {
  FileSearch,
  FileText,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  Search,
  ShieldCheck,
  Upload,
  UserCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const links = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/upload",
    label: "Upload Contract",
    icon: Upload,
  },
  {
    path: "/contracts",
    label: "Documents",
    icon: FileText,
  },
  {
    path: "/clauses",
    label: "Clause Viewer",
    icon: FileSearch,
  },
  {
    path: "/risks",
    label: "Risk Dashboard",
    icon: Gauge,
  },
  {
    path: "/search",
    label: "Search",
    icon: Search,
  },
  {
    path: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
  },
  {
  path: "/profile",
  label: "Profile",
  icon: UserCircle,
},
];

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          L
        </div>

        <div>
          <h2>LegalAI</h2>
          <span>Contract Review</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                isActive
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              <Icon size={19} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}

        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            <ShieldCheck size={19} />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <p>
          LegalAI provides automated analysis for
          informational purposes only.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;