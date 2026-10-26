import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { ensureLibrary } from './db/library';
import './styles/tokens.css';
import './styles/global.css';
import './styles/glass.css';

// Demande au navigateur de ne jamais effacer nos données pour faire de la place
void navigator.storage?.persist?.().catch(() => undefined);

// Ajoute ou complète la bibliothèque d'exercices (une seule fois par version)
void ensureLibrary().catch((error: unknown) => console.error('Import de la bibliothèque impossible', error));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
