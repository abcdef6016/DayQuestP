export const sauces = {
  coconut: { name: 'Coconut curry', color: '#e7ac60' },
  tomato: { name: 'Tomato curry', color: '#ba6559' }
};
export const curryToppings = {
  pepper: ['Sweet pepper', '<path d="M-12 5q1-15 20-15q8 3-4 16q-11 8-16-1" fill="#be555d"/><path d="M6-8l5-5" stroke="#739370" stroke-width="3"/>'],
  potato: ['Golden potato', '<path d="m-11-5 9-7 13 6 2 12-12 7-12-6z" fill="#f1cd8d" stroke="#ba895e" stroke-width="2"/>'],
  peas: ['Garden peas', '<g fill="#91a864" stroke="#5d805a"><circle cx="-8" cy="-3" r="5"/><circle cx="3" cy="-5" r="5"/><circle cx="6" cy="5" r="5"/></g>'],
  herbs: ['Fresh cilantro', '<path d="M0 9V-2m0 4q-19 1-12-9Q-5-11 0 1m0 0Q9-16 13-7q4 9-13 8" fill="#7fa56e" stroke="#5b7a61" stroke-width="2"/>'],
  spice: ['Bloom spices', '<ellipse rx="14" ry="8" fill="#e4b5ac"/><path d="m-9 0 3-5 9 1 5 5" stroke="#b66c54" stroke-width="4" fill="none"/>']
};
export const curryStirs = 6;
export const freshCurry = () => ({ stage: 'base', sauce: null, stir: 0, veg: [], garnish: false });
export const curryPan = ({ x, y }) => Math.hypot((x - 136) / 74, (y - 172) / 35) <= 1;
export const curryPlate = ({ x, y }) => Math.hypot((x - 339) / 85, (y - 217) / 33) <= 1;

export function curryAction(dish, action, value) {
  const { stage } = dish;
  if (action === 'base' && stage === 'base' && Object.hasOwn(sauces, value))
    return { ...dish, sauce: value, stage: 'spice' };
  if (action === 'spice' && stage === 'spice') return { ...dish, stage: 'veg' };
  if (action === 'veg' && stage === 'veg' && ['pepper','potato','peas'].includes(value) && !dish.veg.includes(value))
    return { ...dish, veg: [...dish.veg, value] };
  if (action === 'simmer' && stage === 'veg' && dish.veg.length) return { ...dish, stage: 'stir' };
  if (action === 'stir' && stage === 'stir') {
    const stir = dish.stir + 1;
    return { ...dish, stir, stage: stir === curryStirs ? 'plate' : 'stir' };
  }
  if (action === 'plate' && stage === 'plate') return { ...dish, stage: 'finish' };
  if (action === 'herbs' && stage === 'finish' && !dish.garnish) return { ...dish, garnish: true };
  if (action === 'serve' && stage === 'finish' && dish.garnish) return { ...dish, stage: 'served' };
  return dish;
}

const vegetables = (dish, points) => dish.veg.map((id,index) =>
  '<g transform="translate(' + points[index].join(' ') + ')">' + curryToppings[id][1] + '</g>').join('');

export function curryPlateArt(dish) {
  const filled = ['finish','served'].includes(dish.stage);
  return '<ellipse cx="339" cy="231" rx="92" ry="32" fill="#885779"/><ellipse cx="339" cy="218" rx="94" ry="36" fill="#f6d8e8" stroke="#a96b99" stroke-width="3"/>' +
    '<path d="M270 221q1-28 31-29q29 1 36 27q-21 21-67 2" fill="#fff1d9"/><path d="m284 210 4 2m10-10l5 3m10 7 5 3m-29 6 5-1" stroke="#dfc09c" stroke-width="3" stroke-linecap="round"/>' +
    (filled ? '<ellipse cx="365" cy="218" rx="52" ry="26" fill="' + sauces[dish.sauce].color + '"/>' +
      vegetables(dish,[[347,212],[371,226],[391,209]]) +
      (dish.garnish ? '<g transform="translate(364 203)">' + curryToppings.herbs[1] + '</g>' : '') : '');
}

export function curryCounterArt(dish) {
  const filled = dish.sauce && !['finish','served'].includes(dish.stage);
  const hot = ['stir','plate'].includes(dish.stage);
  const liquid = filled ? '<ellipse cx="136" cy="172" rx="70" ry="25" fill="' + sauces[dish.sauce].color + '"/>' :
    '<ellipse cx="136" cy="172" rx="70" ry="25" fill="#624861"/>';
  const steam = hot ? '<g class="ramen-steam" fill="none" stroke="#ffe7de" stroke-width="3" stroke-linecap="round"><path d="M111 151q-9-10 0-22t0-12m25 31q-9-10 0-22t0-12m25 31q-9-10 0-22t0-12"/></g>' : '';
  const track = dish.stir ? '<ellipse cx="136" cy="172" rx="' + (25 + dish.stir * 5) + '" ry="15" fill="none" stroke="#ffe0a7" stroke-width="2"/>' : '';
  const plate = dish.stage !== 'served' ? curryPlateArt(dish)
    : '<g transform="translate(385 164) scale(.72) translate(-339 -217)">' + curryPlateArt(dish) + '</g>';
  return '<rect x="64" y="199" width="143" height="42" rx="12" fill="#494055"/><circle cx="186" cy="221" r="7" fill="' + (hot ? '#ffc778' : '#aa839e') + '"/>' +
    '<path d="M73 173 41 163m155 11 36-14" stroke="#67475f" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M55 174q12 39 81 39t81-39" fill="#796484" stroke="#553f66" stroke-width="3"/><ellipse cx="136" cy="172" rx="81" ry="33" fill="#b087aa"/>' +
    liquid + (filled ? track + vegetables(dish,[[103,170],[139,182],[166,166]]) : '') + steam + plate;
}
