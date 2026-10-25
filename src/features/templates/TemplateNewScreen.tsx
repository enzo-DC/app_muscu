import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import fieldStyles from '../../components/Field.module.css';
import { Screen } from '../../components/Screen';
import { createTemplate, nextTemplateName } from '../../db/templates';
import { t } from '../../lib/strings';
import styles from './Template.module.css';

export function TemplateNewScreen() {
  const suggestedName = useLiveQuery(nextTemplateName);
  return (
    <Screen title={t.templates.newTitle} backTo="/">
      {suggestedName !== undefined && <NewTemplateForm suggestedName={suggestedName} />}
    </Screen>
  );
}

function NewTemplateForm({ suggestedName }: { suggestedName: string }) {
  const navigate = useNavigate();
  const [name, setName] = useState(suggestedName);
  const canSubmit = name.trim() !== '';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const id = await createTemplate(name);
    // On enchaîne directement sur le choix des exercices
    navigate(`/modeles/${id}/exercices`, { replace: true });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={fieldStyles.field}>
        <label className={fieldStyles.label} htmlFor="template-name">
          {t.templates.nameLabel}
        </label>
        <span className={fieldStyles.hint}>{t.templates.nameHint}</span>
        <input
          id="template-name"
          className={fieldStyles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          autoComplete="off"
        />
      </div>
      <Button type="submit" variant="primary" block disabled={!canSubmit}>
        {t.templates.create}
      </Button>
    </form>
  );
}
