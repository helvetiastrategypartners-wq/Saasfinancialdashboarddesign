import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

// Imports dynamiques
const Dashboard = lazy(() => import("./features/dashboard/DashboardPage").then(m => ({ default: m.Dashboard })));
const Transactions = lazy(() => import("./features/transactions/TransactionsPage").then(m => ({ default: m.Transactions })));
const Invoices = lazy(() => import("./features/invoices/InvoicesPage").then(m => ({ default: m.Invoices })));
const Clients = lazy(() => import("./features/clients/ClientsPage").then(m => ({ default: m.Clients })));
const Marketing = lazy(() => import("./features/marketing/MarketingPage").then(m => ({ default: m.Marketing })));
const Forecast = lazy(() => import("./features/forecast/ForecastPage").then(m => ({ default: m.Forecast })));
const Reports = lazy(() => import("./features/reports/ReportsPage").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./features/settings/SettingsPage").then(m => ({ default: m.Settings })));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
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
]);
