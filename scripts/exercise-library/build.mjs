// Fusionne source.json (free-exercise-db) et les traductions fr/*.json en src/db/library.json,
// la bibliothèque d'exercices chargée dans l'app.
//
// Usage : node scripts/exercise-library/build.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(join(here, 'source.json'), 'utf8'));
const fr = Object.assign(
  {},
  ...readdirSync(join(here, 'fr'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(here, 'fr', f), 'utf8'))),
);

// Muscles de free-exercise-db → muscles du schéma (body-highlighter)
const MUSCLES = {
  abdominals: ['abs'],
  abductors: ['abductors'],
  adductors: ['adductor'],
  biceps: ['biceps'],
  calves: ['calves'],
  chest: ['chest'],
  forearms: ['forearm'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  lats: ['upper-back'],
  'lower back': ['lower-back'],
  'middle back': ['upper-back'],
  neck: ['neck'],
  quadriceps: ['quadriceps'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  traps: ['trapezius'],
  triceps: ['triceps'],
};

// Zone de l'app, d'après le muscle principal
const GROUP = {
  abdominals: 'abdos',
  biceps: 'bras',
  triceps: 'bras',
  forearms: 'bras',
  shoulders: 'epaules',
  chest: 'pecs',
  lats: 'dos',
  'middle back': 'dos',
  'lower back': 'dos',
  traps: 'dos',
  quadriceps: 'jambes',
  hamstrings: 'jambes',
  glutes: 'jambes',
  calves: 'jambes',
  abductors: 'jambes',
  adductors: 'jambes',
};

const EQUIPMENT = {
  machine: 'machine',
  cable: 'poulie',
  dumbbell: 'halteres',
  barbell: 'barre',
  'e-z curl bar': 'barre_ez',
  'body only': 'poids_du_corps',
};

const LEVEL = { beginner: 'debutant', intermediate: 'intermediaire', expert: 'avance' };

const toMuscles = (list) => [...new Set(list.flatMap((m) => MUSCLES[m] ?? []))];

const missing = source.filter((e) => !fr[e.id]).map((e) => e.id);
const unknown = Object.keys(fr).filter((id) => !source.some((e) => e.id === id));
if (missing.length || unknown.length) {
  console.error('Traductions manquantes :', missing);
  console.error('Traductions sans exercice :', unknown);
  process.exit(1);
}

const library = source.map((e) => {
  const primary = toMuscles(e.primaryMuscles);
  const secondary = toMuscles(e.secondaryMuscles).filter((m) => !primary.includes(m));
  const group = GROUP[e.primaryMuscles[0]];
  if (!group) throw new Error(`Zone inconnue pour ${e.id}`);
  return {
    id: e.id,
    name: fr[e.id].n,
    group,
    kind: e.equipment === 'body only' ? 'poids_du_corps' : 'charge',
    equipment: EQUIPMENT[e.equipment],
    level: LEVEL[e.level] ?? 'intermediaire',
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    instructions: fr[e.id].i,
    images: e.images.map((_, n) => `exercises/${e.id}/${n}.webp`),
  };
});

const out = join(here, '../../src/db/library.json');
writeFileSync(out, JSON.stringify(library) + '\n');
const byGroup = {};
for (const e of library) byGroup[e.group] = (byGroup[e.group] ?? 0) + 1;
console.log(`${library.length} exercices → ${out}`, byGroup);
