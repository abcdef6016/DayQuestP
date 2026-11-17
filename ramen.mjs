import { gameSound } from './dayquest-audio.mjs';
import { shelfObject, counterProps } from './ingredient-shelf.mjs';
import { freshCurry, curryPlateArt, sauces, curryToppings } from './curry.mjs';
import { freshPizza, freshIce, pizzaToppings, iceToppings, flavors } from './village-recipes.mjs';
import { pizzaArt, iceArt } from './village-art.mjs';
import { bindCookingButtons, svgPoint } from './cooking-input.mjs';
import { broths, ingredients, stirSteps, freshDish, inBowl, cook, openCookingStore, cookingRecord } from './cooking.mjs';
import { bowlArt, kitchenArt, potArt, props, rim } from './ramen-scene.mjs';

const bar = document.querySelector('#ramen-bar');
bar.innerHTML = `
  <div class="ramen-frame">
    <header class="ramen-heading">
      <div><p>Food Village</p><h2>Sakura Ramen Bar</h2></div>
      <button type="button" id="ramen-toggle">Recipe Scrapbook</button>
    </header>
    <div id="ramen-kitchen">
      <div class="counter-workbench">
      <svg class="counter-surface" id="ramen-scene" viewBox="0 0 480 300" aria-label="Ramen kitchen">
        ${kitchenArt}
      </svg>
      <div class="counter-shelf"><h4>Ingredients</h4><div class="ingredient-shelf" id="ramen-shelf"></div></div>
      </div>
      <div class="ramen-controls">
        <p id="ramen-instructions" aria-live="polite">Opening the kitchen…</p>
        <div class="ramen-options" id="ramen-options"></div>
        <div id="ramen-placement" hidden>
          <label for="ramen-position">Bowl position</label>
          <select id="ramen-position">
            <option value="0">Spread automatically</option><option value="1">Left</option><option value="2">Right</option>
            <option value="3">Back</option><option value="4">Front</option>
            <option value="5">Back left</option><option value="6">Back right</option>
            <option value="7">Front left</option><option value="8">Front right</option>
          </select>
        </div>
        <button type="button" id="ramen-serve" hidden>Serve to Juniper</button>
        <form id="ramen-save" hidden>
          <label for="ramen-name">Name your ramen</label>
          <input id="ramen-name" required maxlength="64" placeholder="Sakura miso ramen">
          <button type="submit">Save recipe</button>
        </form>
        <footer class="ramen-footer">
          <button type="button" id="ramen-undo" disabled>Undo</button>
          <button type="button" id="ramen-reset" disabled>Reset kitchen</button>
          <button type="button" id="ramen-replay" hidden>Cook again</button>
        </footer>
      </div>
    </div>
    <div id="ramen-scrapbook" hidden>

      <label for="ramen-filter">Show recipes</label>
      <select id="ramen-filter">
        <option value="all">All shops</option><option value="ramen">Ramen</option>
        <option value="pizza">Pizza</option><option value="ice">Ice cream</option><option value="curry">Curry</option>
      </select>
      <div id="ramen-recipes"></div>
      <div id="ramen-recipe-detail" hidden>
        <h4 id="ramen-recipe-name"></h4>
        <svg viewBox="214 178 222 100" role="img" aria-label="Saved ramen bowl">
          <defs>${rim("ramen-recipe-rim")}</defs><g id="ramen-recipe-bowl"></g>
        </svg>
        <p id="ramen-recipe-ingredients"></p>
        <button type="button" id="ramen-cook-recipe">Cook this recipe again</button>
      </div>
    </div>
    <p id="ramen-status" role="status"></p>
  </div>`;

