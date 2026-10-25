import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { db } from '../../db/schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('écran Exercices', () => {
  it('liste les exercices groupés par zone', async () => {
    renderAt('/exercices');
    const legs = await screen.findByRole('region', { name: /Jambes/ });
    expect(within(legs).getByRole('link', { name: /Presse à cuisses/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Cardio/ })).toBeInTheDocument();
  });

  it('filtre avec la recherche, sans tenir compte des accents', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await screen.findByRole('link', { name: /Presse à cuisses/ });
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un exercice' }), 'developpe');
    expect(screen.getByRole('link', { name: /Développé couché/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Presse à cuisses/ })).not.toBeInTheDocument();
  });

  it('propose d’ajouter un exercice introuvable, nom pré-rempli', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await screen.findByRole('link', { name: /Presse à cuisses/ });
    await user.type(screen.getByRole('searchbox'), 'Hip thrust');
    await user.click(screen.getByRole('link', { name: 'Ajouter « Hip thrust »' }));

    expect(screen.getByLabelText('Nom')).toHaveValue('Hip thrust');
    const submit = screen.getByRole('button', { name: 'Ajouter l’exercice' });
    expect(submit).toBeDisabled(); // zone pas encore choisie
    await user.click(screen.getByRole('radio', { name: 'Jambes' }));
    await user.click(submit);

    const legs = await screen.findByRole('region', { name: /Jambes/ });
    expect(within(legs).getByRole('link', { name: /Hip thrust/ })).toBeInTheDocument();
  });

  it('enregistre la note automatiquement', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await user.click(await screen.findByRole('link', { name: /Leg curl/ }));
    await user.type(await screen.findByLabelText('Note'), 'cran 4');
    await waitFor(async () => {
      const ex = await db.exercises.filter((e) => e.name === 'Leg curl').first();
      expect(ex?.note).toBe('cran 4');
    });
  });

  it('demande confirmation avant de supprimer', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await user.click(await screen.findByRole('link', { name: /Leg curl/ }));
    await user.click(await screen.findByRole('button', { name: 'Supprimer l’exercice' }));

    const dialog = screen.getByRole('dialog', { name: 'Supprimer cet exercice ?' });
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(await db.exercises.filter((e) => e.name === 'Leg curl').count()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Supprimer l’exercice' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
    await screen.findByRole('heading', { level: 1, name: 'Exercices' });
    expect(screen.queryByRole('link', { name: /Leg curl/ })).not.toBeInTheDocument();
  });
});
