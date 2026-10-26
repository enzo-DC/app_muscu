import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberStepper } from './NumberStepper';

const props = { step: 2.5, unit: 'kg', label: 'Charge', decimal: true };

describe('NumberStepper', () => {
  it('deux taps rapides font deux pas, même si la valeur n’est pas encore revenue', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // La valeur ne change pas : on simule une base de données qui n'a pas encore répondu
    render(<NumberStepper {...props} value={40} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Plus — Charge' }));
    await user.click(screen.getByRole('button', { name: 'Plus — Charge' }));
    expect(onChange.mock.calls).toEqual([[42.5], [45]]);
    expect(screen.getByRole('textbox', { name: 'Charge' })).toHaveValue('45');
  });

  it('se recale sur le pas', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper {...props} value={41} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Moins — Charge' }));
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it('ne descend pas sous zéro et accepte la virgule au clavier', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper {...props} value={undefined} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Moins — Charge' })).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Charge' }), '37,5');
    expect(onChange).toHaveBeenLastCalledWith(37.5);
  });
});
