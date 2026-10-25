# CLAUDE.md — Carnet de salle

Ce fichier explique à Claude Code le projet, les choix techniques, les règles de design et la façon de travailler. Lis-le en entier avant d'écrire du code.

---

## 1. Le projet en une phrase

Une **webapp mobile** qui sert de **carnet d'entraînement** à quelqu'un qui débute la musculation : il crée ses séances, note les charges et les répétitions sur chaque machine, et voit tout de suite ce qu'il a fait la dernière fois pour progresser.

### Pour qui
- **Un seul utilisateur** : un débutant en salle. Il ne connaît pas encore le vocabulaire (« série », « RPE », « 1RM »…).
- Il utilise l'app **debout, entre deux séries, téléphone en main**, parfois avec les mains moites ou des gants. Il doit pouvoir tout faire **d'un pouce, en 2 ou 3 taps**.
- Il ne doit **jamais se perdre** : à tout moment il sait où il est et comment revenir en arrière.

### Ce que l'app N'EST PAS
- Pas de réseau social, pas de comptes, pas de connexion.
- Pas de coach IA, pas de plans générés, pas de calcul de calories.
- Pas de gamification lourde (badges, séries de jours, confettis partout).

---

## 2. Stack technique

| Sujet | Choix | Pourquoi |
|---|---|---|
| Build | **Vite** | Rapide, simple |
| UI | **React 18 + TypeScript** (mode `strict`) | Typage des données de séance |
| Style | **CSS Modules** + variables CSS dans `src/styles/tokens.css` | Contrôle total du design, pas de look « template » |
| Animations | **Motion** (`motion/react`, ex-Framer Motion) | Transitions courtes et propres |
| Données | **IndexedDB via Dexie.js** + `dexie-react-hooks` | Tout est stocké sur le téléphone, fonctionne hors ligne |
| Routing | **React Router** | 4–5 écrans seulement |
| Graphiques | **Recharts** (uniquement pour l'écran progression) | Léger, suffisant |
| PWA | **vite-plugin-pwa** | Installable sur l'écran d'accueil, marche sans réseau en salle |
| Tests | **Vitest** + Testing Library | Logique métier et composants clés |

**Pas de backend.** Toutes les données restent sur l'appareil. Une fonction **Exporter / Importer (JSON)** dans les réglages sert de sauvegarde.

N'ajoute pas d'autre dépendance sans me demander. Pas de Tailwind, pas de librairie de composants (MUI, shadcn, Chakra…).

### Commandes
```bash
npm install
npm run dev        # serveur de dev
npm run build      # build de prod
npm run preview    # tester le build (et la PWA)
npm run test       # tests
npm run lint       # ESLint + typecheck
```

---

## 3. Fonctionnalités

### MVP (à faire en premier, dans cet ordre)
1. **Bibliothèque d'exercices** — liste des machines / exercices. Pré-remplie avec ~25 exercices courants de salle (presse à cuisses, tirage vertical, développé couché, rowing assis, leg curl, etc.), classés par zone (Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio). L'utilisateur peut en ajouter, renommer, supprimer, et ajouter une note (ex. : « réglage siège : cran 4 »).
2. **Modèles de séance** — l'utilisateur crée ses séances types (ex. « Séance A – Haut du corps ») = un nom + une liste ordonnée d'exercices avec un nombre de séries cible. Réorganisation par glisser-déposer ou flèches ↑↓.
3. **Séance en cours** (l'écran le plus important, voir §5) — on lance un modèle ou une séance libre, on coche les séries une par une en notant **charge (kg)** et **répétitions**.
4. **« La dernière fois »** — sur chaque exercice de la séance en cours, afficher clairement les charges/reps de la séance précédente pour cet exercice. Pré-remplir les champs avec ces valeurs.
5. **Minuteur de repos** — se lance automatiquement quand on valide une série (durée par défaut 90 s, modifiable). Bandeau en bas de l'écran, vibration (`navigator.vibrate`) à la fin.
6. **Historique** — liste des séances passées (date, nom, durée, nombre de séries), avec le détail en tapant dessus.

### V2 (seulement quand le MVP est fini et testé)
- **Progression par exercice** : courbe de la charge max dans le temps + record personnel.
- Indication de record battu pendant la séance (petit marqueur discret, pas de confettis).
- Exercices au poids du corps (pas de charge) et cardio (durée / distance).
- Calendrier simple des séances du mois.
- Mode sombre automatique.

---

## 4. Modèle de données (Dexie)

```ts
// src/db/schema.ts
type MuscleGroup = 'jambes' | 'dos' | 'pecs' | 'epaules' | 'bras' | 'abdos' | 'cardio';
type ExerciseKind = 'charge' | 'poids_du_corps' | 'cardio';

interface Exercise {
  id: string;            // crypto.randomUUID()
  name: string;
  group: MuscleGroup;
  kind: ExerciseKind;
  note?: string;         // réglages machine, conseils
  archived: boolean;     // on archive au lieu de supprimer si utilisé dans l'historique
  createdAt: number;
}

interface TemplateExercise {
  exerciseId: string;
  targetSets: number;    // ex. 3
  targetReps?: number;   // ex. 10
  restSeconds?: number;  // surcharge du repos par défaut
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];  // l'ordre compte
  createdAt: number;
  updatedAt: number;
}

interface SetEntry {
  weightKg?: number;     // pas de 0.5 kg, 2.5 kg par défaut sur les +/-
  reps?: number;
  durationSec?: number;  // cardio
  done: boolean;
  completedAt?: number;
}

interface SessionExercise {
  exerciseId: string;
  sets: SetEntry[];
  note?: string;
}

interface Session {
  id: string;
  templateId?: string;   // undefined = séance libre
  name: string;
  startedAt: number;
  finishedAt?: number;   // undefined = séance en cours
  exercises: SessionExercise[];
}

interface Settings {
  id: 'singleton';
  defaultRestSeconds: number;  // 90
  weightStep: number;          // 2.5
  vibrate: boolean;
}
```

Règles :
- **Une seule séance en cours à la fois.** Si l'app est fermée en pleine séance, on la retrouve exactement où on l'avait laissée.
- **Sauvegarde à chaque modification** (pas de bouton « Enregistrer »). Chaque saisie est écrite immédiatement dans IndexedDB.
- Toute la logique d'accès aux données passe par `src/db/` (fonctions `getLastPerformance(exerciseId)`, `startSession(templateId)`, etc.). Les composants n'appellent jamais Dexie directement.
- Prévoir une version de schéma Dexie et des migrations dès le départ.

---

## 5. Écrans et navigation

Navigation par **barre d'onglets en bas** (3 onglets max) :

```
[ Séances ]   [ Historique ]   [ Exercices ]
```
Réglages accessibles par une icône en haut de l'écran Séances.

### Écran « Séances » (accueil)
- Si une séance est en cours : grosse carte en haut « Reprendre la séance » (impossible à rater).
- Liste des modèles de séance, chacun avec un bouton **Démarrer**.
- Bouton secondaire « Séance libre » et « + Nouveau modèle ».
- État vide (premier lancement) : un texte court qui explique quoi faire + un bouton « Créer ma première séance ». Pas d'illustration générique.

### Écran « Séance en cours » ⭐
C'est 80 % de l'usage, il doit être parfait.
- En haut : nom de la séance, chrono global, bouton « Terminer ».
- Un exercice = une carte. L'exercice actif est déplié, les autres sont repliés (nom + progression « 2/3 séries »).
- Pour chaque série, une ligne :
  ```
  Série 1   [ − ] 40 kg [ + ]   [ − ] 10 reps [ + ]   [ ✓ ]
            dernière fois : 37,5 kg × 10
  ```
- Les boutons **− / +** font au minimum **48 × 48 px**. Taper sur le nombre ouvre le clavier numérique (`inputmode="decimal"`).
- Valider une série (✓) : la ligne passe en état « fait », le minuteur de repos démarre, la série suivante est pré-remplie avec les mêmes valeurs.
- « + Ajouter une série » et « + Ajouter un exercice » toujours disponibles.
- Quand tout est coché, l'exercice suivant se déplie automatiquement.
- « Terminer » → petit récapitulatif (durée, nombre de séries, volume total en kg) → retour à l'accueil.
- Quitter une séance non terminée ne la supprime jamais. Supprimer une séance demande une confirmation.

### Écran « Historique »
- Liste chronologique groupée par semaine. Détail d'une séance en tapant dessus.

### Écran « Exercices »
- Liste groupée par zone, recherche en haut. Détail d'un exercice : note, et (V2) courbe de progression.

---

## 6. Direction design

**Objectif : une app qui ressemble à un carnet de salle bien tenu, pas à un template généré par IA.** Simple, lisible, avec du caractère.

### Ce qu'il faut ÉVITER absolument (le « look IA »)
- ❌ Dégradés violet/bleu, fonds en dégradé, effets « glow » ou néon.
- ❌ Glassmorphism (flous, transparences), ombres énormes et diffuses.
- ❌ Police Inter / Roboto / system-ui par défaut partout.
- ❌ Emojis dans l'interface, icônes étoiles ✨, mots « Boost », « Unlock », « Supercharge ».
- ❌ Cartes toutes identiques avec coins très arrondis (24 px+) et icône dans un cercle coloré.
- ❌ Textes marketing (« Votre parcours fitness commence ici ! »). On écrit comme un pote qui explique.

### Ambiance retenue : « carnet d'atelier »
- Fond **papier chaud** (blanc cassé), texte **encre** presque noire, **une seule couleur d'accent** franche utilisée avec parcimonie (bouton principal, série validée, minuteur).
- Les **chiffres sont les héros** : charges et reps en grand, police condensée et chasse fixe (`font-variant-numeric: tabular-nums`) pour que les colonnes s'alignent.
- Séparations par **filets fins** (1 px) plutôt que par des cartes flottantes avec ombre. Rayons de bordure modestes (6–10 px).
- Un petit détail graphique qui donne du caractère : par ex. les numéros de série en style étiquette/tampon, ou un léger quadrillage de carnet en fond de l'écran de séance. Un seul, discret.

### Tokens (dans `src/styles/tokens.css`)
```css
:root {
  /* Couleurs */
  --paper:        #F5F1EA;  /* fond */
  --paper-raised: #FFFDF9;  /* surfaces */
  --ink:          #1C1B19;  /* texte principal */
  --ink-soft:     #6B675F;  /* texte secondaire, « dernière fois » */
  --rule:         #DDD6CA;  /* filets, bordures */
  --accent:       #E4572E;  /* orange brique : action principale, série validée */
  --accent-ink:   #FFFFFF;
  --ok:           #2F7D4F;  /* record / succès (V2) */
  --danger:       #B3261E;

  /* Typo */
  --font-text: "Atkinson Hyperlegible", sans-serif;  /* très lisible */
  --font-num:  "Barlow Condensed", sans-serif;       /* chiffres, titres */

  --fs-xs: 0.8125rem; --fs-sm: 0.9375rem; --fs-md: 1.0625rem;
  --fs-lg: 1.375rem;  --fs-xl: 2rem;      --fs-num: 2.25rem;

  /* Espacements (base 4) */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px;

  --radius: 8px;
  --tap: 48px;  /* taille minimale d'une zone tactile */
}
```
Charger les polices via Google Fonts (ou les auto-héberger pour le hors-ligne de la PWA — préférable).
Tu peux ajuster ces valeurs si quelque chose ne marche pas visuellement, mais garde l'esprit : papier, encre, un accent.

### Lisibilité (non négociable)
- Texte courant ≥ 16 px. Chiffres de saisie ≥ 32 px.
- Contraste WCAG AA minimum partout (vérifie `--ink-soft` sur `--paper`).
- Zones tactiles ≥ 48 px, espacées d'au moins 8 px.
- **Mobile-first**, conçu pour 360–430 px de large. Sur grand écran, contenu centré, largeur max ~480 px.
- Une seule action principale visible par écran (bouton accent). Le reste en secondaire.
- Toujours un titre d'écran clair et un retour visible.

### Animations : petites, utiles, rapides
Les animations servent à **comprendre ce qui se passe**, pas à décorer.
- Durées : **150–250 ms**, easing `easeOut`. Jamais plus de 400 ms.
- Exemples voulus :
  - Valider une série : la case ✓ se remplit, la ligne s'atténue légèrement (scale 0.98 → 1).
  - Les − / + : petit « tick » vertical du chiffre qui change (le nombre glisse vers le haut/bas).
  - Déplier/replier un exercice : animation de hauteur (`layout` de Motion).
  - Minuteur de repos : le bandeau glisse depuis le bas ; barre de progression linéaire.
  - Changement d'écran : fondu + léger glissement horizontal (8–12 px), pas de grands slides.
- Respecter `prefers-reduced-motion` : désactiver les mouvements, garder seulement les fondus.
- Pas d'animation en boucle, pas de skeletons qui clignotent (les données sont locales, elles chargent instantanément).

### Ton des textes
- Français, tutoiement, phrases courtes.
- Vocabulaire simple : « série », « répétitions (reps) », « charge ». Expliquer un terme la première fois si besoin (petite aide « ? »).
- Exemples : « Pas encore de séance. Crée ta première pour commencer. » / « Repos — 1:30 » / « Bien joué, séance terminée. »

---

## 7. Structure du projet

```
src/
  main.tsx
  App.tsx                 # routes + barre d'onglets
  styles/
    tokens.css
    global.css
  db/
    schema.ts             # types + instance Dexie
    seed.ts               # exercices pré-remplis
    sessions.ts           # startSession, finishSession, updateSet...
    exercises.ts
    templates.ts
    backup.ts             # export / import JSON
  features/
    home/
    session/              # écran séance en cours (+ RestTimer)
    history/
    exercises/
    templates/
    settings/
  components/             # composants génériques : Button, Stepper, TabBar, Sheet...
  lib/
    format.ts             # formatage kg, durées, dates (fr-FR)
    stats.ts              # volume, record, dernière perf
```

---

## 8. Règles de travail pour Claude Code

- **Avance par petites étapes** et dans l'ordre du §3. Après chaque fonctionnalité : `npm run lint` + `npm run test` doivent passer, puis vérifie dans le navigateur en vue mobile (390 × 844).
- **Ne refais pas le design à ta sauce** : respecte le §6. Si tu as une meilleure idée, propose-la avant de l'appliquer.
- **Code** : composants fonctionnels, TypeScript strict, pas de `any`. Noms de variables/fonctions en anglais, textes de l'interface en français (centralisés dans `src/lib/strings.ts` pour faciliter les corrections).
- Formatage des nombres en `fr-FR` (virgule décimale : « 37,5 kg »).
- Tester en priorité la logique de `src/db/` et `src/lib/stats.ts` (dernière perf, volume, records).
- Accessibilité : vrais `<button>`, `aria-label` sur les boutons icône, focus visible, ordre de tabulation logique.
- Ne jamais perdre de données : pas de suppression sans confirmation, archivage des exercices utilisés dans l'historique au lieu de les supprimer.
- Pose-moi la question si un besoin n'est pas clair plutôt que d'inventer une fonctionnalité.

---

## 9. Définition de « terminé » pour le MVP

- [ ] Je peux créer un modèle de séance avec 4 exercices en moins d'une minute.
- [ ] Pendant une séance, valider une série prend au plus 1 tap si les valeurs pré-remplies sont bonnes.
- [ ] Je vois la charge de la dernière fois sur chaque exercice.
- [ ] Je ferme l'onglet en pleine séance, je rouvre : tout est là.
- [ ] L'app s'installe sur l'écran d'accueil et marche en mode avion.
- [ ] Export JSON puis import sur un autre navigateur : je retrouve tout.
- [ ] Aucun élément du « look IA » listé au §6.
