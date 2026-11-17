import { bindCookingButtons } from './cooking-input.mjs';
import { gameSound } from './dayquest-audio.mjs';

const orders = {
  ramen: ['Miso broth', 'Noodles', 'Egg', 'Scallions', 'Sesame', 'Nori'],
  pizza: ['Tomato sauce', 'Mozzarella', 'Basil', 'Mushrooms', 'Cherry tomatoes', 'Olives'],
  ice: ['Vanilla', 'Strawberry', 'Blueberry', 'Sprinkles', 'Chocolate', 'Waffle pieces'],
  curry: ['Coconut milk', 'Potato', 'Peas', 'Cilantro', 'Sweet pepper', 'Tomato']
};

export function mountVillageRush(market, currentKitchen) {
  const panel = document.createElement('details');
  panel.className = 'dayquest-quick-panel';
  panel.innerHTML = `<summary>Quick game · Village Rush</summary>
    <p>Plate matching orders for 30 seconds. Each correct plate earns 10 Village points.</p>
    <button type="button" data-start>Start 30-second rush</button>
    <button type="button" data-stop hidden>End rush</button>
    <p data-clock role="timer" aria-live="off"></p>
    <div data-game hidden>
      <p data-order aria-live="polite"></p>
      <div data-plate class="quick-plate" aria-label="Plate"></div>
      <div data-shelf class="quick-shelf"></div>
      <button type="button" data-clear>Clear plate</button>
      <button type="button" data-serve disabled>Serve plate</button>
    </div>
    <p data-result role="status"></p>`;
  market.append(panel);
  const get = key => panel.querySelector('[data-' + key + ']');
  const ingredients = get('shelf');
  const plate = get('plate');
  let deadline = 0;
  let timer;
  let earned = 0;
  let requested = [];
  let placed = new Set();
  function draw() {
    ingredients.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(placed.has(button.value)));
    });
    plate.textContent = placed.size ? [...placed].join(' · ') : 'Drop ingredients here';
    get('serve').disabled = placed.size !== requested.length;
  }
  function order() {
    const available = Array.from(ingredients.children, button => button.value);
    requested = [];
    while (requested.length < 3) requested.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
    placed = new Set();
    get('order').textContent = 'Order: ' + requested.join(' · ');
    draw();
  }
  function finish() {
    if (!deadline) return;
    deadline = 0;
    clearInterval(timer);
    get('game').hidden = get('stop').hidden = true;
    get('start').disabled = false;
    get('clock').textContent = '';
    get('result').textContent = 'Rush finished · +' + earned + ' points · ' + window.dayQuestHome.villagePoints() + ' lifetime';
    gameSound('finish');
  }
  function tick() {
    const left = Math.ceil((deadline - Date.now()) / 1000);
    if (left <= 0 || market.closest('.tab-content').classList.contains('hidden') || market.hidden || window.dayQuestHome.focusActive()) {
      finish();
      return;
    }
    get('clock').textContent = left + ' seconds · ' + earned + ' points';
  }
  function add(button) {
    if (!deadline || Date.now() >= deadline || placed.has(button.value) || placed.size === 3) return;
    placed.add(button.value);
    draw();
    gameSound('add');
  }
  get('start').onclick = async () => {
    get('start').disabled = true;
    await window.dayQuestHome.ready;
    if (window.dayQuestHome.focusActive()) {
      get('start').disabled = false;
      get('result').textContent = 'Finish your focus session before starting a rush.';
      return;
    }
    earned = 0;
    ingredients.replaceChildren(...orders[currentKitchen() ?? 'ramen'].map(name => {
      const button = document.createElement('button');
      button.type = 'button';
      button.value = button.textContent = name;
      button.dataset.target = 'plate';
      return button;
    }));
    deadline = Date.now() + 30000;
    get('game').hidden = get('stop').hidden = false;
    get('result').textContent = '';
    order();
    tick();
    if (deadline) timer = setInterval(tick, 200);
    gameSound('start');
  };
  get('stop').onclick = finish;
  get('clear').onclick = () => { placed.clear(); draw(); };
  get('serve').onclick = () => {
    if (!deadline || Date.now() >= deadline) return;
    if (!requested.every(item => placed.has(item))) {
      get('result').textContent = 'That plate did not match. Try this order again.';
      placed.clear();
      draw();
      return;
    }
    window.dayQuestHome.addVillagePoints(10);
    earned += 10;
    get('result').textContent = 'Plate served · +10 points';
    gameSound('serve');
    order();
    tick();
  };
  ingredients.onclick = event => {
    const button = event.target.closest('button');
    if (button) add(button);
  };
  bindCookingButtons(ingredients, {
    move(button, event) {
      plate.classList.toggle('quick-drop', document.elementFromPoint(event.clientX, event.clientY) === plate);
    },
    clear() { plate.classList.remove('quick-drop'); },
    drop(button, event) {
      if (document.elementFromPoint(event.clientX, event.clientY) === plate) add(button);
    }
  });
}
