import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

// Imports dynamiques
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Transactions = lazy(() => import("./pages/Transactions").then(m => ({ default: m.Transactions })));
const Invoices = lazy(() => import("./pages/Invoices").then(m => ({ default: m.Invoices })));
const Clients = lazy(() => import("./pages/Clients").then(m => ({ default: m.Clients })));
const Marketing = lazy(() => import("./pages/Marketing").then(m => ({ default: m.Marketing })));
const Forecast = lazy(() => import("./pages/Forecast").then(m => ({ default: m.Forecast })));
const Reports = lazy(() => import("./pages/Reports").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));

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