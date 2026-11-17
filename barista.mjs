import { availablePoints } from './coin-exchange.mjs';
import { gameSound } from './dayquest-audio.mjs';
import { customers, freshOrders, startRush, advanceRush, stopRush, scoreOrder, rushSeconds, customerSeconds } from './barista-orders.mjs';
import { shelfObject, counterProps } from './ingredient-shelf.mjs';
import { drinks } from './barista-recipes.mjs';
import { baristaAction, drinkById, drinkPhase, freshBarista, availableIngredients, mixTurns, mixLabels } from './barista-model.mjs';
import { baristaGlass, baristaScene, ingredientArt, additionArt, drinkSurface, inGlass } from './barista-art.mjs';
import { bindCookingButtons, svgPoint } from './cooking-input.mjs';
import { openCookingStore, cookingRecord } from './cooking.mjs';

const root = document.querySelector('#tab-barista');
root.innerHTML = `
  <header class="barista-header">
    <div><h2>Moonmilk Barista</h2><p>Make a drink, one ingredient at a time.</p></div>
    <nav aria-label="Barista views">
      <button type="button" id="barista-menu-button">Menu</button>
      <button type="button" id="barista-counter-button" hidden>Counter</button>
      <button type="button" id="barista-saved-button">Saved drinks</button>
    </nav>
  </header>
  <details id="barista-game" open>
    <summary>Quick game · Café Rush</summary>
    <div class="barista-game-controls">
      <button type="button" id="barista-quick-start">Start 30-second rush</button>
      <button type="button" id="barista-game-start">Start 60-second rush</button>
      <button type="button" id="barista-game-stop" hidden>End rush</button>
    </div>
    <p id="barista-game-score"></p>
    <button type="button" id="barista-exchange">Exchange points</button>
    <div class="barista-rush-timers">
      <p id="barista-rush-clock" role="timer" aria-live="off" hidden></p>
      <p id="barista-game-clock" role="timer" aria-live="off" hidden></p>
    </div>
    <p id="barista-game-customer" hidden></p>
    <p id="barista-game-result" role="status"></p>
  </details>
  <section id="barista-menu">
    <label for="barista-search">Find a recipe</label>
    <div class="barista-search-row">
      <input id="barista-search" type="search" placeholder="Try caramel or mojito">
      <label class="sr-only" for="barista-filter">Drink category</label>
      <select id="barista-filter">
        <option value="all">All drinks</option><option value="coffee">Coffee</option><option value="coffee-free">Coffee-free</option>
        <option value="shakes">Milkshakes</option><option value="mud">Mud jars</option>
        <option value="mojitos">Mojitos</option><option value="mocktails">Mocktails</option>
      </select>
      <button type="button" id="barista-surprise">Surprise me</button>
    </div>
    <p id="barista-count"></p>
    <div id="barista-results"></div>
    <button type="button" id="barista-more" hidden>Show more recipes</button>
    <p class="barista-source">Historic drinks are game adaptations of <a href="https://www.gutenberg.org/ebooks/76921" target="_blank" rel="noopener noreferrer">What to Drink (1920)</a>. The menu also includes original DayQuest drinks.</p>
  </section>
  <section id="barista-counter" hidden>
    <h3 id="barista-drink-title"></h3>
    <div class="counter-workbench">
    <svg class="counter-surface" id="barista-scene" viewBox="0 0 480 270" role="img" aria-label="Barista counter and mixing glass"></svg>
    <div class="counter-shelf"><h4>Ingredients</h4><div class="ingredient-shelf" id="barista-tray"></div></div>
    </div>
    <div class="barista-panel">
      <p id="barista-step" aria-live="polite"></p>
      <button type="button" id="barista-mix" hidden></button>
      <button type="button" id="barista-serve" hidden>Serve drink</button>
      <ul id="barista-checklist" aria-label="Recipe ingredients"></ul>
      <form id="barista-save" hidden>
        <label for="barista-name">Drink name</label>
        <div><input id="barista-name" maxlength="64"><button type="submit">Save drink</button></div>
      </form>
      <div class="barista-actions">
        <button type="button" id="barista-undo" disabled>Undo</button>
        <button type="button" id="barista-reset">Start over</button>
      </div>
    </div>
  </section>
  <section id="barista-saved" hidden>
    <h3>Saved drinks</h3><div id="barista-saved-list"></div>
    <article id="barista-saved-detail" hidden>
      <h4 id="barista-saved-title"></h4>
      <svg id="barista-saved-glass" viewBox="160 100 180 150" role="img" aria-label="Saved drink"></svg>
      <p id="barista-saved-ingredients"></p>
      <button type="button" id="barista-replay">Make this again</button>
    </article>
  </section>
  <p id="barista-status" role="status"></p>`;

