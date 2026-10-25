import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { db } from '../../db/schema';

let pressId: string;
let curlId: string;

beforeEach(async () => {
  await db.delete();
  await db.open();
  pressId = (await db.exercises.filter((e) => e.name === 'Presse à cuisses').first())!.id;
  curlId = (await db.exercises.filter((e) => e.name === 'Leg curl').first())!.id;
  await db.templates.add({
    id: 'tpl',
    name: 'Séance A',
    exercises: [
      { exerciseId: pressId, targetSets: 2 },
      { exerciseId: curlId, targetSets: 1 },
    ],
    createdAt: 1,
    updatedAt: 1,
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const card = (name: string) => screen.getByRole('region', { name });

describe('séance en cours', () => {
  it('démarre depuis l’accueil, valide en 1 tap, puis déplie l’exercice suivant', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: 'Démarrer Séance A' }));

    const press = await screen.findByRole('region', { name: 'Presse à cuisses' });
    expect(within(press).getByRole('button', { name: /Presse à cuisses/, expanded: true })).toBeInTheDocument();

    // Saisie de la charge au clavier, puis validation
    const weight = within(press).getByRole('textbox', { name: 'Charge de la série 1, en kilos' });
    await user.type(weight, '37,5');
    await user.click(within(press).getByRole('button', { name: 'Valider la série 1' }));

    // Série 2 pré-remplie avec les mêmes valeurs : 1 tap suffit
    await waitFor(() =>
      expect(within(press).getByRole('textbox', { name: 'Charge de la série 2, en kilos' })).toHaveValue('37,5'),
    );
    expect(within(press).getByText('1/2 séries')).toBeInTheDocument();
    await user.click(within(press).getByRole('button', { name: 'Valider la série 2' }));

    // Exercice fini → le suivant se déplie tout seul
    expect(
      await within(card('Leg curl')).findByRole('button', { name: /Leg curl/, expanded: true }),
    ).toBeInTheDocument();

    const session = await db.sessions.toCollection().first();
    expect(session?.exercises[0]?.sets).toEqual([
      expect.objectContaining({ weightKg: 37.5, reps: 10, done: true }),
      expect.objectContaining({ weightKg: 37.5, reps: 10, done: true }),
    ]);
  });

  it('les boutons − / + changent la charge du pas réglé (2,5 kg)', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: 'Démarrer Séance A' }));
    const press = await screen.findByRole('region', { name: 'Presse à cuisses' });
    const plus = within(press).getByRole('button', { name: 'Plus — Charge de la série 1, en kilos' });
    await user.click(plus);
    await user.click(plus);
    expect(within(press).getByRole('textbox', { name: 'Charge de la série 1, en kilos' })).toHaveValue('5');
  });

  it('on retrouve la séance après avoir fermé l’app', async () => {
    const user = userEvent.setup();
    const first = renderAt('/');
    await user.click(await screen.findByRole('button', { name: 'Démarrer Séance A' }));
    const press = await screen.findByRole('region', { name: 'Presse à cuisses' });
    await user.click(within(press).getByRole('button', { name: 'Valider la série 1' }));
    await within(press).findByText('1/2 séries');
    first.unmount();

    renderAt('/');
    await user.click(await screen.findByRole('link', { name: 'Reprendre la séance' }));
    expect(await screen.findByText('1/2 séries')).toBeInTheDocument();
  });

  it('terminer affiche le récapitulatif puis la séance part dans l’historique', async () => {
    const user = userEvent.setup();
    const sessionId = crypto.randomUUID();
    await db.sessions.add({
      id: sessionId,
      templateId: 'tpl',
      name: 'Séance A',
      startedAt: Date.now() - 30 * 60_000,
      exercises: [
        {
          exerciseId: pressId,
          sets: [
            { weightKg: 40, reps: 10, done: true },
            { weightKg: 40, reps: 10, done: false },
          ],
        },
      ],
    });
    renderAt('/seance');
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));

    const dialog = screen.getByRole('dialog', { name: 'Terminer la séance ?' });
    expect(within(dialog).getByText('400')).toBeInTheDocument(); // volume 40 × 10
    expect(within(dialog).getByText('Les séries non cochées ne seront pas gardées.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Terminer la séance' }));

    expect(await screen.findByText('Bien joué, séance terminée.')).toBeInTheDocument();
    const saved = await db.sessions.get(sessionId);
    expect(saved?.finishedAt).toBeTypeOf('number');
    expect(saved?.exercises[0]?.sets).toHaveLength(1);
  });

  it('pas de « Démarrer » pendant qu’une séance est en cours', async () => {
    await db.sessions.add({ id: 's', name: 'Séance A', startedAt: Date.now(), exercises: [] });
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Reprendre la séance' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Démarrer Séance A' })).not.toBeInTheDocument();
  });
});
