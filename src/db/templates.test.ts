import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './schema';
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  moveTemplateExercise,
  nextTemplateName,
  renameTemplate,
  setTargetSets,
  toggleTemplateExercise,
} from './templates';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const exerciseIds = (id: string) => getTemplate(id).then((t) => t?.exercises.map((e) => e.exerciseId));

describe('modèles de séance', () => {
  it('crée un modèle vide avec un nom nettoyé', async () => {
    const id = await createTemplate('  Haut du corps ');
    expect(await getTemplate(id)).toMatchObject({ name: 'Haut du corps', exercises: [] });
  });

  it('propose Séance A, B, C… selon les modèles existants', async () => {
    expect(await nextTemplateName()).toBe('Séance A');
    await createTemplate('Séance A');
    await createTemplate('Jambes');
    expect(await nextTemplateName()).toBe('Séance B');
  });

  it('liste les modèles dans l’ordre de création', async () => {
    await createTemplate('Premier');
    await new Promise((r) => setTimeout(r, 2));
    await createTemplate('Second');
    expect((await listTemplates()).map((t) => t.name)).toEqual(['Premier', 'Second']);
  });

  it('ajoute un exercice avec 3 séries par défaut, puis le retire au second appel', async () => {
    const id = await createTemplate('A');
    await toggleTemplateExercise(id, 'ex1');
    expect((await getTemplate(id))?.exercises).toEqual([{ exerciseId: 'ex1', targetSets: 3 }]);
    await toggleTemplateExercise(id, 'ex1');
    expect((await getTemplate(id))?.exercises).toEqual([]);
  });

  it('réordonne avec monter / descendre, sans sortir des bornes', async () => {
    const id = await createTemplate('A');
    for (const ex of ['a', 'b', 'c']) await toggleTemplateExercise(id, ex);
    await moveTemplateExercise(id, 'c', -1);
    expect(await exerciseIds(id)).toEqual(['a', 'c', 'b']);
    await moveTemplateExercise(id, 'a', -1); // déjà en haut
    expect(await exerciseIds(id)).toEqual(['a', 'c', 'b']);
    await moveTemplateExercise(id, 'a', 1);
    expect(await exerciseIds(id)).toEqual(['c', 'a', 'b']);
    await moveTemplateExercise(id, 'b', 1); // déjà en bas
    expect(await exerciseIds(id)).toEqual(['c', 'a', 'b']);
  });

  it('borne le nombre de séries entre 1 et 10', async () => {
    const id = await createTemplate('A');
    await toggleTemplateExercise(id, 'a');
    await setTargetSets(id, 'a', 0);
    expect((await getTemplate(id))?.exercises[0]?.targetSets).toBe(1);
    await setTargetSets(id, 'a', 12);
    expect((await getTemplate(id))?.exercises[0]?.targetSets).toBe(10);
  });

  it('met à jour updatedAt et ignore un renommage vide', async () => {
    const id = await createTemplate('A');
    const before = (await getTemplate(id))!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await renameTemplate(id, '  ');
    await renameTemplate(id, 'B');
    const after = (await getTemplate(id))!;
    expect(after.name).toBe('B');
    expect(after.updatedAt).toBeGreaterThan(before);
  });

  it('supprime un modèle sans toucher à l’historique', async () => {
    const id = await createTemplate('A');
    await db.sessions.add({ id: 's', templateId: id, name: 'A', startedAt: 1, finishedAt: 2, exercises: [] });
    await deleteTemplate(id);
    expect(await getTemplate(id)).toBeUndefined();
    expect(await db.sessions.count()).toBe(1);
  });
});
