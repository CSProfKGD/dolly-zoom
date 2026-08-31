import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DollyZoomDemo } from './components/DollyZoomDemo';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DollyZoomDemo />
  </StrictMode>,
);
