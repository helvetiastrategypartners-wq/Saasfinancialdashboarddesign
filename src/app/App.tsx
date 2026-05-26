import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <DateRangeProvider>
          <AuthProvider>
            <Suspense fallback={<div className="p-8 text-center">Chargement de la page...</div>}>
              <RouterProvider router={router} />
            </Suspense>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </DateRangeProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