const get = id => root.querySelector('#barista-' + id);
let db;
let record;
let view = 'menu';
let limit = 12;
let queue = Promise.resolve();
let chosenSave;
let mixing;
let effectTimer;
let orderTicker;
let advancing = false;
const sorted = [...drinks].sort((a,b) => Number(b.source === 'original') - Number(a.source === 'original') || a.name.localeCompare(b.name));
const instructions = {
  stir: 'Circle inside the glass to stir.',
  shake: 'Swipe side to side across the glass to shake.',
  blend: 'Swipe across the glass to blend.',
  muddle: 'Swipe down inside the glass to muddle.'
};

function viewPage(next) {
  view = next;
  for (const name of ['menu','counter','saved']) {
    get(name).hidden = name !== next;
    get(name+'-button').setAttribute('aria-pressed', String(name === next));
  }
  get('counter-button').hidden = !record?.dish.recipeId;
}

function matches() {
  const category = get('filter').value;
  const query = get('search').value.trim().toLowerCase();
  return sorted.filter(drink => (category === 'all' || drink.category === category ||
    (category === 'coffee-free' && !drink.ingredients.includes('Coffee powder'))) &&
    (drink.name.toLowerCase().includes(query) || drink.ingredients.some(item => item.toLowerCase().includes(query))));
}

function menu() {
  const found = matches();
  get('count').textContent = found.length + ' recipes';
  get('results').replaceChildren();
  for (const drink of found.slice(0, limit)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.recipe = drink.id;
    const name = document.createElement('strong');
    name.textContent = drink.name;
    const count = document.createElement('span');
    count.textContent = drink.ingredients.length + (drink.ingredients.length === 1 ? ' ingredient' : ' ingredients');
    button.append(name, count);
    get('results').append(button);
  }
  get('more').hidden = found.length <= limit;
  get('surprise').disabled = !record || !found.length;
}

function write(change, after) {
  if (!db || !record) return;
  queue = queue.then(async () => {
    record = await cookingRecord(db, change, 'barista', freshBarista);
    document.dispatchEvent(new Event('dayquest:barista-points'));
    counter();
    renderOrders();
    get('counter-button').hidden = !record.dish.recipeId;
    after?.();
  }).catch(() => { get('status').textContent = 'That change could not be saved. Try again.'; });
  return queue;
}

function start(id, duration = 0) {
  if (!record) return;
  const { dish } = record;
  const saved = record.recipes.some(recipe => JSON.stringify(recipe.dish) === JSON.stringify(dish) && recipe.name === record.name);
  const activeRush = record.game?.rush && !record.game.rush.ended;
  if (activeRush ? !window.confirm('End the current rush and replace the drink?')
    : dish.added.length && !saved && !window.confirm('Replace the current drink?')) return;
  write(previous => {
    const existing = previous.game ?? freshOrders();
    const game = duration ? startRush(existing, Date.now(), Math.random, duration) : { ...existing, order: null, rush: undefined };
    return { ...previous, dish: baristaAction(previous.dish,'choose',game.order?.recipeId ?? id),
      name:'', history:[], game };
  }, () => {
    get('status').textContent = '';
    viewPage('counter');
    if (duration) gameSound('start');
  });
}

function act(action, value) {
  let applied = false;
  const expected = record?.game?.order;
  write(previous => {
    const actual = previous.game?.order;
    if (expected?.deadline !== actual?.deadline || expected?.customer !== actual?.customer) return previous;
    if (action === 'serve' && previous.game?.rush && !previous.game.rush.ended &&
        actual && !actual.result && Date.now() >= actual.deadline) return previous;
    const dish = baristaAction(previous.dish, action, value);
    if (dish === previous.dish) return previous;
    applied = true;
    const game = action === 'serve' ? scoreOrder(previous.game ?? freshOrders(),dish.recipeId) : previous.game;
    return { ...previous, dish, ...(game ? { game } : {}), history: [...previous.history, previous.dish].slice(-40) };
  }, () => {
    if (!applied) return;
    if (action === 'add' || action === 'serve') gameSound(action);
    get('status').textContent = '';
    const effect = get('scene').querySelector('.barista-effect');
    if (action === 'add') effect.innerHTML = '<g transform="translate(240 ' + drinkSurface(record.dish) + ')">' + additionArt(value) + '</g>';
    if (action === 'mix') get('scene').querySelector('.barista-glass')?.classList.add('barista-mixed');
    clearTimeout(effectTimer);
    effectTimer = setTimeout(() => { if (!isDragging()) effect.replaceChildren(); }, 620);
  });
}

