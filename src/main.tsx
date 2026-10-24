import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HousingCalculator } from './HousingCalculator';

createRoot(document.getElementById('root')!).render(<StrictMode><HousingCalculator /></StrictMode>);
