import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('navigation', () => {
  it('affiche l’accueil et l’état vide au premier lancement', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Séances' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer ma première séance' })).toBeInTheDocument();
  });

  it('change d’écran via la barre d’onglets', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Historique' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Historique' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Historique' })).toHaveAttribute('aria-current', 'page');
  });

  it('les réglages ont un bouton retour', () => {
    renderAt('/reglages');
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/');
  });
});
