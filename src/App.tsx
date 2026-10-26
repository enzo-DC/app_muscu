import { MotionConfig, motion } from 'motion/react';
import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { spring } from './lib/motion';
import { TabBar } from './components/TabBar';
import { ExerciseDetailScreen } from './features/exercises/ExerciseDetailScreen';
import { ExerciseGroupScreen } from './features/exercises/ExerciseGroupScreen';
import { ExerciseNewScreen } from './features/exercises/ExerciseNewScreen';
import { ExercisesScreen } from './features/exercises/ExercisesScreen';
import { HistoryDetailScreen } from './features/history/HistoryDetailScreen';
import { HistoryScreen } from './features/history/HistoryScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { SessionAddExerciseScreen } from './features/session/SessionAddExerciseScreen';
import { SessionDoneScreen } from './features/session/SessionDoneScreen';
import { SessionScreen } from './features/session/SessionScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { TemplateEditScreen } from './features/templates/TemplateEditScreen';
import { TemplateNewScreen } from './features/templates/TemplateNewScreen';
import { TemplatePickerScreen } from './features/templates/TemplatePickerScreen';
import { NotFound } from './NotFound';

const depth = (pathname: string) => pathname.split('/').filter(Boolean).length;

/**
 * Sens de la navigation, comme sur iOS : un écran plus profond arrive par la droite,
 * un retour arrive par la gauche, un changement d'onglet se fait en fondu.
 */
function useDirection(pathname: string): -1 | 0 | 1 {
  const [state, setState] = useState<{ path: string; direction: -1 | 0 | 1 }>({ path: pathname, direction: 0 });
  if (state.path !== pathname) {
    // Mise à jour pendant le rendu quand le chemin change (motif recommandé par React)
    const delta = depth(pathname) - depth(state.path);
    const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;
    setState({ path: pathname, direction });
    return direction;
  }
  return state.direction;
}

export function App() {
  const location = useLocation();
  const direction = useDirection(location.pathname);

  return (
    // reducedMotion="user" : coupe les déplacements si prefers-reduced-motion, garde les fondus
    <MotionConfig reducedMotion="user" transition={spring.smooth}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: direction * 72 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring.smooth, opacity: { duration: 0.18, ease: 'easeOut' } }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/seance" element={<SessionScreen />} />
          <Route path="/seance/exercices" element={<SessionAddExerciseScreen />} />
          <Route path="/seance/terminee/:id" element={<SessionDoneScreen />} />
          <Route path="/historique" element={<HistoryScreen />} />
          <Route path="/historique/:id" element={<HistoryDetailScreen />} />
          <Route path="/exercices" element={<ExercisesScreen />} />
          <Route path="/exercices/nouveau" element={<ExerciseNewScreen />} />
          <Route path="/exercices/zone/:group" element={<ExerciseGroupScreen />} />
          <Route path="/exercices/:id" element={<ExerciseDetailScreen />} />
          <Route path="/reglages" element={<SettingsScreen />} />
          <Route path="/modeles/nouveau" element={<TemplateNewScreen />} />
          <Route path="/modeles/:id" element={<TemplateEditScreen />} />
          <Route path="/modeles/:id/exercices" element={<TemplatePickerScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
      <TabBar />
    </MotionConfig>
  );
}
