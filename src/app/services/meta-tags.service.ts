import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class MetaTagsService {
  private title = inject(Title);
  private meta = inject(Meta);

  // Defaults
  private defaultTitle = 'Domain Locker';
  private defaultDescription =
    'Domain Locker helps you track, monitor, and manage your domains effortlessly. ' +
    'Stay on top of expiration dates, DNS records, and changes with alerts and detailed insights.';
  private defaultKeywords =
    'domain management, domain monitoring, DNS records, change tracking, alerts, SSL, WHOIS, domain security, url alerts';

  // Local fields which can override defaults if set
  private pageTitle?: string;
  private pageDescription?: string;
  private pageKeywords?: string;

  public setRouteMeta(routeName: string) {
    // Set to defaults
    this.reset(false);
    const baseRoute = (routeName || '').split('/')[1];

    // If page has some pre-defined top-level meta tags, set them
    switch (baseRoute) {
      case 'about':
        this.pageTitle = 'Documentation & Helpful Resources';
        this.pageDescription =
          'Tips for managing your domains, getting the most out of Domain Locker, and helpful guides and articles';
        break;
      case 'login':
        this.pageTitle = 'Login';
        this.pageDescription =
          'Log in or sign up to Domain Locker - the all-in-one domain management tool.';
        break;
      case 'domains':
        this.pageTitle = 'Domains';
        break;
      case 'assets':
        this.pageTitle = 'Assets';
        break;
      case 'stats':
        this.pageTitle = 'Stats';
        break;
      case 'value':
        this.pageTitle = 'Valuation Tracking';
        break;
      case 'monitor':
        this.pageTitle = 'Website Monitor';
        break;
      case 'settings':
        this.pageTitle = 'Settings';
        break;
      default:
        break;
    }

    // If a specific route has custom meta tags, set them
    switch (routeName) {
      case '/settings/account':
        this.pageTitle = 'Account Settings';
        break;
    }
    // Apply meta tags
    this.applyTags();
  }

  /* Applies either default or custom meta tags */
  private applyTags() {
    const title = this.pageTitle
      ? `${this.pageTitle} | ${this.defaultTitle}`
      : this.defaultTitle;
    const description = this.pageDescription || this.defaultDescription;
    const keywords = this.pageKeywords || this.defaultKeywords;


    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
  }

  /** Reset to global defaults */
  public reset(apply = true) {
    this.pageTitle = undefined;
    this.pageDescription = undefined;
    this.pageKeywords = undefined;
    if (apply) {
      this.applyTags();
    }
  }

  /** Can be called within a page, to dynamically set meta tags */
  public setCustomMeta(
    customTitle?: string,
    customDesc?: string,
    customKeywords?: string,
  ) {
    this.pageTitle = customTitle || this.defaultTitle;
    this.pageDescription = customDesc || this.defaultDescription;
    this.pageKeywords = customKeywords || this.defaultKeywords;

    this.applyTags();
  }
}
