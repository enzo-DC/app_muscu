import type { MuscleGroup } from '../db/schema';

/** Tous les textes de l'interface. Français, tutoiement, phrases courtes. */
export const t = {
  appName: 'Carnet de salle',

  tabs: {
    sessions: 'Séances',
    history: 'Historique',
    exercises: 'Exercices',
  },

  back: 'Retour',

  home: {
    title: 'Séances',
    settings: 'Réglages',
    emptyText: 'Pas encore de séance. Crée ta première pour commencer.',
    emptyCta: 'Créer ma première séance',
  },

  history: {
    title: 'Historique',
    empty: 'Aucune séance terminée pour l’instant. Elles apparaîtront ici.',
  },

  exercises: {
    title: 'Exercices',
  },

  settings: {
    title: 'Réglages',
  },

  templates: {
    newTitle: 'Nouveau modèle',
  },

  notFound: {
    title: 'Page introuvable',
    text: 'Cette page n’existe pas.',
    cta: 'Retour aux séances',
  },

  groups: {
    jambes: 'Jambes',
    dos: 'Dos',
    pecs: 'Pecs',
    epaules: 'Épaules',
    bras: 'Bras',
    abdos: 'Abdos',
    cardio: 'Cardio',
  } satisfies Record<MuscleGroup, string>,
} as const;
