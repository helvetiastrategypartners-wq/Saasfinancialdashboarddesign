import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { MetricsProvider } from './contexts/MetricsContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <DateRangeProvider>
          <MetricsProvider>
            <Suspense fallback={<div className="p-8 text-center">Chargement de la page...</div>}>
              <RouterProvider router={router} />
            </Suspense>
            <Toaster richColors position="top-right" />
          </MetricsProvider>
        </DateRangeProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}