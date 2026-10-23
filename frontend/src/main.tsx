import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import { setupAxiosInterceptors } from './utils/axiosSetup';

// Configure global authentication interceptors for API calls
setupAxiosInterceptors();

// Register PWA service worker for offline capabilities
registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes cache lifetime in memory
      gcTime: 1000 * 60 * 60, // 1 hour memory persistence
      refetchOnWindowFocus: false, // Prevent reload when switching browser tabs
      refetchOnReconnect: false,
      refetchOnMount: false, // Instant restore from cache when navigating between pages!
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
