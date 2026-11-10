/** Keep navigable links in this installation, including links rendered from markdown or records. */
export function restrictNavigation(doc: Document): void {
  const base = new URL(doc.baseURI);
  const prefix = base.pathname.endsWith('/') ? base.pathname : base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1);
  const selector = 'a[href], area[href], a[ping], area[ping]';

  function sanitize(link: Element): boolean {
    link.removeAttribute('ping');
    const href = link.getAttribute('href');
    if (href === null) return true;
    try {
      const url = new URL(href, base);
      if (link.hasAttribute('download') && url.protocol === 'blob:' && url.origin === base.origin) return true;
      if (url.origin === base.origin && url.protocol === base.protocol &&
          (url.pathname === base.pathname || (base.protocol !== 'file:' && url.pathname.startsWith(prefix)))) return true;
    } catch { /* Malformed links have no destination. */ }
    link.removeAttribute('href');
    link.removeAttribute('target');
    return false;
  }

  function scan(root: Element): void {
    if (root.matches(selector)) sanitize(root);
    root.querySelectorAll(selector).forEach(sanitize);
  }

  scan(doc.documentElement);
  new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === 'attributes' && change.target instanceof Element && change.target.matches(selector)) sanitize(change.target);
      change.addedNodes.forEach((node) => { if (node instanceof Element) scan(node); });
    }
  }).observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['href', 'ping'] });

  for (const type of ['click', 'auxclick', 'contextmenu']) {
    doc.addEventListener(type, (event) => {
      const link = event.composedPath().find((node): node is Element => node instanceof Element && node.matches(selector));
      if (link && !sanitize(link)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }
}
