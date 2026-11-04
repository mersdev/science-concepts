// Fullscreen contains only the interactive model and its live output.
(() => {
  const model = document.querySelector('.stage-wrap');
  const button = document.querySelector('#fullscreen');
  const svg = model.querySelector('#stage > svg');
  const originalViewBox = svg.getAttribute('viewBox');
  const desktop = matchMedia('(min-width: 1000px)');
  const phone = matchMedia('(max-width: 760px)');
  let inactive = [];

  function frameOverview() {
    const active = document.fullscreenElement === model || model.classList.contains('is-fullscreen');
    const viewBox = phone.matches && svg.dataset.phoneViewbox || (desktop.matches && !active && svg.dataset.overviewViewbox ? svg.dataset.overviewViewbox : originalViewBox);
    svg.setAttribute('viewBox', viewBox);
  }
  desktop.addEventListener('change', frameOverview);
  phone.addEventListener('change', frameOverview);
  frameOverview();

  function sync() {
    const active = document.fullscreenElement === model || model.classList.contains('is-fullscreen');
    button.textContent = active ? 'Exit Full Screen' : 'Full Screen';
    button.setAttribute('aria-pressed', String(active));
    document.body.classList.toggle('model-fullscreen', active);
    frameOverview();
    document.dispatchEvent(new CustomEvent('model-fullscreen-change', { detail: active }));
    if (active && !inactive.length) {
      for (const control of document.querySelectorAll('a[href], button, input, [tabindex]')) {
        if (!model.contains(control) && !control.inert) {
          control.inert = true;
          inactive.push(control);
        }
      }
    } else if (!active) {
      for (const control of inactive) control.inert = false;
      inactive = [];
    }
    button.focus({ preventScroll: true });
  }

  button.addEventListener('click', async () => {
    if (document.fullscreenElement === model) {
      await document.exitFullscreen();
    } else if (model.classList.contains('is-fullscreen')) {
      model.classList.remove('is-fullscreen');
      sync();
    } else {
      try {
        if (!model.requestFullscreen) throw new Error('Fullscreen unavailable');
        await model.requestFullscreen();
      } catch {
        model.classList.add('is-fullscreen');
        sync();
      }
    }
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && model.classList.contains('is-fullscreen')) {
      model.classList.remove('is-fullscreen');
      sync();
    }
  });
})();
