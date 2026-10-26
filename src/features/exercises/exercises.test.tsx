import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import library from '../../db/library.json';
import { ensureLibrary, type LibraryExercise } from '../../db/library';
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
  it('affiche une carte par zone, et une zone liste ses exercices', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    const legs = await screen.findByRole('link', { name: 'Jambes, 6 exercices' });
    expect(screen.getByRole('link', { name: /^Dos, \d+ exercices$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Cardio, 3 exercices$/ })).toBeInTheDocument();

    await user.click(legs);
    expect(await screen.findByRole('heading', { level: 1, name: 'Jambes' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Presse à cuisses/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tirage vertical/ })).not.toBeInTheDocument();
  });

  it('recherche dans toutes les zones, sans tenir compte des accents', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await screen.findByRole('link', { name: /^Jambes/ });
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un exercice' }), 'developpe');
    expect(screen.getByRole('link', { name: /Développé couché/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Jambes/ })).not.toBeInTheDocument(); // les cartes laissent place aux résultats
  });

  it('propose d’ajouter un exercice introuvable, puis le montre dans sa zone', async () => {
    const user = userEvent.setup();
    renderAt('/exercices');
    await screen.findByRole('link', { name: /^Jambes/ });
    await user.type(screen.getByRole('searchbox'), 'Mon exo');
    await user.click(screen.getByRole('link', { name: 'Ajouter « Mon exo »' }));

    expect(screen.getByLabelText('Nom')).toHaveValue('Mon exo');
    const submit = screen.getByRole('button', { name: 'Ajouter l’exercice' });
    expect(submit).toBeDisabled(); // zone pas encore choisie
    await user.click(screen.getByRole('radio', { name: 'Jambes' }));
    await user.click(submit);

    expect(await screen.findByRole('heading', { level: 1, name: 'Jambes' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Mon exo/ })).toBeInTheDocument();
  });

  it('depuis une zone, « nouvel exercice » pré-choisit la zone', async () => {
    const user = userEvent.setup();
    renderAt('/exercices/zone/dos');
    await user.click(await screen.findByRole('link', { name: '+ Nouvel exercice dans cette zone' }));
    expect(screen.getByRole('radio', { name: 'Dos' })).toBeChecked();
  });

  it('enregistre la note automatiquement', async () => {
    const user = userEvent.setup();
    renderAt('/exercices/zone/jambes');
    await user.click(await screen.findByRole('link', { name: /Leg curl/ }));
    await user.type(await screen.findByLabelText('Note'), 'cran 4');
    await waitFor(async () => {
      const ex = await db.exercises.filter((e) => e.name === 'Leg curl').first();
      expect(ex?.note).toBe('cran 4');
    });
  });

  it('demande confirmation avant de supprimer', async () => {
    const user = userEvent.setup();
    renderAt('/exercices/zone/jambes');
    await user.click(await screen.findByRole('link', { name: /Leg curl/ }));
    await user.click(await screen.findByText('Modifier l’exercice'));
    await user.click(screen.getByRole('button', { name: 'Supprimer l’exercice' }));

    const dialog = screen.getByRole('dialog', { name: 'Supprimer cet exercice ?' });
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(await db.exercises.filter((e) => e.name === 'Leg curl').count()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Supprimer l’exercice' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));
    await screen.findByRole('heading', { level: 1, name: 'Jambes' });
    expect(screen.queryByRole('link', { name: /Leg curl/ })).not.toBeInTheDocument();
  });
});

describe('exercices de la bibliothèque', () => {
  beforeEach(async () => {
    await ensureLibrary(() => Promise.resolve(library as LibraryExercise[]));
  });

  it('la fiche montre photos, muscles ciblés et consignes en français', async () => {
    const press = (await db.exercises.where('libraryId').equals('Leg_Press').first())!;
    renderAt(`/exercices/${press.id}`);

    expect(await screen.findByRole('heading', { level: 1, name: 'Presse à cuisses' })).toBeInTheDocument();
    expect(screen.getByText('Machine · Débutant')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Presse à cuisses : position de départ/ })).toHaveAttribute(
      'src',
      '/exercises/Leg_Press/0.webp',
    );
    expect(screen.getByRole('img', { name: /Muscles travaillés : Quadriceps\. Secondaires : .*Mollets/ })).toBeInTheDocument();
    const steps = within(screen.getByRole('region', { name: 'Comment faire' })).getAllByRole('listitem');
    expect(steps[0]).toHaveTextContent(/plateforme/);
  });

  it('filtre une zone par matériel', async () => {
    const user = userEvent.setup();
    renderAt('/exercices/zone/pecs');
    await screen.findByRole('heading', { level: 1, name: 'Pecs' });
    const all = (await screen.findByText(/^\d+ exercices$/)).textContent;

    await user.click(screen.getByRole('radio', { name: 'Machine' }));
    const machines = screen.getByText(/^\d+ exercices$/).textContent;
    expect(machines).not.toBe(all);
    expect(screen.getByRole('link', { name: /Butterfly/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Pompes/ })).not.toBeInTheDocument();
  });
});
