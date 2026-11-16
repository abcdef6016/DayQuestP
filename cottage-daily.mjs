export const companions = {
  pip: { name: 'Pip', kind: 'moss rabbit', coat: '#f5dfb5', accent: '#ad7578', scarf: '#709083' },
  mallow: { name: 'Mallow', kind: 'orchard cat', coat: '#df9a76', accent: '#b76a72', scarf: '#78919b' },
  bramble: { name: 'Bramble', kind: 'fern bear', coat: '#bf9e8d', accent: '#b67d78', scarf: '#a8a66e' },
  clover: { name: 'Clover', kind: 'garden frog', coat: '#a2be87', accent: '#be8a78', scarf: '#bb8297' }
};

const greetings = [
  'There’s a sunny spot by the window with your name on it.',
  'The kettle’s on. What would you like to make time for today?',
  'I opened the curtains for you. The garden looks lovely this morning.',
  'We can take our time. There’s room for one small adventure today.',
  'I saved you a seat by the door. The breeze smells like blossoms.'
];

export const foods = [
  { kind: 'ramen', name: 'Golden miso ramen', detail: 'Golden miso broth, jammy egg, and scallions.' },
  { kind: 'ramen', name: 'Ginger kombu ramen', detail: 'Ginger kombu broth, shiitake, and sesame.' },
  { kind: 'pizza', name: 'Forest mushroom pizza', detail: 'Tomato sauce, mozzarella, forest mushrooms, and sweet basil.' },
  { kind: 'pizza', name: 'Orchard tomato pizza', detail: 'Tomato sauce, mozzarella, and cherry tomatoes.' },
  { kind: 'ice', name: 'Petal sundae', detail: 'Sakura strawberry, honey vanilla, and petal sprinkles.' },
  { kind: 'ice', name: 'Moonberry cone', detail: 'Moonberry in a waffle cone with a sugared berry.' },
  { kind: 'curry', name: 'Garden coconut curry', detail: 'Coconut curry with garden peas and golden potato.' },
  { kind: 'curry', name: 'Sunset tomato curry', detail: 'Tomato curry with sweet pepper and fresh cilantro.' }
];

export function localDay(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
}

function randomFor(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => {
    hash = (hash + 0x6D2B79F5) | 0;
    let mixed = Math.imul(hash ^ hash >>> 15, 1 | hash);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

const kitchenKinds = [...new Set(foods.map(food => food.kind))];

function kitchenOrder(seed, cycle) {
  const random = randomFor(seed + '/kitchens/' + cycle);
  const order = [...kitchenKinds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function dailyRecipe(seed, date) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const cycle = Math.floor(day / kitchenKinds.length);
  const order = kitchenOrder(seed, cycle);
  if (order[0] === kitchenOrder(seed, cycle - 1).at(-1)) [order[0], order[1]] = [order[1], order[0]];
  const choices = foods.filter(food => food.kind === order[day - cycle * kitchenKinds.length]);
  const random = randomFor(seed + '/recipe/' + day);
  return choices[Math.floor(random() * choices.length)];
}

export function dailyContent(seed, date) {
  const day = localDay(date);
  const random = randomFor(seed + '/' + day);
  const pick = list => list[Math.floor(random() * list.length)];
  const ids = Object.keys(companions);
  const companion = pick(ids);
  const greeting = pick(greetings);
  const food = dailyRecipe(seed, date);
  const visitor = pick(ids.filter(id => id !== companion));
  const mayVisit = random() < 0.65;
  const minute = 8 * 60 + Math.floor(random() * 10 * 60);
  return { day, companion, greeting, food, visitor: mayVisit ? visitor : null, minute };
}

export function visitDue(daily, date, { enabled, idle, seen }) {
  return Boolean(enabled && idle && !seen && daily.visitor &&
    date.getHours() * 60 + date.getMinutes() >= daily.minute);
}
