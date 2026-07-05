(function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('active', p.id === `tab-${target}`));

      if (window.OceanTab) {
        if (target === 'ocean') window.OceanTab.resume();
        else window.OceanTab.stopSound();
      }
    });
  });

  if (window.OceanTab) window.OceanTab.init();
  if (window.AngelTab) window.AngelTab.init();
  if (window.BoomingTab) window.BoomingTab.init();
  if (window.ElementsTab) window.ElementsTab.init();
  if (window.SpellSchoolsTab) window.SpellSchoolsTab.init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
