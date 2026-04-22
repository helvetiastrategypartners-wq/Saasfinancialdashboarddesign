import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { MetricsProvider } from './contexts/MetricsContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DateRangeProvider } from './contexts/DateRangeContext';

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <DateRangeProvider>
          <MetricsProvider>
            <RouterProvider router={router} />
          </MetricsProvider>
        </DateRangeProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}