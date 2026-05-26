import type {
    Transaction, Customer, MarketingMetrics, CalculatedMetrics,
    Product, Debt, InventoryItem, Receivable, Goal
} from "@shared/types";
export type LastMonthData = {
    revenue: number;
    expenses: number;
    grossMargin: number;
    grossMarginPercent: number;
};

export type MetricsDataUpdate = {
    transactions?: Transaction[];
    customers?: Customer[];
    marketingMetrics?: MarketingMetrics[];
    products?: Product[];
    debts?: Debt[];
    receivables?: Receivable[];
    inventory?: InventoryItem[];
    goals?: Goal[];
    refDate?: Date;
};

export interface MetricsCalculatorApi {
    calculateAll(): CalculatedMetrics;
    updateData(data: MetricsDataUpdate): void;
    getMonthlyNetCashflow(months: number): Array<{ month: string; cash: number }>;
    getMonthlyCashTrend(months: number): Array<{
        month: string;
        netFlow: number;
        variationPercent: number | null;
        cumulativeBalance: number;
    }>;
    getRevenueByChannel(): Record<string, number>;
    getCACByChannel(): Record<string, number>;
    getExpensesByCategory(): Record<string, number>;
    getRevenueForPeriod(start: Date, end: Date): number;
    getExpensesForPeriod(start: Date, end: Date): number;
    calculateConversionRate(): number;
    calculateRetentionRate(): number;
    simulateHiringImpact(monthlySalary: number, expectedRevenueBonus?: number): {
        impactOnBurn: number;
        newBurn: number;
        newRunway: number;
        newNetCashflow: number;
        breakEvenMonths: number;
    };
    calculateMarketingROI(): number;
    calculateClientMargin(customerId: string): number;
    calculateMarginByProduct(productId: string): {
        revenue: number;
        cost: number;
        margin: number;
        marginPercent: number;
    };
    calculateProfitPerProduct(productId: string): number;
    calculateRevenueConcentration(): Record<string, number>;
    simulateScenario(params: Record<string, number>): Record<string, number>;
    calculateUnitMargin(price: number, variableCost: number): number;
    calculateBreakEvenPoint(fixedCosts: number, price: number, variableCost: number): number;
    calculateBreakEvenThreshold(fixedCosts: number, unitMargin: number): number;
    calculateBreakEvenRevenue(fixedCosts: number, price: number, variableCost: number): number;
    getCohortAnalysis(): Record<string, number[]>;
    calculateWorkingCapital(): number;
    calculateDSO(): number;
    calculateDIO(): number;
    calculateDPO(): number;
    calculateCashConversionCycle(): number;
    calculateTotalDebtPayments(): number;
    calculateLeverageRatio(): number;
    calculateDebtService(): number;
    getCohortRevenueAnalysis(): Array<{
        cohort: string;
        label: string;
        size: number;
        months: Array<{ label: string; revenue: number; avgPerCustomer: number }>;
    }>;
    getCashRiskStatus(): { risk: "low" | "medium" | "high"; message: string };
    calculateExpenseVariation(): number;
    getAutomaticInsights(): string[];
    calculateRevenueGrowth(): number;
    calculateAverageGrowth(months: number): number;
    calculateGoalCompletion(targetRevenue: number): number;
    calculateGoalGap(targetRevenue: number): number;
    calculateKPICompletionRate(): number;
    getKPITracking(): Record<string, { target: number; actual: number; completion: number }>;
}

export interface MetricsRuntime extends MetricsCalculatorApi {
    // Runtime shape used by domain method modules attached to MetricsCalculator.
    transactions: Transaction[];
    customers: Customer[];
    marketingMetrics: MarketingMetrics[];
    products: Product[];
    debts: Debt[];
    receivables: Receivable[];
    inventory: InventoryItem[];
    goals: Goal[];
    _lastMonthCache: LastMonthData | null;
    _txByMonthKey: Map<string, Transaction[]>;
    _customerById: Map<string, Customer>;
    _productById: Map<string, Product>;
    _refDate: Date;
    _monthStartEpoch: string;
    _monthStartCache: Map<number, Date>;
    _cashBalance: number;
    buildIndexes(): void;
    monthStart(monthsAgo?: number): Date;
    filterTx(
        start: Date,
        end: Date,
        type?: "income" | "expense",
        status?: string,
    ): Transaction[];
    getDirectCOGS(): number;
    calculateCash(): number;
    calculateBurnRate(): number;
    calculateRunway(): number;
    calculateEBITDA(): number;
    calculateTotalDebt(): number;
    calculateCAC(): number;
    calculateChurnRate(): number;
    calculateCACByChannel(channel?: string): number;
    getCustomerRevenueLastMonth(customerId: string): number;
    getLastMonthData(): LastMonthData;
    getActiveCustomersCount(): number;
    getNewCustomersThisMonth(): number;
    calculateARPU(): number;
    calculateMRR(): number;
    calculatePaybackPeriod(): number;
}
