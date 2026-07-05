(function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('active', p.id === `tab-${target}`));

      if (target === 'angel' && window.OceanTab) {
        window.OceanTab.stopSound();
      } else if (target === 'ocean' && window.OceanTab) {
        window.OceanTab.resume();
      }
    });
  });

  if (window.OceanTab) window.OceanTab.init();
  if (window.AngelTab) window.AngelTab.init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
