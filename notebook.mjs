const notebook = document.querySelector('#tab-notebook');
const dayquest = window.dayQuestHome;
notebook.innerHTML = `
  <div class="cottage-frame notebook-frame">
    <header>
      <h2>Notebook</h2>
      <button type="button" id="notebook-back">Back to Cottage</button>
    </header>
    <div class="notebook-content">
      <div class="notebook-list-panel">
        <button type="button" id="notebook-new" disabled>New note</button>
        <ul id="notebook-list" aria-label="Saved notes"></ul>
      </div>
      <form id="notebook-editor" hidden>
        <fieldset id="notebook-fields">
          <label for="notebook-title">Title</label>
          <input id="notebook-title" maxlength="120" placeholder="Untitled note">
          <label for="notebook-body">Note</label>
          <textarea id="notebook-body" rows="7" maxlength="12000" required></textarea>
          <div class="notebook-actions">
            <button type="submit">Save note</button>
            <button type="button" id="notebook-delete" hidden>Delete note</button>
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
const status = find('status');
const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
let editing = null;
let original = { title: '', body: '' };
let busy = false;

function notes() {
  return dayquest.notes().filter(note => typeof note?.id === 'string' && typeof note.title === 'string' &&
    typeof note.body === 'string' && typeof note.updated === 'number' && Number.isFinite(new Date(note.updated).getTime()));
}

function renderList() {
  const list = find('list');
  list.replaceChildren();
  for (const note of [...notes()].sort((a, b) => b.updated - a.updated)) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.noteId = note.id;
    button.setAttribute('aria-pressed', String(note.id === editing));
    const name = document.createElement('strong');
    name.textContent = note.title || 'Untitled note';
    const updated = document.createElement('span');
    updated.textContent = fmt.format(new Date(note.updated));
    button.append(name, updated);
    row.append(button);
    list.append(row);
  }
  if (!list.children.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Your saved notes will appear here.';
    list.append(empty);
  }
}

function allowSwitch() {
  return !busy && (editor.hidden || (title.value === original.title && body.value === original.body) ||
    window.confirm('Discard your unsaved changes?'));
}

function openNote(note) {
  editing = note?.id ?? null;
  original = { title: note?.title ?? '', body: note?.body ?? '' };
  title.value = original.title;
  body.value = original.body;
  editor.hidden = false;
  find('delete').hidden = !editing;
  renderList();
  title.focus();
}

function setBusy(value) {
  busy = value;
  find('fields').disabled = value;
  find('new').disabled = value;
}

find('back').addEventListener('click', () => dayquest.navigate('home'));
find('new').addEventListener('click', () => {
  if (!allowSwitch()) return;
  status.textContent = '';
  openNote();
});
find('list').addEventListener('click', event => {
  const id = event.target.closest('button[data-note-id]')?.dataset.noteId;
  if (!id || id === editing || !allowSwitch()) return;
  const note = notes().find(item => item.id === id);
  if (!note) return;
  status.textContent = '';
  openNote(note);
});

editor.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  if (!body.value.trim()) {
    status.textContent = 'Write something in your note before saving.';
    body.focus();
    return;
  }
  const now = Date.now();
  const existing = editing && notes().find(note => note.id === editing);
  const id = existing?.id ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
  const note = { id, title: title.value.trim(), body: body.value, created: existing?.created ?? now, updated: now };
  setBusy(true);
  const saved = await dayquest.updateNotes(current => [...current.filter(item => item?.id !== id), note]);
  setBusy(false);
  if (!saved) {
    status.textContent = 'Your note could not be saved. Try again.';
    return;
  }
  editing = id;
  original = { title: note.title, body: note.body };
  title.value = note.title;
  find('delete').hidden = false;
  status.textContent = 'Note saved.';
  renderList();
});

find('delete').addEventListener('click', async () => {
  if (!editing || busy || !window.confirm('Delete this note?')) return;
  const id = editing;
  setBusy(true);
  const saved = await dayquest.updateNotes(current => current.filter(note => note?.id !== id));
  setBusy(false);
  if (!saved) {
    status.textContent = 'Your note could not be deleted. Try again.';
    return;
  }
  editing = null;
  editor.reset();
  editor.hidden = true;
  status.textContent = 'Note deleted.';
  renderList();
  find('new').focus();
});

dayquest.ready.then(() => {
  find('new').disabled = false;
  status.textContent = '';
  renderList();
  document.addEventListener('dayquest:state', renderList);
});
