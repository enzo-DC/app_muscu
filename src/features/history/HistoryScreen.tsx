import { Screen } from '../../components/Screen';
import { t } from '../../lib/strings';

export function HistoryScreen() {
  return (
    <Screen title={t.history.title}>
      <p>{t.history.empty}</p>
    </Screen>
  );
}
