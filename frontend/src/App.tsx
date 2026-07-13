import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import ClauseViewerPage from "./pages/ClauseViewerPage";
import ContractDetailsPage from "./pages/ContractDetailsPage";
import ContractsPage from "./pages/ContractsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RiskDashboardPage from "./pages/RiskDashboardPage";
import SearchPage from "./pages/SearchPage";
import UploadContractPage from "./pages/UploadContractPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={<DashboardPage />}
            />

            <Route
              path="/upload"
              element={<UploadContractPage />}
            />

            <Route
              path="/contracts"
              element={<ContractsPage />}
            />

            <Route
              path="/contracts/:contractId"
              element={<ContractDetailsPage />}
            />

            <Route
              path="/clauses"
              element={<ClauseViewerPage />}
            />

            <Route
              path="/risks"
              element={<RiskDashboardPage />}
            />

            <Route
              path="/search"
              element={<SearchPage />}
            />

            <Route
              path="/chat"
              element={<ChatPage />}
            />
            <Route element={<AdminRoute />}>
  <Route
    path="/admin"
    element={<AdminDashboardPage />}
  />
  <Route
  path="/profile"
  element={<ProfilePage />}
/>
</Route>
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;