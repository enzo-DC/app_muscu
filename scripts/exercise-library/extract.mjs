// Extrait de free-exercise-db (domaine public, Unlicense) les exercices de musculation
// sur machine, poulie, haltères, barres et au poids du corps.
// https://github.com/yuhonas/free-exercise-db
//
// Usage : node scripts/exercise-library/extract.mjs
// Écrit scripts/exercise-library/source.json (à committer : c'est la base des traductions).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const EQUIPMENT = ['machine', 'cable', 'dumbbell', 'barbell', 'body only', 'e-z curl bar'];
const CATEGORIES = ['strength', 'powerlifting'];

const all = await (await fetch(SOURCE_URL)).json();
const selected = all
  .filter((e) => EQUIPMENT.includes(e.equipment) && CATEGORIES.includes(e.category))
  .filter((e) => !e.primaryMuscles.includes('neck'))
  .map(({ id, name, level, equipment, primaryMuscles, secondaryMuscles, instructions, images }) => ({
    id,
    name,
    level,
    equipment,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    images,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const out = join(dirname(fileURLToPath(import.meta.url)), 'source.json');
writeFileSync(out, JSON.stringify(selected, null, 1) + '\n');
console.log(`${selected.length} exercices → ${out}`);
