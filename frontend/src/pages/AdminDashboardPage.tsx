import axios from "axios";
import {
  FileText,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  getAdminSummary,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../services/api";
import type {
  AdminSummaryResponse,
  AdminUser,
} from "../types";

function AdminDashboardPage() {
  const [summaryData, setSummaryData] =
    useState<AdminSummaryResponse | null>(null);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  const loadAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [
        summaryResponse,
        usersResponse,
      ] = await Promise.all([
        getAdminSummary(),
        getAdminUsers(),
      ]);

      setSummaryData(summaryResponse);
      setUsers(usersResponse.users);
    } catch (loadError) {
      console.error(
        "Admin data loading failed:",
        loadError,
      );

      if (axios.isAxiosError(loadError)) {
        setError(
          loadError.response?.data?.detail
            ?? "Unable to load admin data.",
        );
      } else {
        setError(
          "Unable to load admin data.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  async function handleRoleChange(
    userId: number,
    role: "user" | "admin",
  ) {
    try {
      setUpdatingUserId(userId);
      setError("");

      const response =
        await updateAdminUserRole(
          userId,
          role,
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: response.user.role,
              }
            : user,
        ),
      );
    } catch (updateError) {
      if (axios.isAxiosError(updateError)) {
        setError(
          updateError.response?.data?.detail
            ?? "Unable to update user role.",
        );
      } else {
        setError(
          "Unable to update user role.",
        );
      }
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleStatusChange(
    userId: number,
    isActive: boolean,
  ) {
    try {
      setUpdatingUserId(userId);
      setError("");

      const response =
        await updateAdminUserStatus(
          userId,
          isActive,
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_active:
                  response.user.is_active,
              }
            : user,
        ),
      );
    } catch (updateError) {
      if (axios.isAxiosError(updateError)) {
        setError(
          updateError.response?.data?.detail
            ?? "Unable to update user status.",
        );
      } else {
        setError(
          "Unable to update user status.",
        );
      }
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (isLoading) {
    return (
      <LoadingSpinner text="Loading admin dashboard..." />
    );
  }

  if (!summaryData) {
    return (
      <div className="error-message">
        {error || "Admin data unavailable."}
      </div>
    );
  }

  const { summary } = summaryData;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Admin Dashboard</h2>

          <p>
            Manage users and review platform activity.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            void loadAdminData()
          }
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Users size={23} />
          </div>

          <div>
            <span>Total Users</span>
            <strong>
              {summary.total_users}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon success-icon">
            <UserCheck size={23} />
          </div>

          <div>
            <span>Active Users</span>
            <strong>
              {summary.active_users}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon warning-icon">
            <ShieldCheck size={23} />
          </div>

          <div>
            <span>Admins</span>
            <strong>
              {summary.admin_users}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon renewal-icon">
            <FileText size={23} />
          </div>

          <div>
            <span>Total Contracts</span>
            <strong>
              {summary.total_contracts}
            </strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon danger-icon">
            <MessageSquare size={23} />
          </div>

          <div>
            <span>Chat Messages</span>
            <strong>
              {summary.total_chat_messages}
            </strong>
          </div>
        </article>
      </div>

      <article className="content-card">
        <div className="card-heading-row">
          <div>
            <h3>User Management</h3>

            <p>
              Change roles and activate or deactivate accounts.
            </p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Contracts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isUpdating =
                  updatingUserId === user.id;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <strong>
                          {user.name}
                        </strong>

                        <span>
                          {user.email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          user.role === "admin"
                            ? "admin-role-badge"
                            : "user-role-badge"
                        }
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active
                            ? "active-user-badge"
                            : "inactive-user-badge"
                        }
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {user.contract_count}
                    </td>

                    <td>
                      {new Date(
                        user.created_at,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="admin-actions">
                        <select
                          value={user.role}
                          disabled={isUpdating}
                          onChange={(event) =>
  void handleRoleChange(
    user.id,
    event.target.value as "user" | "admin",
  )
}
                        >
                          <option value="user">
                            User
                          </option>

                          <option value="admin">
                            Admin
                          </option>
                        </select>

                        <button
                          type="button"
                          className={
                            user.is_active
                              ? "admin-danger-button"
                              : "admin-success-button"
                          }
                          disabled={isUpdating}
                          onClick={() =>
                            void handleStatusChange(
                              user.id,
                              !user.is_active,
                            )
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : user.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="empty-state">
            <Users size={42} />

            <h3>No users found</h3>
          </div>
        )}
      </article>
    </section>
  );
}

export default AdminDashboardPage;