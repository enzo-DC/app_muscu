import { MotionConfig, motion } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { TabBar } from './components/TabBar';
import { ExerciseDetailScreen } from './features/exercises/ExerciseDetailScreen';
import { ExerciseNewScreen } from './features/exercises/ExerciseNewScreen';
import { ExercisesScreen } from './features/exercises/ExercisesScreen';
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

export function App() {
  const location = useLocation();

  return (
    // reducedMotion="user" : coupe les déplacements si prefers-reduced-motion, garde les fondus
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: 'easeOut' }}>
      <motion.div key={location.pathname} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/seance" element={<SessionScreen />} />
          <Route path="/seance/exercices" element={<SessionAddExerciseScreen />} />
          <Route path="/seance/terminee/:id" element={<SessionDoneScreen />} />
          <Route path="/historique" element={<HistoryScreen />} />
          <Route path="/exercices" element={<ExercisesScreen />} />
          <Route path="/exercices/nouveau" element={<ExerciseNewScreen />} />
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
