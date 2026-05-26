import { MetricsCalculator } from "../metrics";
import type {
    Customer,
    Debt,
    Goal,
    InventoryItem,
    MarketingMetrics,
    Product,
    Receivable,
    Transaction,
} from "@shared/types";

export const REF_DATE = new Date("2025-03-15T12:00:00Z");

// Factories volontairement petites : chaque test surcharge seulement les champs utiles a son scenario.
export function makeTx(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: "tx1",
        date: "2025-02-10",
        amount: 1000,
        type: "income",
        payment_status: "completed",
        category: "Sales",
        recurring: false,
        ...overrides,
    } as Transaction;
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
    return {
        id: "c1",
        name: "Client A",
        status: "active",
        acquisition_date: "2025-02-05",
        monthly_revenue: 500,
        acquisition_channel: "web",
        ...overrides,
    } as Customer;
}

export function makeMktg(overrides: Partial<MarketingMetrics> = {}): MarketingMetrics {
    return {
        id: "m1",
        channel_id: "web",
        period_start: "2025-02-01",
        period_end: "2025-02-28",
        spend: 2000,
        customers_acquired: 4,
        revenue_generated: 5000,
        leads: 40,
        ...overrides,
    } as MarketingMetrics;
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: "p1",
        name: "Produit A",
        unit_cost: 100,
        units_sold: 10,
        ...overrides,
    } as Product;
}

export function makeDebt(overrides: Partial<Debt> = {}): Debt {
    return {
        id: "d1",
        label: "Emprunt",
        remaining_amount: 50000,
        monthly_repayment: 1000,
        ...overrides,
    } as Debt;
}

export function makeInventory(overrides: Partial<InventoryItem> = {}): InventoryItem {
    return {
        id: "i1",
        name: "Stock A",
        quantity: 10,
        unit_cost: 200,
        ...overrides,
    } as InventoryItem;
}

export function makeReceivable(overrides: Partial<Receivable> = {}): Receivable {
    return {
        id: "r1",
        customer_id: "c1",
        amount: 3000,
        due_date: "2025-03-31",
        ...overrides,
    } as Receivable;
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
    return {
        id: "g1",
        metric_name: "Revenue",
        target_value: 10000,
        current_value: 8000,
        ...overrides,
    } as Goal;
}

// Point d'entree commun des tests : garde une date stable pour les calculs M-1/M-2.
export function makeCalc(overrides: {
    transactions?: Transaction[];
    customers?: Customer[];
    marketingMetrics?: MarketingMetrics[];
    products?: Product[];
    debts?: Debt[];
    receivables?: Receivable[];
    inventory?: InventoryItem[];
    goals?: Goal[];
    refDate?: Date;
} = {}) {
    return new MetricsCalculator(
        overrides.transactions ?? [],
        overrides.customers    ?? [],
        overrides.marketingMetrics ?? [],
        overrides.products     ?? [],
        overrides.debts        ?? [],
        overrides.receivables  ?? [],
        overrides.inventory    ?? [],
        overrides.goals        ?? [],
        overrides.refDate ?? REF_DATE,
    );
}

