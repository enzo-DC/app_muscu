import { MotionConfig, motion } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { TabBar } from './components/TabBar';
import { ExercisesScreen } from './features/exercises/ExercisesScreen';
import { HistoryScreen } from './features/history/HistoryScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { TemplateEditScreen } from './features/templates/TemplateEditScreen';
import { NotFound } from './NotFound';

export function App() {
  const location = useLocation();

  return (
    // reducedMotion="user" : coupe les déplacements si prefers-reduced-motion, garde les fondus
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: 'easeOut' }}>
      <motion.div key={location.pathname} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/historique" element={<HistoryScreen />} />
          <Route path="/exercices" element={<ExercisesScreen />} />
          <Route path="/reglages" element={<SettingsScreen />} />
          <Route path="/modeles/nouveau" element={<TemplateEditScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
      <TabBar />
    </MotionConfig>
  );
}
