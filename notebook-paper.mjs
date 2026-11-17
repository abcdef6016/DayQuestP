export const papers = ['lined','grid','dot','blank'];
export const palettes = {
  lavender: { paper: '#f4edff', line: '#d6c3eb', ink: '#39234e', accent: '#ab7dbc' },
  blush: { paper: '#fff0f3', line: '#edcbd7', ink: '#49283b', accent: '#c7829f' },
  oat: { paper: '#fff8e8', line: '#e5d4ae', ink: '#493720', accent: '#b9955e' },
  mint: { paper: '#edf9ef', line: '#c8e0ce', ink: '#254635', accent: '#83a990' },
  night: { paper: '#292033', line: '#493b57', ink: '#f4e9ff', accent: '#ae8ac3' }
};
const inks = { violet: '#824ab5', plum: '#7d3a67', rose: '#bf527e', teal: '#287c73', gold: '#c08a35', chalk: '#eee2ff' };
const sizes = { fine: 2.5, medium: 5, bold: 9 };
const maxStrokes = 240;
const maxPoints = 6000;
const width = 640;
const height = 480;
const ns = 'http://www.w3.org/2000/svg';

export function validPaper(page) {
  if (!page || !papers.includes(page.paper) || !Object.hasOwn(palettes, page.palette) ||
      !Array.isArray(page.strokes) || page.strokes.length > maxStrokes) return false;
  let total = 0;
  return page.strokes.every(stroke => {
    if (!stroke || !Object.hasOwn(inks, stroke.color) || !Object.hasOwn(sizes, stroke.size) ||
        typeof stroke.highlight !== 'boolean' || !Array.isArray(stroke.points) || !stroke.points.length) return false;
    total += stroke.points.length;
    return total <= maxPoints && stroke.points.every(point => Array.isArray(point) && point.length === 2 &&
      Number.isInteger(point[0]) && point[0] >= 0 && point[0] <= width &&
      Number.isInteger(point[1]) && point[1] >= 0 && point[1] <= height);
  });
}

const defaultPaper = { paper: 'lined', palette: 'lavender', strokes: [] };
const options = values => values.map(key => `<option value="${key}">${key[0].toUpperCase() + key.slice(1)}</option>`).join('');
export const paperControls = `
  <div class="notebook-paper-settings">
    <label>Paper <select id="notebook-paper-type">${options(papers)}</select></label>
    <label>Palette <select id="notebook-paper-palette">${options(Object.keys(palettes))}</select></label>
  </div>`;
export const inkMarkup = `
  <section id="notebook-ink-pad" hidden aria-label="Sketch and handwriting">
    <div class="notebook-paper-settings" id="notebook-ink-controls">
      <label>Tool <select id="notebook-ink-tool"><option value="pen">Pen</option><option value="highlight">Highlighter</option><option value="erase">Eraser</option></select></label>
      <label>Ink <select id="notebook-ink-color">${options(Object.keys(inks))}</select></label>
      <label>Size <select id="notebook-ink-size">${options(Object.keys(sizes))}</select></label>
    </div>
    <div class="notebook-actions">
      <button type="button" id="notebook-ink-undo">Undo stroke</button>
      <button type="button" id="notebook-ink-redo">Redo stroke</button>
      <button type="button" id="notebook-ink-clear">Clear ink</button>
      <button type="button" id="notebook-ink-download">Download sketch</button>
    </div>
    <svg id="notebook-ink-surface" viewBox="0 0 ${width} ${height}" aria-label="Drawing surface for pen, touch, or mouse" role="img"></svg>
    <p id="notebook-ink-status" role="status"></p>
  </section>`;

