import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@/lib/api-client';

import App from './App';

import './index.css';

setAuthTokenGetter(() => localStorage.getItem('msrf_access_token'));

createRoot(document.getElementById('root')!).render(<App />);
