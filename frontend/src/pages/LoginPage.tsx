import axios from "axios";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Scale,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

interface LocationState {
  from?: string;
}

function LoginPage() {
  const {
    login,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const state =
    location.state as LocationState | null;

  const destination =
    state?.from || "/";

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

    if (!email.trim() || !password) {
      setError(
        "Email and password are required.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await login({
        email: email.trim(),
        password,
      });

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      if (axios.isAxiosError(loginError)) {
        setError(
          loginError.response?.data?.detail
            ?? "Login failed.",
        );
      } else {
        setError("Login failed.");
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
              Review contracts with AI-powered intelligence
            </h1>

            <p>
              Upload documents, detect risks,
              search clauses and ask grounded
              legal questions.
            </p>
          </div>

          <div className="auth-feature-list">
            <span>AI contract summaries</span>
            <span>Risk and clause detection</span>
            <span>Groq-powered document chat</span>
            <span>Source-grounded answers</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-mobile-brand">
            <Scale size={24} />
            <strong>LegalAI</strong>
          </div>

          <div className="auth-heading">
            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your
              contract review workspace.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
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
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;