function svg(tag, attributes) {
  const element = document.createElementNS(ns, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}
function pathData(points) {
  return 'M' + points.map(point => point.join(' ')).join('L') + (points.length === 1 ? 'l.01 0' : '');
}
function path(stroke) {
  return svg('path', { d: pathData(stroke.points),
    fill: 'none', stroke: inks[stroke.color], 'stroke-width': sizes[stroke.size] * (stroke.highlight ? 2.6 : 1),
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': stroke.highlight ? .38 : 1 });
}
function nearStroke([x, y], stroke) {
  return stroke.points.some(([ax, ay], i) => {
    const [bx, by] = stroke.points[i + 1] ?? [ax, ay];
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    return Math.hypot(x - ax - dx * t, y - ay - dy * t) <= Math.max(12, sizes[stroke.size] * 1.3);
  });
}
function background(page) {
  const { paper, line } = palettes[page.palette];
  const group = svg('g', { 'pointer-events': 'none' });
  group.append(svg('rect', { width, height, fill: paper }));
  if (page.paper === 'blank') return group;
  const pattern = svg('pattern', { id: 'notebook-ink-pattern', width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
  if (page.paper === 'dot') pattern.append(svg('circle', { cx: 12, cy: 12, r: 1.4, fill: line }));
  else pattern.append(svg('path', { d: page.paper === 'grid' ? 'M0 24V0H24' : 'M0 23H24', fill: 'none', stroke: line, 'stroke-width': 1.4 }));
  group.append(pattern, svg('rect', { width, height, fill: 'url(#notebook-ink-pattern)' }));
  return group;
}

export function mountPaper(find, onChange, getTitle) {
  const surface = find('ink-surface');
  const settings = [find('paper-type'), find('paper-palette')];
  const tools = [find('ink-tool'), find('ink-color'), find('ink-size')];
  const status = find('ink-status');
  const journal = find('sheet');
  const undo = [];
  const redo = [];
  const layer = svg('g', {});
  let page = defaultPaper;
  let active;
  let readOnly = false;
  let count = 0;

  function draw() {
    count = page.strokes.reduce((n, stroke) => n + stroke.points.length, 0);
    surface.replaceChildren(background(page), layer);
    layer.replaceChildren(...page.strokes.map(path));
    surface.classList.toggle('notebook-eraser', tools[0].value === 'erase');
    settings[0].value = page.paper;
    settings[1].value = page.palette;
    journal.dataset.paper = page.paper;
    journal.dataset.palette = page.palette;
    for (const field of [...settings, ...tools]) field.disabled = readOnly;
    find('ink-undo').disabled = readOnly || !undo.length;
    find('ink-redo').disabled = readOnly || !redo.length;
    find('ink-clear').disabled = readOnly || !page.strokes.length;
    find('ink-download').disabled = !page.strokes.length;
  }

  function commit(strokes, before = page.strokes) {
    undo.push(before);
    if (undo.length > 25) undo.shift();
    redo.length = 0;
    page = { ...page, strokes };
    changed();
  }
  function changed() { draw(); onChange(page); }
  function history(from, to) {
    if (readOnly || active || !from.length) return;
    to.push(page.strokes);
    page = { ...page, strokes: from.pop() };
    changed();
  }

  function point(event) {
    const rect = surface.getBoundingClientRect();
    return [Math.max(0, Math.min(width, Math.round((event.clientX - rect.left) * width / rect.width))),
      Math.max(0, Math.min(height, Math.round((event.clientY - rect.top) * height / rect.height)))];
  }
  function erase(event) {
    const at = point(event);
    for (let index = page.strokes.length - 1; index >= 0; index--) {
      if (!nearStroke(at, page.strokes[index])) continue;
      page = { ...page, strokes: page.strokes.filter((_, i) => i !== index) };
      layer.children[index].remove();
      return;
    }
  }
  surface.addEventListener('pointerdown', event => {
    if (readOnly || active || event.button !== 0) return;
    event.preventDefault();
    surface.setPointerCapture(event.pointerId);
    status.textContent = '';
    const mode = tools[0].value;
    if (mode === 'erase') {
      active = { id: event.pointerId, before: page.strokes };
      erase(event);
      return;
    }
    if (page.strokes.length >= maxStrokes || count >= maxPoints) {
      status.textContent = 'This sketch is full. Erase a stroke or start a new note.';
      return;
    }
    const stroke = { color: tools[1].value, size: tools[2].value, highlight: mode === 'highlight', points: [point(event)] };
    const node = path(stroke);
    active = { id: event.pointerId, stroke, node };
    layer.append(node);
  });
  surface.addEventListener('pointermove', event => {
    if (active?.id !== event.pointerId) return;
    if (!active.stroke) { erase(event); return; }
    const { stroke, node } = active;
    for (const sample of event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event]) {
      const next = point(sample);
      const last = stroke.points.at(-1);
      if (stroke.points.length + count < maxPoints && Math.hypot(next[0] - last[0], next[1] - last[1]) >= 2)
        stroke.points.push(next);
    }
    node.setAttribute('d', pathData(stroke.points));
  });
  function end(event) {
    if (active?.id !== event.pointerId) return;
    const { stroke, before } = active;
    active = undefined;
    if (stroke) commit([...page.strokes, stroke]);
    else if (before !== page.strokes) commit(page.strokes, before);
  }
  for (const event of ['pointerup','pointercancel','lostpointercapture']) surface.addEventListener(event, end);
  for (const field of settings) field.addEventListener('change', () => {
    page = { ...page, paper: settings[0].value, palette: settings[1].value };
    changed();
  });
  tools[0].addEventListener('change', draw);
  find('ink-undo').onclick = () => history(undo, redo);
  find('ink-redo').onclick = () => history(redo, undo);
  find('ink-clear').onclick = () => { if (!active && window.confirm('Clear all ink on this page?')) commit([]); };
  find('ink-download').onclick = () => {
    const image = surface.cloneNode(true);
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(image)], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = (getTitle().trim().replace(/[<>:"/\\|?*]/g, '_') || 'DayQuest note') + ' sketch.svg';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  return {
    load(saved) {
      active = undefined;
      page = validPaper(saved) ? saved : defaultPaper;
      undo.length = redo.length = 0;
      status.textContent = '';
      draw();
    },
    lock(value) {
      if (readOnly === value) return;
      readOnly = value;
      draw();
    }
  };
}
