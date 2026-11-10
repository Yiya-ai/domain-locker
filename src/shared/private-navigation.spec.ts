import { describe, expect, it } from 'vitest';
import { restrictNavigation } from './private-navigation';

describe('private navigation', () => {
  it('strips external destinations and pings from dynamic links and preserves internal navigation', async () => {
    restrictNavigation(document);
    const group = document.createElement('div');
    group.innerHTML = '<a href="//example.invalid/private" ping="/ping"></a><a href="/domains"></a>';
    document.body.append(group);
    await Promise.resolve();
    const [external, internal] = Array.from(group.querySelectorAll('a'));
    expect(external.hasAttribute('href')).toBe(false);
    expect(external.hasAttribute('ping')).toBe(false);
    expect(internal.getAttribute('href')).toBe('/domains');
    external.href = 'mailto:example@example.invalid';
    const click = new MouseEvent('auxclick', { bubbles: true, cancelable: true });
    external.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    group.remove();
  });
});
