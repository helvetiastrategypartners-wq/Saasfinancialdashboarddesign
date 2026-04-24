import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

// Imports dynamiques
const Dashboard = lazy(() => import("./features/dashboard/page").then(m => ({ default: m.Dashboard })));
const Transactions = lazy(() => import("./features/transactions/page").then(m => ({ default: m.Transactions })));
const Invoices = lazy(() => import("./features/invoices/page").then(m => ({ default: m.Invoices })));
const Clients = lazy(() => import("./features/clients/page").then(m => ({ default: m.Clients })));
const Marketing = lazy(() => import("./features/marketing/page").then(m => ({ default: m.Marketing })));
const Forecast = lazy(() => import("./features/forecast/page").then(m => ({ default: m.Forecast })));
const Reports = lazy(() => import("./features/reports/page").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./features/settings/page").then(m => ({ default: m.Settings })));

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
