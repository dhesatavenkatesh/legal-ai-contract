import axios from "axios";
import {
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Shield,
  User,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/api";

function ProfilePage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPasswords, setShowPasswords] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !currentPassword
      || !newPassword
      || !confirmPassword
    ) {
      setError("All password fields are required.");
      setSuccess("");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must contain at least 8 characters.",
      );
      setSuccess("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setSuccess("");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from the current password.",
      );
      setSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(response.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (passwordError) {
      if (axios.isAxiosError(passwordError)) {
        setError(
          passwordError.response?.data?.detail
            ?? "Unable to change password.",
        );
      } else {
        setError(
          "Unable to change password.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Profile</h2>

          <p>
            View your account details and update your password.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="content-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase() ?? "U"}
            </div>

            <div>
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profile-detail-list">
            <div>
              <span>
                <User size={18} />
                Full Name
              </span>

              <strong>{user?.name}</strong>
            </div>

            <div>
              <span>
                <Mail size={18} />
                Email
              </span>

              <strong>{user?.email}</strong>
            </div>

            <div>
              <span>
                <Shield size={18} />
                Role
              </span>

              <strong className="capitalize">
                {user?.role}
              </strong>
            </div>

            <div>
              <span>
                <Shield size={18} />
                Account Status
              </span>

              <strong>
                {user?.is_active
                  ? "Active"
                  : "Inactive"}
              </strong>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading-row">
            <div>
              <h3>
                <KeyRound size={19} />
                Change Password
              </h3>

              <p>
                Use a strong password with at least 8 characters.
              </p>
            </div>
          </div>

          <form
            className="profile-password-form"
            onSubmit={handleSubmit}
          >
            <label>
              Current Password

              <div className="auth-input">
                <KeyRound size={18} />

                <input
                  type={
                    showPasswords
                      ? "text"
                      : "password"
                  }
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>

            <label>
              New Password

              <div className="auth-input">
                <KeyRound size={18} />

                <input
                  type={
                    showPasswords
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>

            <label>
              Confirm New Password

              <div className="auth-input">
                <KeyRound size={18} />

                <input
                  type={
                    showPasswords
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPasswords(
                      (current) => !current,
                    )
                  }
                >
                  {showPasswords ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Updating..."
                : "Change Password"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}

export default ProfilePage;