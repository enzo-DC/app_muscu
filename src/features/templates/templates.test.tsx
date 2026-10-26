import { render, screen, within } from '@testing-library/react';
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

describe('modèles de séance', () => {
  it('crée un modèle de 4 exercices en quelques taps', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(await screen.findByRole('link', { name: 'Créer ma première séance' }));
    expect(await screen.findByLabelText('Nom de la séance')).toHaveValue('Séance A');
    await user.click(screen.getByRole('button', { name: 'Créer et choisir les exercices' }));

    // Par zone : on ouvre une carte, on coche, on revient aux zones
    const pick = async (zone: RegExp, names: string[]) => {
      await user.click(await screen.findByRole('button', { name: zone }));
      for (const name of names) await user.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
      await user.click(screen.getByRole('button', { name: 'Toutes les zones' }));
    };
    await pick(/^Jambes/, ['Presse à cuisses', 'Leg curl']);
    expect(await screen.findByRole('button', { name: /^Jambes, 6 exercices, 2 ajoutés$/ })).toBeInTheDocument();
    await pick(/^Dos/, ['Tirage vertical']);
    await pick(/^Pecs/, ['Développé couché']);
    await user.click(await screen.findByRole('button', { name: 'Terminé · 4 exercices' }));

    const list = await screen.findByRole('list', { name: 'Exercices de la séance' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Presse à cuisses'),
      expect.stringContaining('Leg curl'),
      expect.stringContaining('Tirage vertical'),
      expect.stringContaining('Développé couché'),
    ]);

    const tpl = await db.templates.toCollection().first();
    expect(tpl?.name).toBe('Séance A');
    expect(tpl?.exercises.every((e) => e.targetSets === 3)).toBe(true);
  });

  it('réordonne et règle les séries depuis l’éditeur', async () => {
    const user = userEvent.setup();
    const exs = await db.exercises.limit(2).toArray();
    await db.templates.add({
      id: 'tpl',
      name: 'Séance A',
      exercises: exs.map((e) => ({ exerciseId: e.id, targetSets: 3 })),
      createdAt: 1,
      updatedAt: 1,
    });
    renderAt('/modeles/tpl');

    await user.click(await screen.findByRole('button', { name: `Descendre ${exs[0]!.name}` }));
    await user.click(screen.getByRole('button', { name: `Une série de plus pour ${exs[0]!.name}` }));

    await expect.poll(async () => (await db.templates.get('tpl'))?.exercises).toEqual([
      { exerciseId: exs[1]!.id, targetSets: 3 },
      { exerciseId: exs[0]!.id, targetSets: 4 },
    ]);
  });

  it('affiche les modèles sur l’accueil', async () => {
    await db.templates.add({ id: 'tpl', name: 'Haut du corps', exercises: [], createdAt: 1, updatedAt: 1 });
    renderAt('/');
    expect(await screen.findByRole('link', { name: /Haut du corps/ })).toHaveAttribute('href', '/modeles/tpl');
    expect(screen.getByRole('link', { name: '+ Nouveau modèle' })).toBeInTheDocument();
  });
});
