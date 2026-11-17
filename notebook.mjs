import { inkMarkup, mountPaper, paperControls } from './notebook-paper.mjs';
import { renderNote } from './notebook-format.mjs';

const notebook = document.querySelector('#tab-notebook');
const dayquest = window.dayQuestHome;
const tools = {
  bold: ['Bold', '**', '**'], italic: ['Italic', '*', '*'], strike: ['Strike', '~~', '~~'],
  highlight: ['Highlight', '==', '=='], heading: ['Heading', '## '], bullet: ['Bullets', '- '], number: ['Numbered list', '1. '],
  check: ['Checklist', '- [ ] '], quote: ['Quote', '> '], code: ['Inline code', '\`', '\`'],
  block: ['Code block', '\`\`\`\n', '\n\`\`\`'], link: ['Link', '[', '](https://example.com)'],
  divider: ['Divider', '---\n']
};
notebook.innerHTML = `
  <div class="cottage-frame notebook-frame">
    <header><h2>Notebook</h2><button type="button" id="notebook-back">Back to Cottage</button></header>
    <div class="notebook-content">
      <div class="notebook-list-panel">
        <button type="button" id="notebook-new" disabled>New note</button>
        <label for="notebook-search">Search notes</label>
        <input id="notebook-search" type="search" placeholder="Title, text, or tag">
        <label for="notebook-folder">Show</label>
        <select id="notebook-folder"><option value="active">Active notes</option><option value="archived">Archive</option><option value="trash">Trash</option></select>
        <ul id="notebook-list" aria-label="Saved notes"></ul>
      </div>
      <form id="notebook-editor" hidden>
        <fieldset id="notebook-fields">
          <label for="notebook-title">Title</label>
          <input id="notebook-title" maxlength="120" placeholder="Untitled note">
          <label for="notebook-tags">Tags (comma separated)</label>
          <input id="notebook-tags" maxlength="300" placeholder="Study, Ideas, Personal">
          <div class="notebook-actions" aria-label="Editor view">
            <button type="button" id="notebook-edit" aria-pressed="true">Edit</button>
            <button type="button" id="notebook-preview-toggle" aria-pressed="false">Preview</button>
            <button type="button" id="notebook-ink-toggle" aria-pressed="false">Handwriting &amp; sketch</button>
          </div>
          ${paperControls}
          <div class="notebook-tools" id="notebook-tools" role="group" aria-label="Formatting">
            <button type="button" id="notebook-undo">Undo</button>
            <button type="button" id="notebook-redo">Redo</button>
            ${Object.entries(tools).map(([key,[label]]) => `<button type="button" data-format="${key}">${label}</button>`).join('')}
          </div>
          <div id="notebook-sheet" class="notebook-sheet" data-paper="lined" data-palette="lavender">
          <label class="sr-only" for="notebook-body">Note text</label>
          <textarea id="notebook-body" rows="11" maxlength="12000"></textarea>
          <article id="notebook-preview" class="notebook-preview" aria-label="Note preview" hidden></article>
          ${inkMarkup}
          </div>
          <p id="notebook-count"></p>
          <div class="notebook-actions">
            <button type="submit">Save now</button>
            <button type="button" id="notebook-pin">Pin</button>
            <button type="button" id="notebook-archive">Archive</button>
            <button type="button" id="notebook-delete">Move to trash</button>
            <button type="button" id="notebook-restore" hidden>Restore</button>
            <button type="button" id="notebook-export">Download note</button>
          </div>
        </fieldset>
      </form>
    </div>
    <p id="notebook-status" role="status">Opening your notebook…</p>
  </div>`;

const find = id => notebook.querySelector('#notebook-' + id);
const editor = find('editor');
const title = find('title');
const body = find('body');
const tags = find('tags');
const status = find('status');
const folder = find('folder');
const input = find('search');
const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const folderOf = note => note?.folder ?? 'active';
const tagsOf = note => note?.tags ?? [];
let editing;
let data;
let dirty = false;
let preview = false;
let sketch = false;
let autosave;
let pending = Promise.resolve(true);
const undo = [];
const redo = [];
const paper = mountPaper(find, page => { data = { ...data, page }; markDirty(); }, () => title.value);
const bodySnapshot = () => ({ text: body.value, start: body.selectionStart, end: body.selectionEnd, formatted: data?.formatted });
function remember() {
  undo.push(bodySnapshot());
  if (undo.length > 50) undo.shift();
  redo.length = 0;
}
function applyHistory(from, to) {
  const state = from.pop();
  if (!state) return;
  to.push(bodySnapshot());
  body.value = state.text;
  data = { ...data, formatted: state.formatted ?? false };
  if (!preview) {
    body.focus();
    body.setSelectionRange(state.start, state.end);
  }
  markDirty();
}