function counter() {
  if (!record?.dish.recipeId) return;
  const { dish, name, history } = record;
  const drink = drinkById[dish.recipeId];
  const phase = drinkPhase(dish);
  const previous = document.activeElement?.dataset.ingredient;
  const scene = get('scene');
  get('drink-title').textContent = drink.name;
  const customer = customers[record.game?.order?.customer];
  scene.innerHTML = baristaScene(dish, customer);
  scene.classList.toggle('barista-gestures', phase === 'mix' || (phase === 'serve' && Boolean(customer)));
  const steps = {
    add: drink.category === 'mud' ? 'Drag the next ingredient into the glass to build its layers.' : 'Drag each ingredient into the glass, or tap an ingredient to add it.',
    mix: instructions[drink.method] + ' ' + dish.turns + ' / ' + mixTurns,
    serve: customer ? 'Drag the glass to ' + customer.name + ' or tap Serve ' + customer.name + '.' : 'Your drink is ready to serve.',
    served: 'Drink served. Save it to your collection.'
  };
  get('step').textContent = steps[phase];
  get('checklist').replaceChildren();
  for (const item of drink.ingredients) {
    const li = document.createElement('li');
    const added = dish.added.includes(item);
    li.textContent = (added ? '✓ ' : '') + item;
    li.classList.toggle('added', added);
    if (added) li.setAttribute('aria-label', item + ' added');
    get('checklist').append(li);
  }
  const tray = get('tray');
  if (tray.dataset.recipe !== drink.id) {
    tray.dataset.recipe = drink.id;
    tray.replaceChildren();
    for (const item of drink.ingredients) {
      const art = { Milk: counterProps.milk, Banana: counterProps.banana,
        'Chocolate syrup': counterProps.chocolate, 'Coffee powder': counterProps.jar,
        'Cocoa powder': counterProps.jar, Caramel: counterProps.bottle,
        'Ice cream': '<g color="#efacd5">' + counterProps.scoop + '</g>' }[item] ?? ingredientArt(item);
      const piece = shelfObject(item, art);
      piece.dataset.target = 'glass';
      piece.dataset.ingredient = item;
      tray.append(piece);
    }
  }
  const available = availableIngredients(dish);
  for (const piece of tray.children) {
    const item = piece.dataset.ingredient;
    piece.disabled = !available.includes(item);
    piece.classList.toggle('ingredient-used', dish.added.includes(item));
  }
  const mix = get('mix');
  mix.hidden = phase !== 'mix';
  mix.textContent = mixLabels[drink.method] ?? 'Mix';
  get('serve').hidden = phase !== 'serve';
  get('serve').textContent = customer ? 'Serve ' + customer.name : 'Serve drink';
  get('save').hidden = phase !== 'served';
  if (document.activeElement !== get('name')) get('name').value = name;
  get('name').placeholder = drink.name;
  get('undo').disabled = !history.length;
  if (previous && view === 'counter')
    (get('tray').querySelector('button:not(:disabled)') ?? (phase === 'mix' ? mix : phase === 'serve' ? get('serve') : get('undo'))).focus();
}

export function baristaPoints() { return record ? (record.game?.points ?? 0) : null; }

