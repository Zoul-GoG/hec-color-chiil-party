/* global localStorage, matchMedia, document */
// Applies the saved/system theme before first paint (anti-flash, docs/06 §3).
(function () {
  try {
    var t = localStorage.getItem('hcc-theme');
    var d = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', d);
  } catch {
    /* storage unavailable: keep light */
  }
})();
