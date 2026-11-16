import { openFoodShop, setDailySpecial } from './village.mjs';
import { companions, dailyContent, localDay, visitDue } from './cottage-daily.mjs';
import { companionArt, cottageArt } from './cottage-art.mjs';

const cottage = document.querySelector('#morning-cottage');
const dayquest = window.dayQuestHome;
cottage.innerHTML = `
  <div class="cottage-frame">
    <svg id="cottage-scene" viewBox="0 0 640 290" aria-hidden="true"></svg>
    <div class="cottage-main">
      <p class="cottage-byline" id="cottage-companion"></p>
      <p class="cottage-greeting" id="cottage-greeting"></p>
      <section class="cottage-feature" aria-labelledby="cottage-food-name">
        <p class="cottage-byline">Today’s featured food</p>
        <h3 id="cottage-food-name"></h3>
        <p id="cottage-food-detail"></p>
        <button type="button" id="cottage-food-link">Visit the shop</button>
      </section>
      <details class="cottage-feature">
        <summary id="cottage-album-heading">Companion album</summary>
        <ul id="cottage-album"></ul>
      </details>
      <label class="cottage-setting"><input type="checkbox" id="cottage-visits"> Allow surprise visits</label>
      <p id="cottage-status" role="status" hidden></p>
      <section class="cottage-visit" id="cottage-visit" hidden aria-labelledby="cottage-visitor">
        <svg viewBox="-48 -67 96 125" aria-hidden="true" id="cottage-visitor-portrait"></svg>
        <div>
          <h3 id="cottage-visitor"></h3>
          <p>“I was passing by and thought I’d wave hello.”</p>
          <button type="button" id="cottage-dismiss">See you around</button>
        </div>
      </section>
    </div>
  </div>`;

const find = id => cottage.querySelector('#cottage-' + id);
const preferenceKey = 'dayquest_cottage_v1';
function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(preferenceKey));
    if (typeof stored?.seed === 'string' && stored.seed) {
      const seen = Array.isArray(stored.seen) ? stored.seen.filter(id => Object.hasOwn(companions, id)) : [];
      return { ...stored, visits: stored.visits === true, visit: stored.visit ?? null, seen: [...new Set(seen)] };
    }
  } catch {}
  return { seed: Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'), visits: false, visit: null, seen: [] };
}
let preferences = readPreferences();
let daily;
let visibleVisit = null;
find('visits').checked = preferences.visits === true;

function savePreferences() {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    find('status').hidden = true;
    return true;
  } catch {
    find('status').textContent = 'Cottage preferences are available for this session only.';
    find('status').hidden = false;
    return false;
  } finally {
    document.dispatchEvent(new Event('dayquest:cottage'));
  }
}

export function cottageSnapshot() {
  return structuredClone(preferences);
}

export function allowVisits(value) {
  preferences.visits = value;
  find('visits').checked = value;
  savePreferences();
  refresh();
}

export function restoreCottage(incoming) {
  const localVisit = preferences.visit;
  const visit = localVisit?.day === localDay(new Date()) ? localVisit : incoming.visit;
  preferences = { ...incoming, visit, seen: [...new Set([...preferences.seen, ...incoming.seen])] };
  find('visits').checked = preferences.visits;
  daily = undefined;
  renderAlbum();
  const saved = savePreferences();
  refresh();
  return saved;
}

function renderAlbum() {
  const list = find('album');
  list.replaceChildren();
  find('album-heading').textContent = 'Companion album ? ' + preferences.seen.length + ' / ' + Object.keys(companions).length;
  for (const [id, entry] of Object.entries(companions)) {
    const item = document.createElement('li');
    if (preferences.seen.includes(id)) {
      item.innerHTML = '<svg viewBox="-48 -67 96 125" aria-hidden="true">' + companionArt(id) + '</svg>';
      item.append(entry.name);
    } else {
      item.textContent = 'Undiscovered';
    }
    list.append(item);
  }
}

function discover(id) {
  if (preferences.seen.includes(id)) return;
  preferences.seen.push(id);
  renderAlbum();
  savePreferences();
}

function isIdle() {
  return !document.hidden && !cottage.closest('.tab-content').classList.contains('hidden') &&
    !dayquest.focusActive() && !document.activeElement?.matches('input:not([type=checkbox]), textarea, select');
}

function refresh(now = new Date()) {
  if (daily?.day !== localDay(now)) {
    daily = dailyContent(preferences.seed, now);
    const { name, kind } = companions[daily.companion];
    find('scene').innerHTML = cottageArt(daily.companion);
    find('companion').textContent = 'Today with ' + name + ' the ' + kind;
    find('greeting').textContent = '“' + daily.greeting + '”';

  }

  const revealed = preferences.revealed === daily.day;
  find('food-name').textContent = revealed ? daily.food.name : 'A sealed recipe';
  find('food-detail').textContent = revealed ? daily.food.detail : 'Open the daily menu in Food Village to see today’s recipe.';
  setDailySpecial(daily.food, revealed, () => {
    preferences.revealed = daily.day;
    savePreferences();
    refresh();
  });

  const idle = isIdle();
  if (idle) discover(daily.companion);
  const enabled = preferences.visits === true;
  const seen = preferences.visit?.day === daily.day;
  if (visitDue(daily, now, { enabled, idle, seen })) {
    preferences.visit = { day: daily.day, id: daily.visitor, dismissed: false };
    savePreferences();
  }
  const visitor = enabled && idle && preferences.visit?.day === daily.day &&
    !preferences.visit.dismissed && Object.hasOwn(companions, preferences.visit.id)
    ? preferences.visit.id : null;
  if (visitor === visibleVisit) return;
  visibleVisit = visitor;
  find('visit').hidden = visitor === null;
  document.querySelector('#cottage-extras > summary').textContent = visitor ? 'Companion and daily recipe ? Visitor' : 'Companion and daily recipe';
  if (!visitor) return;
  discover(visitor);
  find('visitor').textContent = companions[visitor].name + ' stopped by';
  find('visitor-portrait').innerHTML = companionArt(visitor);
}

find('food-link').addEventListener('click', () => {
  dayquest.navigate('ramen');
  openFoodShop('market');
});
find('visits').addEventListener('change', event => allowVisits(event.target.checked));
find('dismiss').addEventListener('click', () => {
  if (!visibleVisit) return;
  preferences.visit.dismissed = true;
  savePreferences();
  refresh();
  find('visits').focus({ preventScroll: true });
});

document.addEventListener('visibilitychange', () => refresh());
document.addEventListener('dayquest:navigation', () => refresh());
document.addEventListener('dayquest:focus', () => refresh());
window.addEventListener('focus', () => refresh());
window.addEventListener('storage', event => {
  if (event.key !== preferenceKey) return;
  preferences = readPreferences();
  daily = undefined;
  find('visits').checked = preferences.visits === true;
  renderAlbum();
  document.dispatchEvent(new Event('dayquest:cottage'));
  refresh();
});
renderAlbum();
savePreferences();
refresh();
setInterval(() => refresh(), 15_000);
