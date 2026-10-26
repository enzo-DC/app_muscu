import { beforeEach, describe, expect, it } from 'vitest';
import { BackupError, backupFileName, exportBackup, parseBackup, restoreBackup, summarize } from './backup';
import { db } from './schema';
import { completeSet, finishSession, startSession, updateSet } from './sessions';
import { createTemplate, toggleTemplateExercise } from './templates';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function fillData() {
  const press = (await db.exercises.filter((e) => e.name === 'Presse à cuisses').first())!;
  await db.exercises.update(press.id, { note: 'cran 4' });
  const tpl = await createTemplate('Séance A');
  await toggleTemplateExercise(tpl, press.id);
  const s = await startSession(tpl);
  await updateSet(s, 0, 0, { weightKg: 40 });
  await completeSet(s, 0, 0);
  await finishSession(s);
  await db.settings.update('singleton', { defaultRestSeconds: 120 });
}

describe('sauvegarde', () => {
  it('export puis import dans une base vide : on retrouve tout', async () => {
    await fillData();
    const before = await exportBackup(0);
    const file = JSON.stringify(before);

    // « Autre navigateur » : base neuve
    await db.delete();
    await db.open();
    await restoreBackup(parseBackup(file));

    const after = await exportBackup(0);
    expect(after).toEqual(before);
    expect((await db.exercises.filter((e) => e.note === 'cran 4').count())).toBe(1);
    expect((await db.settings.get('singleton'))?.defaultRestSeconds).toBe(120);
  });

  it('l’import remplace les données actuelles', async () => {
    await fillData();
    const backup = await exportBackup();
    await createTemplate('Modèle créé après la sauvegarde');
    await restoreBackup(backup);
    expect((await db.templates.toArray()).map((t) => t.name)).toEqual(['Séance A']);
  });

  it('résume le contenu d’une sauvegarde', async () => {
    await fillData();
    const summary = summarize(await exportBackup(123));
    expect(summary).toMatchObject({ templates: 1, sessions: 1, exportedAt: 123 });
    expect(summary.exercises).toBeGreaterThan(20);
  });

  it('refuse les fichiers invalides avec un message clair', () => {
    expect(() => parseBackup('pas du json')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"autre"}')).toThrow(/ne vient pas de Fonte/);
    expect(() => parseBackup('{"app":"carnet-de-salle","format":99}')).toThrow(/version plus récente/);
    expect(() =>
      parseBackup('{"app":"carnet-de-salle","format":1,"exercises":[],"templates":[],"sessions":"x","settings":[]}'),
    ).toThrow(/incomplète/);
  });

  it('un import raté ne touche pas aux données (tout ou rien)', async () => {
    await fillData();
    const backup = await exportBackup();
    const broken = { ...backup, sessions: [backup.sessions[0]!, backup.sessions[0]!] }; // id en double → échec
    await expect(restoreBackup(broken)).rejects.toThrow();
    expect(await db.templates.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
  });

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName(new Date(2026, 9, 26, 22).getTime())).toBe('fonte-2026-10-26.json');
  });
});
