// Polyfill for Intl.Locale.prototype.getWeekInfo
export function initializePolyfills() {
  if (typeof Intl !== 'undefined' && 'Locale' in Intl) {
    const LocalePrototype = (Intl.Locale as { prototype: { getWeekInfo?: unknown } }).prototype;

    if (!('getWeekInfo' in LocalePrototype) || typeof LocalePrototype.getWeekInfo !== 'function') {
      // Import and apply polyfill
      import('@formatjs/intl-locale/polyfill').then(() => {
        // Polyfill is now loaded
      }).catch(err => {
        console.warn('Failed to load Intl.Locale polyfill:', err);
      });
    }
  }
}
