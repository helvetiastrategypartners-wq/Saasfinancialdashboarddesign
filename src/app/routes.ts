import { createElement, lazy } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { SuperAdminLayout } from "./components/SuperAdminLayout";
import { useAuth } from "./contexts/AuthContext";
import { MetricsProvider } from "./contexts/MetricsContext";

// Imports dynamiques
const Dashboard = lazy(() => import("./features/dashboard/DashboardPage").then(m => ({ default: m.Dashboard })));
const Transactions = lazy(() => import("./features/transactions/TransactionsPage").then(m => ({ default: m.Transactions })));
const Invoices = lazy(() => import("./features/invoices/InvoicesPage").then(m => ({ default: m.Invoices })));
const Clients = lazy(() => import("./features/clients/ClientsPage").then(m => ({ default: m.Clients })));
const Marketing = lazy(() => import("./features/marketing/MarketingPage").then(m => ({ default: m.Marketing })));
const Forecast = lazy(() => import("./features/forecast/ForecastPage").then(m => ({ default: m.Forecast })));
const Reports = lazy(() => import("./features/reports/ReportsPage").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./features/settings/SettingsPage").then(m => ({ default: m.Settings })));
const Login = lazy(() => import("./features/auth/LoginPage").then(m => ({ default: m.Login })));
const ChangePassword = lazy(() => import("./features/auth/ChangePasswordPage").then(m => ({ default: m.ChangePassword })));
const SuperAdmin = lazy(() => import("./features/super-admin/SuperAdminPage").then(m => ({ default: m.SuperAdmin })));

function getSuperAdminEmails() {
  return (import.meta.env.VITE_SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isSuperAdminEmail(email?: string) {
  return Boolean(email && getSuperAdminEmails().includes(email.toLowerCase()));
}

function ProtectedLayout() {
  const { user, loading, profileLoading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return createElement(
      "div",
      { className: "min-h-screen grid place-items-center text-muted-foreground" },
      "Chargement...",
    );
  }

  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true, state: { from: location } });
  }

  if (isSuperAdminEmail(user.email)) {
    return createElement(Navigate, { to: "/super-admin", replace: true });
  }

  if (mustChangePassword && location.pathname !== "/change-password") {
    return createElement(Navigate, { to: "/change-password", replace: true });
  }

  return createElement(MetricsProvider, null, createElement(Layout));
}

function ProtectedSuperAdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return createElement(
      "div",
      { className: "min-h-screen grid place-items-center text-muted-foreground" },
      "Chargement...",
    );
  }

  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true, state: { from: location } });
  }

  if (!isSuperAdminEmail(user.email)) {
    return createElement(Navigate, { to: "/", replace: true });
  }

  return createElement(SuperAdminLayout);
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/change-password",
    Component: ChangePassword,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "transactions", Component: Transactions },
      { path: "invoices", Component: Invoices },
      { path: "clients", Component: Clients },
      { path: "marketing", Component: Marketing },
      { path: "forecast", Component: Forecast },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/super-admin",
    Component: ProtectedSuperAdminLayout,
    children: [
      { index: true, Component: SuperAdmin },
    ],
  },
]);
