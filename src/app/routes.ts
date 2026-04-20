import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Invoices } from "./pages/Invoices";
import { Clients } from "./pages/Clients";
import { Marketing } from "./pages/Marketing";
import { Forecast } from "./pages/Forecast";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

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