function renderOrders() {
  const game = record?.game ?? freshOrders();
  const { order, rush } = game;
  const now = Date.now();
  const active = rush && !rush.ended;
  const clock = get('game-clock');
  const session = get('rush-clock');
  const customer = get('game-customer');
  get('quick-start').disabled = get('game-start').disabled = !record || Boolean(active);
  get('game-stop').hidden = !active;
  const score = 'Barista points ' + availablePoints(game.points, window.dayQuestHome.exchangeLedger(), 'barista') + ' | Lifetime on-time orders ' + game.served;
  if (get('game-score').textContent !== score) get('game-score').textContent = score;
  session.hidden = !active;
  clock.hidden = !active || !order || Boolean(order.result);
  customer.hidden = !order;
  if (!order) { get('game-result').textContent = ''; return; }
  const label = customers[order.customer].name + ' ordered ' + drinkById[order.recipeId].name + '.';
  if (customer.textContent !== label) customer.textContent = label;
  const showSeconds = deadline => Math.max(0, Math.ceil((deadline - now)/1000));
  if (active) {
    const sessionText = 'Cafe rush: ' + showSeconds(rush.deadline) + ' / ' + (rush.duration ?? rushSeconds) + 's';
    const customerText = customers[order.customer].name + ': ' + showSeconds(order.deadline) + ' / ' + customerSeconds + 's';
    if (session.textContent !== sessionText) session.textContent = sessionText;
    if (clock.textContent !== customerText) clock.textContent = customerText;
  }
  const result = rush?.ended ? 'Rush finished. ' + rush.served + ' served, ' + rush.missed + ' missed, +' + rush.points + ' points.'
    : order.result === 'served' ? '+' + order.earned + ' points. Next customer coming.' : '';
  if (get('game-result').textContent !== result) get('game-result').textContent = result;
}

function tickRush() {
  renderOrders();
  const game = record?.game;
  const now = Date.now();
  if (!game?.rush || game.rush.ended || advancing) return;
  const order = game.order;
  const due = now >= game.rush.deadline || (!order.result && now >= order.deadline) ||
    (order.result && now >= order.nextAt);
  if (!due) return;
  advancing = true;
  write(previous => {
    const game = advanceRush(previous.game, Date.now());
    if (game === previous.game) return previous;
    if (game.rush.ended) return { ...previous, game };
    return { ...previous, game, dish: baristaAction(previous.dish,'choose',game.order.recipeId), history:[], name:'' };
  })?.finally(() => { advancing = false; });
}

get('quick-start').addEventListener('click', () => start(null, 30));
get('game-start').addEventListener('click', () => start(null, 60));
get('exchange').addEventListener('click', () => window.dayQuestHome.navigate('rewards'));
get('game-stop').addEventListener('click', () => write(previous => ({ ...previous, game: stopRush(previous.game) })));

function showSaved(id) {
  chosenSave = id;
  viewPage('saved');
  get('saved-list').replaceChildren();
  if (!record?.recipes.length) get('saved-list').textContent = 'Your saved drinks will appear here.';
  for (const recipe of [...(record?.recipes ?? [])].reverse()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.saved = recipe.id;
    button.textContent = recipe.name;
    get('saved-list').append(button);
  }
  const selected = record?.recipes.find(recipe => recipe.id === id);
  get('saved-detail').hidden = !selected;
  if (!selected) return;
  get('saved-title').textContent = selected.name;
  get('saved-glass').innerHTML = baristaGlass(selected.dish,'barista-saved-clip');
  get('saved-ingredients').textContent = selected.dish.added.join(' · ');
}

get('menu-button').addEventListener('click', () => viewPage('menu'));
get('counter-button').addEventListener('click', () => viewPage('counter'));
get('saved-button').addEventListener('click', () => showSaved(chosenSave));
get('results').addEventListener('click', event => {
  const button = event.target.closest('[data-recipe]');
  if (button) start(button.dataset.recipe);
});
get('saved-list').addEventListener('click', event => {
  const button = event.target.closest('[data-saved]');
  if (button) showSaved(button.dataset.saved);
});
get('more').addEventListener('click', () => { limit += 12; menu(); });
for (const [id,event] of [['search','input'],['filter','change']]) {
  get(id).addEventListener(event, () => { limit = 12; menu(); });
}
get('surprise').addEventListener('click', () => {
  const found = matches();
  if (found.length) start(found[Math.floor(Math.random() * found.length)].id);
});

