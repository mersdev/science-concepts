(() => {
  const button = document.querySelector('#language');
  let language = 'zh';
  try { language = localStorage.getItem('primary-language') === 'en' ? 'en' : 'zh'; } catch {}
  const strings = {home:{zh:'Home',en:'Home'},target:{zh:'切换到 English',en:'切换到中文'},fullscreen:{zh:'全屏',en:'Full Screen'},exit:{zh:'退出全屏',en:'Exit Full Screen'}};
  const api = window.primaryLanguage = {
    get: () => language,
    fullscreenLabel: active => strings[active ? 'exit' : 'fullscreen'][language],
    syncFullscreenText: () => {
      const fullscreen = document.querySelector('#fullscreen');
      const label = fullscreen && api.fullscreenLabel(fullscreen.getAttribute('aria-pressed') === 'true');
      if (fullscreen && fullscreen.textContent !== label) fullscreen.textContent = label;
    },
    apply: next => {
      language = next;
      document.documentElement.lang = next === 'zh' ? 'zh-Hans' : 'en';
      document.title = document.querySelector('#stage') ? (next === 'zh' ? '滑轮实验室 · 小学科学' : 'Pulley Lab · Primary Science') : (next === 'zh' ? '小学科学 · Science Concepts' : 'Primary Science · Science Concepts');
      try { localStorage.setItem('primary-language', next); } catch {}
      document.querySelectorAll('[data-zh][data-en]').forEach(el => { el.textContent = el.dataset[next]; });
      if (button) { button.textContent = next === 'zh' ? 'English' : '中文'; button.setAttribute('aria-label', strings.target[next]); }
      api.syncFullscreenText();
      document.dispatchEvent(new Event('primary-language-change'));
    }
  };
  const fullscreen = document.querySelector('#fullscreen');
  if (fullscreen) new MutationObserver(() => api.syncFullscreenText()).observe(fullscreen, {childList:true,subtree:true});
  button?.addEventListener('click', () => api.apply(language === 'zh' ? 'en' : 'zh'));
  api.apply(language);
})();
