export const pizzaToppings = {
  cheese: ['Mozzarella', '<path d="m-13 3 5-12 11 5 7-3 6 11-10 7-11-4z" fill="#f9de9a"/><path d="m-7 0 8 3m-3 3 5-8m4 0 4 3" stroke="#fff2bf" stroke-width="3"/>'],
  tomato: ['Cherry tomatoes', '<ellipse rx="13" ry="10" fill="#c95253" stroke="#963e4a" stroke-width="2"/><path d="m-7 0 6-4 5 4m-7 2 4 3" fill="none" stroke="#f8a489" stroke-width="2"/>'],
  mushroom: ['Forest mushrooms', '<path d="M-4 0h8v11h-8z" fill="#f7d3a9"/><path d="M-14 3a14 12 0 0 1 28 0Z" fill="#87584e"/><path d="m-6-1 11-3" stroke="#d49177" stroke-width="2"/>'],
  basil: ['Sweet basil', '<path d="M-10 9Q-13-10 13-11Q14 10-10 9Z" fill="#55845c"/><path d="m-9 9 16-15" stroke="#a3bf82" stroke-width="2"/>']
};
export const flavors = {
  strawberry: ['Sakura strawberry', '#e88eaa'],
  mint: ['Forest mint', '#96bca1'],
  vanilla: ['Honey vanilla', '#f2cc88'],
  blueberry: ['Moonberry', '#b3a0ce']
};
export const iceToppings = {
  sprinkles: ['Petal sprinkles', '<path d="m-11 0 5-5m5 9 5 3m2-13 4 3m1 5 4-3" fill="none" stroke="#bd517b" stroke-width="4" stroke-linecap="round"/><path d="m-7 6 4 2m4-11 1-4" stroke="#fff1a2" stroke-width="3" stroke-linecap="round"/>'],
  berry: ['Sugared berry', '<circle r="9" fill="#994764" stroke="#783656" stroke-width="2"/><circle cx="-3" cy="-3" r="2" fill="#efb2bf"/><path d="M0-8q5-8 9-6" stroke="#527b58" stroke-width="2" fill="none"/>'],
  wafer: ['Wafer roll', '<rect x="-5" y="-16" width="10" height="30" rx="4" transform="rotate(25)" fill="#edba83" stroke="#9c624b" stroke-width="2"/><path d="m-1-9 6 4m-10 3 7 4m-11 3 7 4" stroke="#b17754" stroke-width="2"/>']
};
export const bakeTime = 5000;
export const rollingPasses = 4;
export const freshPizza = () => ({ stage: 'roll', rolls: 0, placements: [], readyAt: 0 });
export const freshIce = () => ({ stage: 'vessel', vessel: null, flavor: null, scoops: [], placements: [] });

const ellipse = ({ x, y }, cx, cy, rx, ry) =>
  Number.isFinite(x) && Number.isFinite(y) && Math.hypot((x - cx) / rx, (y - cy) / ry) <= 1;
export const pizzaArea = point => ellipse(point, 247, 191, 111, 58);
export const iceArea = point => ellipse(point, 327, 166, 59, 53);
export const scoopCenter = index => [327 + (index === 1 ? -12 : index === 2 ? 10 : 0), 186 - 23 * index];
export const icePlacement = (point, dish) => dish.scoops.some((_, index) => {
  const [x, y] = scoopCenter(index);
  return ellipse(point, x, y - 7, 29, 24);
});

function place(dish, item, catalog, area, limit = 16) {
  if (!item || !Object.hasOwn(catalog, item.id) || !area(item) || dish.placements.length >= limit) return dish;
  const { id, x, y } = item;
  return { ...dish, placements: [...dish.placements, { id, x, y }] };
}

export function pizzaAction(dish, action, value, now = Date.now()) {
  const { stage } = dish;
  if (action === 'roll' && stage === 'roll') {
    const rolls = dish.rolls + 1;
    return { ...dish, rolls, stage: rolls === rollingPasses ? 'sauce' : 'roll' };
  }
  if (action === 'sauce' && stage === 'sauce') return { ...dish, stage: 'top' };
  if (action === 'place' && stage === 'top') return place(dish, value, pizzaToppings, pizzaArea);
  if (action === 'bake' && stage === 'top' && dish.placements.some(item => item.id === 'cheese'))
    return { ...dish, stage: 'bake', readyAt: now + bakeTime };
  if (action === 'out' && stage === 'bake' && now >= dish.readyAt) return { ...dish, stage: 'slice' };
  if (action === 'slice' && stage === 'slice') return { ...dish, stage: 'serve' };
  if (action === 'serve' && stage === 'serve') return { ...dish, stage: 'served' };
  return dish;
}

export function iceAction(dish, action, value) {
  const { stage } = dish;
  if (action === 'vessel' && stage === 'vessel' && ['cone', 'cup'].includes(value))
    return { ...dish, vessel: value, stage: 'scoop' };
  if (action === 'flavor' && stage === 'scoop' && Object.hasOwn(flavors, value) && value !== dish.flavor)
    return { ...dish, flavor: value };
  if (action === 'scoop-flavor' && stage === 'scoop' && Object.hasOwn(flavors, value))
    return iceAction({ ...dish, flavor: value }, 'scoop');
  if (action === 'scoop' && stage === 'scoop' && dish.flavor && dish.scoops.length < 3) {
    const scoops = [...dish.scoops, dish.flavor];
    return { ...dish, scoops, stage: scoops.length === 3 ? 'top' : 'scoop' };
  }
  if (action === 'finish' && stage === 'scoop' && dish.scoops.length) return { ...dish, stage: 'top' };
  if (action === 'place' && stage === 'top') return place(dish, value, iceToppings, point => icePlacement(point, dish), 12);
  if (action === 'serve' && stage === 'top' && dish.placements.length) return { ...dish, stage: 'served' };
  return dish;
}