const find = id => bar.querySelector('#ramen-' + id);
const scene = find('scene');
const positions = [[325,224], [273,224], [377,224], [325,202], [325,246], [282,208], [368,208], [282,240], [368,240]];
const plating = { egg: [275,226], nori: [306,203], mushroom: [370,219], scallion: [328,231], sesame: [380,238] };
const stages = {
  choose: 'Drag a broth into the pot, or tap to choose and pour it.',
  pour: 'Drag the pitcher to the pot, or tap Pour broth.',
  heat: 'Light the stove to bring the broth to a boil.',
  noodles: 'Drag the noodles into the bubbling pot, or tap Add noodles.',
  stir: 'Draw circles inside the pot, or tap Stir.',
  transfer: 'Drag the ladle to the bowl, or tap Transfer noodles.',
  toppings: 'Drag toppings onto the bowl, or choose a position and tap an ingredient.',
  served: 'Juniper loved your ramen! Name it to keep it in your scrapbook.'
};
const shelf = [
  ...Object.entries(broths).map(([value, entry]) => [entry.name, 'choose', value, 'pot', props.pour.replace('#e4a366', entry.color)]),
  ['Add noodles', 'noodles', '', 'pot', counterProps.noodles],
  ...Object.entries(ingredients).map(([value,entry]) => [entry.name, 'place', value, 'bowl', entry.art])
];
for (const [label, action, value, target, art] of shelf) {
  const piece = shelfObject(label, art);
  piece.dataset.action = action;
  piece.dataset.value = value;
  piece.dataset.target = target;
  piece.disabled = true;
  find('shelf').append(piece);
}
const toolsByStage = {
  pour: ['Pour broth', 'pot'], heat: ['Light stove'], noodles: ['Add noodles', 'pot'],
  stir: ['Stir'], transfer: ['Transfer noodles', 'bowl'], serve: ['Serve to Juniper', 'customer']
};

let db;
let record;
let queue = Promise.resolve();
let activeRecipe;
let showingScrapbook = false;
let scrapbookOrigin;
let collection = [];
let scrapbookRender = 0;
let currentStage;
let stirring;
let effectGeneration = 0;

function update(transform, after) {
  if (!db) return;
  queue = queue.then(async () => {
    record = await cookingRecord(db, transform);
    render();
    after?.();
  }).catch(() => {
    find('status').textContent = 'The kitchen could not save that action. Try again.';
  });
}

function perform(action, value) {
  let applied = false;
  update(previous => {
    const dish = cook(previous.dish, action, value);
    if (dish === previous.dish) return previous;
    applied = true;
    const history = [...previous.history, previous.dish].slice(-80);
    return { ...previous, dish, history };
  }, () => {
    if (!applied) {
      if (action === 'place') find('status').textContent = 'The bowl is full. Undo a topping to make room.';
      return;
    }
    find('status').textContent = '';
    if (action !== 'stir') gameSound(action === 'serve' ? 'serve' : 'add');
    animateAction(action === 'pour-broth' ? 'pour' : action, action === 'place' ? record.dish.placements.at(-1) : value);
  });
}

