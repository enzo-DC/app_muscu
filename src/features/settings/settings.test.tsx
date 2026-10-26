import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { exportBackup } from '../../db/backup';
import { db } from '../../db/schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/reglages']}>
      <App />
    </MemoryRouter>,
  );
}

describe('sauvegarde depuis les réglages', () => {
  it('importe une sauvegarde après confirmation et remplace les données', async () => {
    const user = userEvent.setup();
    const backup = await exportBackup(new Date(2026, 9, 12, 18, 5).getTime());
    backup.templates = [{ id: 'tpl', name: 'Modèle sauvegardé', exercises: [], createdAt: 1, updatedAt: 1 }];
    await db.templates.add({ id: 'autre', name: 'Modèle actuel', exercises: [], createdAt: 2, updatedAt: 2 });

    renderSettings();
    const file = new File([JSON.stringify(backup)], 'carnet.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Importer une sauvegarde', { selector: 'input' }), file);

    const dialog = await screen.findByRole('dialog', { name: 'Remplacer tes données ?' });
    expect(within(dialog).getByText(/lundi 12 octobre à 18:05/)).toBeInTheDocument();
    expect(within(dialog).getByText(/0 séance · 1 modèle · \d+ exercices/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Importer et remplacer' }));

    expect(await screen.findByText('Sauvegarde importée : tout est revenu.')).toBeInTheDocument();
    expect((await db.templates.toArray()).map((t) => t.name)).toEqual(['Modèle sauvegardé']);
  });

  it('refuse un fichier qui n’est pas une sauvegarde, sans rien toucher', async () => {
    const user = userEvent.setup();
    renderSettings();
    const file = new File(['{"app":"autre"}'], 'x.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Importer une sauvegarde', { selector: 'input' }), file);
    expect(await screen.findByText(/Import impossible\. Ce fichier ne vient pas de Fonte/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exporte un fichier JSON nommé avec la date', async () => {
    const user = userEvent.setup();
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    renderSettings();
    await user.click(await screen.findByRole('button', { name: 'Exporter mes données' }));
    expect(await screen.findByText('Sauvegarde prête.')).toBeInTheDocument();
    expect(click).toHaveBeenCalled();
    const content = JSON.parse(await created[0]!.text());
    expect(content).toMatchObject({ app: 'carnet-de-salle', format: 1 });
    expect(content.exercises.length).toBeGreaterThan(20);
    click.mockRestore();
  });
});

describe('réglages', () => {
  it('enregistre le temps de repos, le pas de charge et la vibration', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reglages']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText('1:30')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Plus de repos' }));
    expect(await screen.findByText('1:45')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /1,25/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Vibrer' }));
    await user.click(screen.getByRole('checkbox', { name: 'Son à la fin du repos' }));

    await expect.poll(() => db.settings.get('singleton')).toEqual({
      id: 'singleton',
      defaultRestSeconds: 105,
      weightStep: 1.25,
      vibrate: false,
      sound: false,
    });
  });
});
