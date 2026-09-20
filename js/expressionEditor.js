import katex from '../vendor/katex/katex.mjs';
import { expressionToTex } from './expressionValidator.js';

export function mountExpressionEditor() {
  const form = document.querySelector('#calculator'), source = form.elements.expression;
  const dialog = document.querySelector('#expression-editor'), draft = document.querySelector('#expression-draft');
  const preview = document.querySelector('#editor-preview'), error = document.querySelector('#editor-error');
  const apply = document.querySelector('#editor-apply'), keypad = document.querySelector('#editor-keypad');
  let scrollLock;
  function lockPage() {
    const body = document.body, root = document.documentElement;
    scrollLock = { x: window.scrollX, y: window.scrollY, bodyStyle: body.getAttribute('style'), overflow: root.style.overflow };
    const gap = window.innerWidth - root.clientWidth;
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, { position: 'fixed', top: `-${scrollLock.y}px`, left: `-${scrollLock.x}px`, width: '100%', paddingRight: `${padding + gap}px` });
    root.style.overflow = 'hidden';
  }
  function unlockPage() {
    if (!scrollLock) return;
    const saved = scrollLock; scrollLock = null;
    if (saved.bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', saved.bodyStyle);
    document.documentElement.style.overflow = saved.overflow;
    source.focus({ preventScroll: true });
    window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
  }
  const native = () => form.elements.regionType.value === 'polar' && form.elements.coordinates.value === 'polar';
  const variables = () => native() ? ['r', 'theta', 'θ'] : ['x', 'y'];
  const render = (value, target) => {
    const tex = expressionToTex(value, variables());
    katex.render(tex, target, { displayMode: true, throwOnError: true, trust: false, output: 'htmlAndMathml', maxExpand: 1000 });
  };
  function refresh() {
    const target = document.querySelector('#expression-preview');
    try { render(source.value, target); } catch { target.textContent = 'Abre la calculadora para editar la expresión.'; }
  }
  function update() {
    try { render(draft.value, preview); error.textContent = ''; apply.disabled = false; }
    catch (e) { preview.textContent = 'Completa la expresión para ver su formato matemático.'; error.textContent = e.message; apply.disabled = true; }
  }
  function insert(token, wrap = false) {
    const start = draft.selectionStart, end = draft.selectionEnd, selected = draft.value.slice(start, end);
    let value = token, cursor;
    if (wrap) {
      value = `${token}(${selected})`; cursor = selected ? value.length : token.length + 1;
    } else cursor = value.length;
    const before = draft.value.slice(0, start), after = draft.value.slice(end);
    // Multiplicación explícita entre símbolos, funciones y números contiguos.
    const atom = wrap || /^[a-z]/.test(token);
    if ((atom && /[\d.a-zθ)]$/.test(before)) || (/^[\d.]$/.test(token) && /[a-zθ)]$/.test(before))) { value = '*' + value; cursor++; }
    if ((atom || /^[\d.]$/.test(token)) && /^[a-zθ(]/.test(after)) value += '*';
    if (before.length + value.length + after.length > 256) { error.textContent = 'Máximo 256 caracteres.'; return; }
    draft.setRangeText(value, start, end, 'end'); draft.focus();
    draft.setSelectionRange(start + cursor, start + cursor); update();
  }
  function open() {
    if (dialog.open) return;
    document.querySelector('#editor-title').textContent = form.elements.model.value === 'lamina' ? 'Editar densidad ρ' : 'Editar función f';
    draft.value = source.value; keypad.replaceChildren();
    const keys = [
      ...(native() ? [['r','r'],['θ','theta']] : [['x','x'],['y','y']]),
      ['π','pi'],['e','e'],['(', '('],[')', ')'],
      ['√','sqrt',true],['a²','^2'],['aᵇ','^'],['a/b','/'],['|a|','abs',true],['ln','log',true],
      ['sin','sin',true],['cos','cos',true],['tan','tan',true],['exp','exp',true],
      ...['7','8','9','+','4','5','6','-','1','2','3','*','0','.'].map(k => [k === '*' ? '×' : k === '-' ? '−' : k,k]),
    ];
    for (const [label, token, wrap] of keys) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.setAttribute('aria-label', `Insertar ${label}`); button.addEventListener('click', () => insert(token, wrap)); keypad.append(button);
    }
    for (const [label, delta] of [['←', -1], ['→', 1]]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.setAttribute('aria-label', delta < 0 ? 'Mover cursor a la izquierda' : 'Mover cursor a la derecha');
      button.addEventListener('click', () => { const position = Math.max(0, Math.min(draft.value.length, draft.selectionStart + delta)); draft.focus(); draft.setSelectionRange(position, position); });
      keypad.append(button);
    }
    update(); lockPage(); dialog.showModal(); draft.focus({ preventScroll: true }); draft.select();
  }
  source.setAttribute('aria-haspopup', 'dialog'); source.setAttribute('aria-controls', 'expression-editor');
  source.addEventListener('click', open);
  source.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); open(); } });
  document.querySelector('#open-expression-editor').addEventListener('click', open);
  document.querySelector('#editor-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', unlockPage);
  draft.addEventListener('input', update);
  document.querySelector('#editor-clear').addEventListener('click', () => { draft.value = ''; draft.focus(); update(); });
  document.querySelector('#editor-backspace').addEventListener('click', () => {
    const start = draft.selectionStart, end = draft.selectionEnd;
    draft.setRangeText('', start === end ? Math.max(0,start-1) : start, end, 'end'); draft.focus(); update();
  });
  apply.addEventListener('click', () => {
    if (apply.disabled) return;
    source.value = draft.value.trim(); source.dispatchEvent(new Event('input', { bubbles: true }));
    refresh(); dialog.close();
  });
  form.addEventListener('input', refresh);
  document.querySelector('#preset').addEventListener('change', refresh);
  refresh();
}
