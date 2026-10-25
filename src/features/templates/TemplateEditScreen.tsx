import { Screen } from '../../components/Screen';
import { t } from '../../lib/strings';

export function TemplateEditScreen() {
  return (
    <Screen title={t.templates.newTitle} backTo="/">
      {null}
    </Screen>
  );
}