const notes = () => dayquest.notes().filter(note => typeof note?.id === 'string' && typeof note.title === 'string' &&
  typeof note.body === 'string' && Number.isFinite(new Date(note.updated).getTime()));

function renderList() {
  const list = find('list');
  const terms = input.value.toLocaleLowerCase().trim().split(/\s+/);
  const visible = notes().filter(note => {
    const haystack = [note.title, note.body, ...tagsOf(note)].join(' ').toLocaleLowerCase();
    return folderOf(note) === folder.value && terms.every(term => haystack.includes(term));
  }).sort((a,b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updated - a.updated);
  list.replaceChildren(...visible.map(note => {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.noteId = note.id;
    button.dataset.palette = note.page?.palette ?? 'lavender';
    button.setAttribute('aria-pressed', String(note.id === editing));
    const name = document.createElement('strong');
    name.textContent = (note.pinned ? '📌 ' : '') + (note.title || 'Untitled note');
    const details = document.createElement('span');
    details.textContent = [fmt.format(new Date(note.updated)), ...tagsOf(note)].join(' · ');
    button.append(name, details);
    row.append(button);
    return row;
  }));
  if (!visible.length) {
    const empty = document.createElement('li');
    empty.textContent = input.value.trim() ? 'No matching notes.' : 'No notes here yet.';
    list.append(empty);
  }
}

function drawEditor() {
  const archived = folderOf(data) === 'archived';
  const trashed = folderOf(data) === 'trash';
  find('pin').textContent = data?.pinned ? 'Unpin' : 'Pin';
  find('archive').textContent = archived ? 'Move to active' : 'Archive';
  for (const id of ['pin','archive','delete']) find(id).hidden = !editing || trashed;
  find('restore').hidden = !trashed;
  title.readOnly = body.readOnly = tags.readOnly = trashed;
  paper.lock(trashed);
  find('ink-pad').hidden = !sketch;
  find('ink-toggle').setAttribute('aria-pressed', String(sketch));
  find('tools').hidden = preview || sketch || trashed;
  find('undo').disabled = !undo.length;
  find('redo').disabled = !redo.length;
  body.hidden = preview || sketch;
  find('edit').setAttribute('aria-pressed', String(!preview && !sketch));
  find('preview-toggle').setAttribute('aria-pressed', String(preview));
  const area = find('preview');
  area.hidden = !preview;
  if (preview) renderNote(area, body.value, data?.formatted, (index, checked) => {
    if (trashed) { drawEditor(); return; }
    remember();
    const lines = body.value.split('\n');
    lines[index] = lines[index].replace(/^- \[[ xX]\]/, checked ? '- [x]' : '- [ ]');
    body.value = lines.join('\n');
    markDirty();
  });
  find('count').textContent = (body.value.trim().match(/\S+/g)?.length ?? 0) + ' words · ' + body.value.length + ' characters';
}

function openNote(note) {
  undo.length = redo.length = 0;
  editing = note?.id;
  data = note ?? {};
  dirty = false;
  preview = false;
  sketch = Boolean(data.page?.strokes?.length && !data.body);
  paper.load(data.page);
  title.value = data.title ?? '';
  body.value = data.body ?? '';
  tags.value = tagsOf(data).join(', ');
  editor.hidden = false;
  status.textContent = '';
  drawEditor();
  renderList();
  title.focus();
}

function save() {
  clearTimeout(autosave);
  if (!dirty) return pending;
  const labelSet = [...new Set(tags.value.split(',').map(tag => tag.trim()).filter(Boolean))];
  if (!editing && !title.value.trim() && !body.value.trim() && !labelSet.length && !data.page?.strokes?.length) return pending;
  const now = Date.now();
  const note = { ...data, id: editing ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'),
    title: title.value.trim(), body: body.value, tags: labelSet, created: data.created ?? now,
    updated: Math.max(now, (data.updated ?? 0) + 1) };
  editing = note.id;
  data = note;
  dirty = false;
  function failed() {
    if (editing === note.id && data === note) dirty = true;
    status.textContent = 'Could not save this note. Try Save now.';
    return false;
  }
  pending = pending.then(async () => {
    const saved = await dayquest.updateNotes(current => [...current.filter(item => item?.id !== note.id), note]);
    if (!saved) return failed();
    if (editing === note.id && !dirty) status.textContent = 'Saved on this device.';
    drawEditor();
    renderList();
    return true;
  }).catch(failed);
  return pending;
}

function markDirty() {
  dirty = true;
  drawEditor();
  clearTimeout(autosave);
  status.textContent = 'Saving…';
  autosave = setTimeout(save, 450);
}

find('back').onclick = () => dayquest.navigate('home');
find('new').onclick = async () => { if (await save()) { folder.value = 'active'; input.value = ''; openNote(); } };
input.oninput = renderList;
folder.onchange = renderList;
find('list').onclick = async event => {
  const id = event.target.closest('[data-note-id]')?.dataset.noteId;
  if (!id || id === editing || !await save()) return;
  const note = notes().find(item => item.id === id);
  if (note) openNote(note);
};
for (const field of [title,body,tags]) field.addEventListener('input', markDirty);
for (const id of ['edit','preview-toggle','ink-toggle']) find(id).onclick = () => {
  preview = id === 'preview-toggle';
  sketch = id === 'ink-toggle';
  drawEditor();
};
editor.onsubmit = event => { event.preventDefault(); save(); };
body.addEventListener('beforeinput', event => {
  if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
    event.preventDefault();
    if (event.inputType === 'historyUndo') applyHistory(undo, redo);
    else applyHistory(redo, undo);
  } else remember();
});
find('undo').onclick = () => applyHistory(undo, redo);
find('redo').onclick = () => applyHistory(redo, undo);
find('tools').addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.target.closest('[data-format]')) event.preventDefault();
});
find('tools').onclick = event => {
  const kind = event.target.closest('[data-format]')?.dataset.format;
  if (!kind) return;
  const [label, before, after = ''] = tools[kind];
  const { selectionStart: start, selectionEnd: end } = body;
  const lineTool = ['heading','bullet','number','check','quote','block','divider'].includes(kind);
  const lineStart = lineTool ? body.value.lastIndexOf('\n', start - 1) + 1 : start;
  const selection = body.value.slice(lineStart, end);
  const replacement = kind === 'divider' ? before : lineTool && kind !== 'block'
    ? (selection || label).split('\n').map((line, index) => (kind === 'number' ? (index + 1) + '. ' : before) + line).join('\n')
    : before + (selection || (kind === 'link' ? 'Link text' : kind === 'block' ? 'code' : label)) + after;
  if (body.value.length - (end - lineStart) + replacement.length > body.maxLength) {
    status.textContent = 'This note has reached its character limit.';
    return;
  }
  remember();
  body.setRangeText(replacement, lineStart, end, 'end');
  body.focus();
  if (kind === 'link') body.setSelectionRange(lineStart + replacement.length - 'https://example.com)'.length, lineStart + replacement.length - 1);
  else if (!selection && kind !== 'divider') body.setSelectionRange(lineStart + before.length, lineStart + replacement.length - after.length);
  data = { ...data, formatted: true };
  markDirty();
};
for (const id of ['pin','archive','delete','restore']) find(id).onclick = async () => {
  if (!editing) return;
  if (id === 'pin') data = { ...data, pinned: !data.pinned };
  else {
    const target = id === 'delete' ? 'trash' : id === 'archive' && folderOf(data) !== 'archived' ? 'archived' : 'active';
    data = { ...data, folder: target };
    folder.value = target;
    if (target === 'trash' && !sketch) preview = true;
  }
  dirty = true;
  await save();
};
find('export').onclick = () => {
  const formatted = Boolean(data.formatted);
  const blob = new Blob([title.value ? (formatted ? '# ' : '') + title.value + '\n\n' : '', body.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (title.value.trim().replace(/[<>:"/\\|?*]/g, '_') || 'DayQuest note') + (formatted ? '.md' : '.txt');
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
notebook.addEventListener('keydown', event => {
  const shortcut = event.key.toLowerCase();
  if (!(event.ctrlKey || event.metaKey) || editor.hidden) return;
  if (event.target === body && !body.readOnly && ['z','y'].includes(shortcut)) {
    event.preventDefault();
    if (shortcut === 'y' || event.shiftKey) applyHistory(redo, undo);
    else applyHistory(undo, redo);
  }
  if (shortcut === 's') {
    event.preventDefault();
    save();
  }
});
document.addEventListener('dayquest:navigation', () => { if (notebook.classList.contains('hidden')) save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
dayquest.ready.then(() => {
  find('new').disabled = false;
  status.textContent = '';
  renderList();
  document.addEventListener('dayquest:state', renderList);
});
