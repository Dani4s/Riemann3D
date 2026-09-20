const selector = document.querySelector('#color-theme');
const allowed = new Set(['original', 'blue', 'violet', 'rose', 'amber']);
function apply(value) {
  const theme = allowed.has(value) ? value : 'original';
  document.documentElement.dataset.theme = theme;
  selector.value = theme;
}
try { apply(localStorage.getItem('riemann3d-theme')); }
catch { apply('original'); }
selector.addEventListener('change', () => {
  apply(selector.value);
  try { localStorage.setItem('riemann3d-theme', selector.value); } catch { /* Sigue funcionando sin almacenamiento. */ }
});
