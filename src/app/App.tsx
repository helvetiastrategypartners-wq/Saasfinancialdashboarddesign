import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { MetricsProvider } from './contexts/MetricsContext';

export default function App() {
  return (
    <ThemeProvider>
      <MetricsProvider>
        <RouterProvider router={router} />
      </MetricsProvider>
    </ThemeProvider>
  );
}