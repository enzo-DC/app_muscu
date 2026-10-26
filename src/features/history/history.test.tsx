import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { db } from '../../db/schema';

let pressId: string;

beforeEach(async () => {
  await db.delete();
  await db.open();
  pressId = (await db.exercises.filter((e) => e.name === 'Presse à cuisses').first())!.id;
  const start = Date.now() - 60 * 60_000;
  await db.sessions.bulkAdd([
    {
      id: 'done',
      name: 'Séance A',
      startedAt: start,
      finishedAt: start + 45 * 60_000,
      exercises: [
        {
          exerciseId: pressId,
          sets: [
            { weightKg: 40, reps: 10, done: true },
            { weightKg: 42.5, reps: 8, done: true },
          ],
        },
      ],
    },
    { id: 'running', name: 'En cours', startedAt: Date.now(), exercises: [] },
  ]);
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('historique', () => {
  it('liste les séances terminées de la semaine, pas la séance en cours', async () => {
    renderAt('/historique');
    // « La semaine dernière » si le test tourne le lundi juste après minuit
    const week = await screen.findByRole('region', { name: /Cette semaine|La semaine dernière/ });
    expect(within(week).getByRole('link', { name: /Séance A.*45\s+min · 2 séries/ })).toBeInTheDocument();
    expect(screen.queryByText('En cours')).not.toBeInTheDocument();
  });

  it('affiche le détail d’une séance', async () => {
    const user = userEvent.setup();
    renderAt('/historique');
    await user.click(await screen.findByRole('link', { name: /Séance A/ }));

    const press = await screen.findByRole('region', { name: 'Presse à cuisses' });
    expect(within(press).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringMatching(/Série 1\s*40\s+kg × 10/),
      expect.stringMatching(/Série 2\s*42,5\s+kg × 8/),
    ]);
    expect(screen.getByText('740')).toBeInTheDocument(); // volume 400 + 340
  });

  it('supprime une séance après confirmation', async () => {
    const user = userEvent.setup();
    renderAt('/historique/done');
    await user.click(await screen.findByRole('button', { name: 'Supprimer cette séance' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByText(/Aucune séance terminée/)).toBeInTheDocument();
    expect(await db.sessions.get('done')).toBeUndefined();
  });
});