get('tray').addEventListener('click', event => {
  const button = event.target.closest('[data-ingredient]');
  if (button && !button.disabled) act('add', button.dataset.ingredient);
});
get('mix').addEventListener('click', () => act('mix'));
get('serve').addEventListener('click', () => act('serve'));
get('undo').addEventListener('click', () => write(previous => previous.history.length ? {
  ...previous, dish: previous.history.at(-1), history: previous.history.slice(0,-1)
} : previous));
get('reset').addEventListener('click', () => start(record.dish.recipeId));
get('replay').addEventListener('click', () => {
  const recipe = record.recipes.find(item => item.id === chosenSave);
  if (recipe) start(recipe.dish.recipeId);
});
get('save').addEventListener('submit', event => {
  event.preventDefault();
  if (drinkPhase(record.dish) !== 'served') return;
  const id = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
  const name = get('name').value.trim() || drinkById[record.dish.recipeId].name;
  write(previous => ({ ...previous, name, recipes: [...previous.recipes, { id, name, dish: previous.dish }] }), () => {
    showSaved(id);
    get('status').textContent = 'Drink saved.';
  });
});

const scene = get('scene');
const isDragging = bindCookingButtons(root, {
  isBusy: () => Boolean(mixing),
  move(button,event) {
    const point = svgPoint(scene,event);
    scene.classList.toggle('barista-valid',inGlass(point));
  },
  clear() { scene.classList.remove('barista-valid'); scene.querySelector('.barista-effect')?.replaceChildren(); },
  drop(button,event) {
    if (inGlass(svgPoint(scene,event))) act('add',button.dataset.ingredient);
    else get('status').textContent = 'Drop the ingredient over the mixing glass.';
  }
});

function atCustomer({ x,y }) {
  return Math.hypot((x - 360) / 62, (y - 135) / 68) <= 1;
}

scene.addEventListener('pointerdown', event => {
  if (!record || mixing || isDragging() || event.button !== 0) return;
  const phase = drinkPhase(record.dish);
  const serving = phase === 'serve' && Boolean(record.game?.order);
  if (phase !== 'mix' && !serving) return;
  const point = svgPoint(scene,event);
  if (!inGlass(point)) return;
  mixing = { id:event.pointerId, start:point, angle:null, arc:0, serving };
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', event => {
  if (mixing?.id !== event.pointerId) return;
  const point = svgPoint(scene,event);
  if (mixing.serving) {
    scene.classList.add('barista-serving');
    scene.classList.toggle('barista-customer-target', atCustomer(point));
    scene.querySelector('.barista-effect').innerHTML = '<g transform="translate(' + (point.x-240) + ' ' +
      (point.y-166) + ')">' + baristaGlass(record.dish,'barista-service-preview') + '</g>';
    return;
  }
  const method = drinkById[record.dish.recipeId].method;
  if (method === 'stir') {
    const x=(point.x-240)/64, y=(point.y-163)/62;
    if (Math.hypot(x,y) < .2 || !inGlass(point)) return;
    const angle = Math.atan2(y,x);
    if (mixing.angle !== null) {
      const delta = angle - mixing.angle;
      mixing.arc += Math.atan2(Math.sin(delta),Math.cos(delta));
      if (Math.abs(mixing.arc) >= Math.PI / 2) { act('mix'); mixing.arc = 0; }
    }
    mixing.angle = angle;
    return;
  }
  const distance = method === 'muddle' ? point.y - mixing.start.y : Math.abs(point.x - mixing.start.x);
  if (distance >= 37) { act('mix'); mixing.start = point; }
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  scene.addEventListener(type, event => {
    if (mixing?.id !== event.pointerId) return;
    const serving = mixing.serving;
    mixing = null;
    if (!serving) return;
    scene.classList.remove('barista-serving','barista-customer-target');
    scene.querySelector('.barista-effect').replaceChildren();
    if (event.type !== 'pointerup') return;
    if (atCustomer(svgPoint(scene,event))) act('serve');
    else get('status').textContent = 'Drop the glass beside the customer to serve it.';
  });
}

async function load() {
  try {
    db ||= await openCookingStore();
    record = await cookingRecord(db, undefined, 'barista', freshBarista);
    document.dispatchEvent(new Event('dayquest:barista-points'));
    menu();
    counter();
    renderOrders();
    if (record.game?.rush) get('game').open = true;
    if (!orderTicker) orderTicker = setInterval(tickRush, 200);
    if (view === 'saved') showSaved(chosenSave);
    else viewPage(record.dish.recipeId ? 'counter' : 'menu');
  } catch {
    get('status').textContent = 'Enable site storage to save Barista progress.';
  }
}

viewPage('menu');
menu();
renderOrders();
load();
document.addEventListener('dayquest:state', renderOrders);
document.addEventListener('dayquest:kitchens', () => queue.then(load));