function animateAction(action, value) {
  const generation = ++effectGeneration;
  const effect = find('effect');
  switch (action) {
    case 'pour':
      effect.innerHTML = `<g transform="translate(87 114) rotate(-32)">${props.pour}</g>
        <path class="ramen-stream" d="M64 114q32 5 49 49" stroke="${broths[record.dish.broth].color}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      break;
    case 'noodles':
      effect.innerHTML = '<g transform="translate(120 162)"><g class="ramen-drop">' + props.noodles + '</g></g>';
      break;
    case 'transfer':
      effect.innerHTML = '<g transform="translate(325 224)"><g class="ramen-transfer">' + props.transfer + '</g></g>';
      break;
    case 'stir':
      effect.innerHTML = '<path class="ramen-ripple" d="M73 165a47 13 0 1 0 94 0a47 13 0 1 0-94 0" stroke="#fff0c6" fill="none" stroke-width="3"/>';
      break;
    case 'place':
      effect.innerHTML = '<g transform="translate(' + value.x + ' ' + value.y + ')"><g class="ramen-drop">' + ingredients[value.id].art + '</g></g>';
      break;
    default:
      effect.replaceChildren();
  }
  setTimeout(() => {
    if (generation === effectGeneration && !isDragging()) effect.replaceChildren();
  }, 700);
}

function addOption(label, action, { target, value, icon, disabled = false } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.disabled = disabled;
  button.dataset.action = action;
  if (target) button.dataset.target = target;
  if (value) button.dataset.value = value;
  if (icon) button.innerHTML = icon;
  button.append(label);
  find('options').append(button);
  return button;
}

function render() {
  if (!record) return;
  const { dish, history } = record;
  const changedStage = currentStage !== dish.stage;
  const focusedAction = document.activeElement?.dataset.action;
  const focusedValue = document.activeElement?.dataset.value;
  find('pot').innerHTML = potArt(dish);
  find('bowl').innerHTML = dish.stage === 'served'
    ? '<g transform="translate(365 189)"><g class="ramen-served-bowl"><g transform="translate(-325 -224)">' +
      bowlArt(dish) + '</g></g></g>'
    : bowlArt(dish);
  scene.classList.toggle('served', dish.stage === 'served');
  scene.classList.toggle('can-stir', dish.stage === 'stir');
  const topped = dish.placements.some(item => !ingredients[item.id].garnish);
  const garnished = dish.placements.some(item => ingredients[item.id].garnish);
  find('instructions').textContent = stages[dish.stage] + (
    dish.stage === 'stir' ? ' ' + dish.stir + ' / ' + stirSteps :
    dish.stage === 'toppings' && topped && !garnished ? ' Finish with scallions or sesame.' : '');
  find('undo').disabled = !history.length;
  find('reset').disabled = dish.stage === 'choose' && !history.length;
  find('replay').hidden = dish.stage !== 'served';
  find('save').hidden = dish.stage !== 'served';
  find('placement').hidden = dish.stage !== 'toppings';
  const serve = find('serve');
  serve.hidden = dish.stage !== 'toppings';
  serve.disabled = !garnished;
  serve.dataset.action = 'serve';
  serve.dataset.target = 'customer';
  if (changedStage || document.activeElement !== find('name')) find('name').value = record.name;
  if (changedStage || ['choose', 'pour', 'toppings'].includes(dish.stage)) {
    const options = find('options');
    options.replaceChildren();
    for (const piece of find('shelf').children) {
      const { action, value } = piece.dataset;
      const enabled = action === 'choose' ? ['choose','pour'].includes(dish.stage)
        : action === 'noodles' ? dish.stage === 'noodles'
        : dish.stage === 'toppings' && (!ingredients[value].garnish || topped) &&
          dish.placements.length < (garnished || ingredients[value].garnish ? 24 : 23);
      piece.disabled = !enabled;
      piece.classList.toggle('ingredient-used', action === 'noodles' ? dish.stir > 0 || !['choose','pour','heat','noodles'].includes(dish.stage)
        : action === 'place' ? dish.placements.some(item => item.id === value) && dish.stage === 'served'
        : dish.broth === value && !enabled);
      if (action === 'choose') piece.setAttribute('aria-pressed', String(value === dish.broth));
    }
    if (toolsByStage[dish.stage] && dish.stage !== 'noodles') {
      const [label, target] = toolsByStage[dish.stage];
      addOption(label, dish.stage, { target });
    }
    if (focusedAction && !showingScrapbook) {
      const buttons = [...find('shelf').querySelectorAll('button:not(:disabled)'), ...options.querySelectorAll('button:not(:disabled)')];
      const next = buttons.find(button => button.dataset.action === focusedAction && button.dataset.value === focusedValue);
      (next ?? (dish.stage === 'served' ? find('name') : buttons[0]) ?? serve).focus();
    }
  }
  currentStage = dish.stage;
}

function changeView(scrapbook) {
  showingScrapbook = scrapbook;
  find('kitchen').hidden = scrapbook;
  find('scrapbook').hidden = !scrapbook;
  find('toggle').textContent = scrapbook ? (scrapbookOrigin === 'market' ? 'Back to Village' : 'Back to kitchen') : 'Recipe Scrapbook';
  bar.querySelector('.ramen-heading h2').textContent = scrapbook ? 'Recipe Scrapbook' : 'Sakura Ramen Bar';
  if (scrapbook) renderScrapbook();
  else scrapbookRender++;
  bar.dispatchEvent(new CustomEvent('dayquest:scrapbook', { bubbles: true, detail: scrapbook }));
}

export function showRamenKitchen() {
  scrapbookOrigin = undefined;
  changeView(false);
}

export function openVillageScrapbook(origin, id) {
  scrapbookOrigin = origin;
  if (id) {
    activeRecipe = id;
    find('filter').value = 'all';
  }
  changeView(true);
}

async function renderScrapbook() {
  if (!db) return;
  const generation = ++scrapbookRender;
  const list = find('recipes');
  const detail = find('recipe-detail');
  list.textContent = 'Opening your scrapbook?';
  detail.hidden = true;
  try {
    const [ramen, pizza, ice, curry] = await Promise.all([
      cookingRecord(db), cookingRecord(db, undefined, 'pizza', freshPizza),
      cookingRecord(db, undefined, 'ice', freshIce), cookingRecord(db, undefined, 'curry', freshCurry)
    ]);
    if (generation !== scrapbookRender) return;
    collection = [
      ...ramen.recipes.map(recipe => ({ ...recipe, kind: 'ramen' })),
      ...pizza.recipes.map(recipe => ({ ...recipe, kind: 'pizza' })),
      ...ice.recipes.map(recipe => ({ ...recipe, kind: 'ice' })),
      ...curry.recipes.map(recipe => ({ ...recipe, kind: 'curry' }))
    ];
    displayRecipeList();
  } catch {
    if (generation === scrapbookRender) list.textContent = 'The scrapbook could not open. Try again.';
  }
}

function displayRecipeList() {
  const list = find('recipes');
  find('recipe-detail').hidden = true;
  list.replaceChildren();
  const filter = find('filter').value;
  const visible = collection.filter(recipe => filter === 'all' || recipe.kind === filter);
  if (!visible.length) {
    list.textContent = filter === 'all' ? 'Serve and save a dish to start your scrapbook.' : 'No saved dishes from this shop yet.';
    return;
  }
  for (const recipe of [...visible].reverse()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = recipe.name;
    button.title = { ramen: 'Ramen', pizza: 'Pizza', ice: 'Ice cream', curry: 'Curry' }[recipe.kind];
    button.addEventListener('click', () => showRecipe(recipe));
    list.append(button);
  }
  const selected = visible.find(recipe => recipe.id === activeRecipe);
  if (selected) showRecipe(selected);
}

find('filter').addEventListener('change', displayRecipeList);

function showRecipe(recipe) {
  activeRecipe = recipe.id;
  find('recipe-detail').hidden = false;
  find('recipe-name').textContent = recipe.name;
  const { kind, dish } = recipe;
  const bowl = find('recipe-bowl');
  const svg = bowl.ownerSVGElement;
  const views = {
    ramen: ['214 178 222 100', 'Saved ramen bowl', () => bowlArt(dish, 'ramen-recipe-rim')],
    pizza: ['111 121 272 149', 'Saved pizza', () => pizzaArt(dish)],
    ice: ['253 101 148 173', 'Saved ice cream', () => iceArt(dish)],
    curry: ['240 179 198 90', 'Saved curry', () => curryPlateArt(dish)]
  };
  const [viewBox, label, art] = views[kind];
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-label', label);
  bowl.innerHTML = art();
  const catalog = { ramen: ingredients, pizza: pizzaToppings, ice: iceToppings }[kind];
  const toppings = kind === 'curry' ? [...dish.veg, ...(dish.garnish ? ['herbs'] : [])].map(id => curryToppings[id][0]) : dish.placements.map(item => kind === 'ramen' ? catalog[item.id].name : catalog[item.id][0]);
  const base = kind === 'ramen' ? [broths[dish.broth].name] : kind === 'ice'
    ? [dish.vessel === 'cone' ? 'Waffle cone' : 'Sundae cup', ...dish.scoops.map(id => flavors[id][0])]
    : kind === 'curry' ? [sauces[dish.sauce].name, 'Steamed rice'] : ['Sakura tomato sauce'];
  find('recipe-ingredients').textContent = [...base, ...new Set(toppings)].join(' ? ');
}

function startOver(broth) {
  const unfinished = !['choose', 'served'].includes(record.dish.stage) ||
    (record.dish.stage === 'served' && !record.recipes.some(recipe => recipe.dish === record.dish ||
      JSON.stringify(recipe.dish) === JSON.stringify(record.dish)));
  if (unfinished && !window.confirm('Replace the current bowl? Saved recipes will stay in your scrapbook.')) return;
  update(previous => {
    const empty = freshDish();
    return { ...previous, dish: broth ? cook(empty, 'choose', broth) : empty, history: [], name: '' };
  }, () => {
    find('status').textContent = '';
    showRamenKitchen();
    bar.dispatchEvent(new CustomEvent('dayquest:shop', { bubbles: true, detail: { kind: 'ramen' } }));
  });
}

find('toggle').addEventListener('click', () => {
  if (showingScrapbook) {
    const kind = scrapbookOrigin ?? 'ramen';
    showRamenKitchen();
    bar.dispatchEvent(new CustomEvent('dayquest:shop', { bubbles: true, detail: { kind } }));
  } else changeView(!showingScrapbook);
});
find('reset').addEventListener('click', () => startOver());
find('replay').addEventListener('click', () => startOver(record.dish.broth));
find('cook-recipe').addEventListener('click', () => {
  const recipe = collection.find(item => item.id === activeRecipe);
  if (!recipe) return;
  if (recipe.kind === 'ramen') startOver(recipe.dish.broth);
  else bar.dispatchEvent(new CustomEvent('dayquest:shop', {
    bubbles: true, detail: { kind: recipe.kind, recipe: recipe.dish }
  }));
});
find('undo').addEventListener('click', () => update(previous => {
  if (!previous.history.length) return previous;
  const dish = previous.history.at(-1);
  return { ...previous, dish, history: previous.history.slice(0, -1) };
}, () => {
  find('status').textContent = 'Last cooking action undone.';
  find('effect').replaceChildren();
}));

find('name').addEventListener('input', event => {
  const name = event.target.value;
  update(previous => previous.dish.stage === 'served' ? { ...previous, name } : previous);
});
find('save').addEventListener('submit', event => {
  event.preventDefault();
  const name = find('name').value.trim();
  if (!name) {
    find('status').textContent = 'Enter a name for your ramen.';
    find('name').focus();
    return;
  }
  const id = Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, '0')).join('');
  let saved = false;
  update(previous => {
    if (previous.dish.stage !== 'served') return previous;
    saved = true;
    return { ...previous, name, recipes: [...previous.recipes, { id, name, dish: previous.dish }] };
  }, () => {
    if (!saved) return;
    activeRecipe = id;
    find('filter').value = 'all';
    document.dispatchEvent(new Event('dayquest:recipe-saved'));
    changeView(true);
    find('status').textContent = 'Saved to your Recipe Scrapbook.';
    find('toggle').focus();
  });
});

function actionFromButton(button, point) {
  const { action, value } = button.dataset;
  if (action === 'choose' && point) {
    perform('pour-broth', value);
  } else if (action === 'place') {
    const position = Number(find('position').value);
    const [x, y] = position === 0 ? plating[value] : positions[position];
    perform(action, { id: value, ...(point ?? { x, y }) });
  } else {
    perform(action, value);
  }
}

bar.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button && !button.disabled && !event.defaultPrevented) actionFromButton(button);
});

function overPot({ x, y }) {
  return Math.hypot((x - 120) / 77, (y - 166) / 32) <= 1;
}

function overTarget(target, point) {
  if (target === 'pot') return overPot(point);
  if (target === 'bowl') return inBowl(point);
  return Math.hypot((point.x - 370) / 56, (point.y - 130) / 58) <= 1;
}

const isDragging = bindCookingButtons(bar, {
  isBusy: () => Boolean(stirring),
  move(button, event) {
    const { target } = button.dataset;
    const point = svgPoint(scene, event);
    scene.dataset.target = target;
    scene.classList.toggle('valid-drop', overTarget(target, point));
  },
  clear() {
    delete scene.dataset.target;
    scene.classList.remove('valid-drop');
    find('effect').replaceChildren();
  },
  drop(button, event) {
    const point = svgPoint(scene, event);
    if (overTarget(button.dataset.target, point)) actionFromButton(button, point);
    else find('status').textContent = 'Move the ingredient over the highlighted target before releasing.';
  }
});

scene.addEventListener('pointerdown', event => {
  if (record?.dish.stage !== 'stir' || event.button !== 0 || isDragging() || stirring) return;
  const point = svgPoint(scene, event);
  if (!overPot(point)) return;
  stirring = { id: event.pointerId, angle: null, arc: 0 };
  scene.setPointerCapture(event.pointerId);
});

scene.addEventListener('pointermove', event => {
  if (stirring?.id !== event.pointerId) return;
  const point = svgPoint(scene, event);
  const x = (point.x - 120) / 77;
  const y = (point.y - 166) / 32;
  const radius = Math.hypot(x, y);
  if (radius < 0.22 || radius > 1) {
    stirring.angle = null;
    stirring.arc = 0;
    return;
  }
  const angle = Math.atan2(y, x);
  if (stirring.angle !== null) {
    const delta = angle - stirring.angle;
    stirring.arc += Math.atan2(Math.sin(delta), Math.cos(delta));
    if (Math.abs(stirring.arc) >= Math.PI / 2) {
      perform('stir');
      stirring.arc = 0;
    }
  }
  stirring.angle = angle;
});

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  scene.addEventListener(type, event => {
    if (stirring?.id === event.pointerId) stirring = null;
  });
}

document.addEventListener('dayquest:kitchens', async () => {
  if (!db) return;
  try {
    await queue;
    record = await cookingRecord(db);
    render();
    if (showingScrapbook) renderScrapbook();
  } catch {
    find('status').textContent = 'Reopen DayQuest to load the restored kitchen.';
  }
});

async function startRamen() {
  try {
    db = await openCookingStore();
    record = await cookingRecord(db);
    render();
    if (showingScrapbook) renderScrapbook();
  } catch {
    find('instructions').textContent = 'The kitchen needs browser storage to save your progress. Reopen DayQuest with site storage enabled.';
  }
}

startRamen();
