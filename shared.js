// Fullscreen keeps the model, its controls and live output cards together.
(() => {
  const model = document.querySelector('.workspace');
  const button = document.querySelector('#fullscreen');
  let inactive = [];

  function sync() {
    const active = document.fullscreenElement === model || model.classList.contains('is-fullscreen');
    button.textContent = active ? 'Exit Full Screen' : 'Full Screen';
    button.setAttribute('aria-pressed', String(active));
    document.body.classList.toggle('model-fullscreen', active);
    if (active && !inactive.length) {
      for (const control of document.querySelectorAll('button, input, [tabindex]')) {
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
