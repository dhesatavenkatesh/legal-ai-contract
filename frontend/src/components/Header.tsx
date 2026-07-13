import {
  Bell,
  LogOut,
  Scale,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Header() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="top-header">
      <div>
        <h1>LegalAI Contract Review</h1>

        <p>
          Review contracts, detect risks and
          search legal clauses.
        </p>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            <Scale size={18} />
          </div>

          <div>
            <strong>
              {user?.name || "Legal Analyst"}
            </strong>

            <span>
              {user?.email || user?.role}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;