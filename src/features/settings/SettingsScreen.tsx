import { Screen } from '../../components/Screen';
import { t } from '../../lib/strings';

export function SettingsScreen() {
  return (
    <Screen title={t.settings.title} backTo="/">
      {null}
    </Screen>
  );
}
