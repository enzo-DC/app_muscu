import { ButtonLink } from './components/Button';
import { Screen } from './components/Screen';
import { t } from './lib/strings';

export function NotFound() {
  return (
    <Screen title={t.notFound.title} backTo="/">
      <p style={{ marginBottom: 'var(--s5)' }}>{t.notFound.text}</p>
      <ButtonLink to="/" block>
        {t.notFound.cta}
      </ButtonLink>
    </Screen>
  );
}
