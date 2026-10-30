import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyAdFreeState } from './lib/subscription';
import { initNative } from './lib/native';
import { initAds } from './ads/adControl';

void initNative();
initAds();
applyAdFreeState();

const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient} >
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
