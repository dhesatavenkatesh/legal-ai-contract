import axios from "axios";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Scale,
  User,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const {
    register,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  if (isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !name.trim()
      || !email.trim()
      || !password
      || !confirmPassword
    ) {
      setError(
        "All fields are required.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/", {
        replace: true,
      });
    } catch (registerError) {
      if (
        axios.isAxiosError(
          registerError,
        )
      ) {
        setError(
          registerError.response?.data?.detail
            ?? "Registration failed.",
        );
      } else {
        setError(
          "Registration failed.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-side-panel">
          <div className="auth-logo">
            <Scale size={28} />
            <span>LegalAI</span>
          </div>

          <div>
            <h1>
              Create your intelligent contract workspace
            </h1>

            <p>
              Analyse contracts securely with
              semantic search, risk detection
              and AI chat.
            </p>
          </div>

          <div className="auth-feature-list">
            <span>Secure user-specific contracts</span>
            <span>Automatic clause extraction</span>
            <span>Risk and renewal monitoring</span>
            <span>Saved AI chat history</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-mobile-brand">
            <Scale size={24} />
            <strong>LegalAI</strong>
          </div>

          <div className="auth-heading">
            <h2>Create account</h2>

            <p>
              Register to upload and review
              your legal documents.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Full name

              <div className="auth-input">
                <User size={18} />

                <input
                  type="text"
                  value={name}
                  autoComplete="name"
                  placeholder="Your full name"
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>

            <label>
              Email address

              <div className="auth-input">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="name@example.com"
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>

            <label>
              Password

              <div className="auth-input">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label>
              Confirm password

              <div className="auth-input">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button full-width auth-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;