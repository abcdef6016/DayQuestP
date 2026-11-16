import { curryCounterArt } from './curry.mjs';
import { flavors, iceToppings, pizzaToppings, rollingPasses, scoopCenter } from './village-recipes.mjs';

const marks = (items, catalog) => items.map(({ id, x, y }) =>
  '<g transform="translate(' + x + ' ' + y + ')">' + catalog[id][1] + '</g>').join('');

export const pizzaProps = {
  pin: '<rect x="-46" y="-3" width="92" height="6" rx="3" fill="#8f5f4f"/><rect x="-29" y="-9" width="58" height="18" rx="8" fill="#daa576" stroke="#a36a52" stroke-width="2"/>',
  sauce: '<ellipse rx="18" ry="11" fill="#9f4f4c"/><ellipse ry="7" rx="14" cy="-2" fill="#ea775a"/><path d="M4-3 26-21" stroke="#775344" stroke-width="5" stroke-linecap="round"/>',
  cutter: '<path d="M0 0 26-24" stroke="#89564d" stroke-width="8" stroke-linecap="round"/><circle r="11" fill="#e9e6d6" stroke="#788d83" stroke-width="2"/><circle r="2" fill="#788d83"/>'
};

export function pizzaArt(dish) {
  const flat = dish.stage !== 'roll';
  const baked = ['slice', 'serve', 'served'].includes(dish.stage);
  const cut = ['serve', 'served'].includes(dish.stage);
  const surface = '<ellipse cx="247" cy="200" rx="131" ry="68" fill="#815849"/><ellipse cx="247" cy="192" rx="131" ry="64" fill="#b78060"/><path d="M126 202q63 60 194 42m-164-89q76-34 157 1" stroke="#e3ad82" stroke-width="3" fill="none"/>';
  const shape = flat
    ? '<ellipse cx="247" cy="191" rx="117" ry="63" fill="' + (baked ? '#d99457' : '#f3ca91') + '" stroke="#b87752" stroke-width="3"/>'
    : '<ellipse cx="247" cy="191" rx="' + (60 + dish.rolls * 14) + '" ry="' + (40 + dish.rolls * 5) + '" fill="#f5d6a5" stroke="#bc8b68" stroke-width="3"/>';
  const sauce = ['roll', 'sauce'].includes(dish.stage) ? '' : '<ellipse cx="247" cy="191" rx="103" ry="52" fill="' + (baked ? '#ad5050' : '#d16258') + '"/>';
  const slices = cut ? '<path d="M136 191h222m-170-51 118 102m0-102L188 242" stroke="#873f46" stroke-width="2" opacity=".75"/>' : '';
  const speckles = baked ? '<path d="m153 166 4-4m52-24 5-2m106 18 4 3m-35 80-5 3m-58 8-5-1m124-57 6 2m-186 29 4 3" stroke="#985744" stroke-width="3" stroke-linecap="round"/>' : '';
  return surface + shape + sauce + marks(dish.placements, pizzaToppings) + slices + speckles;
}

export const scoopArt = color =>
  '<path d="M-28 9q-5-9 3-18Q-22-31 1-31q23 0 27 24q9 12-2 17q-5 8-13 3q-8 5-16 0q-7 5-13 0q-10 5-12-4Z" fill="' + color +
  '" stroke="#8b646a" stroke-width="2"/><path d="M-15-11q5-11 17-11m10 2 6 5" fill="none" stroke="#fff7e5" stroke-width="3" opacity=".7" stroke-linecap="round"/>';

export function iceArt(dish) {
  if (!dish.vessel) return '<ellipse cx="327" cy="253" rx="57" ry="10" fill="#714a48" opacity=".17"/>';
  const cone = '<path d="M289 186h76l-31 77q-7 12-14 0Z" fill="#e5ab72" stroke="#a56b51" stroke-width="3"/><path d="m300 211 22-23m-15 45 43-45m-35 65 38-39m-57-17 38 48m-21-57 28 35m-8-35 15 16" stroke="#b77e5a" stroke-width="2"/>';
  const cup = '<path d="M280 187h94l-14 65q-4 12-33 12t-33-12Z" fill="#e99cab" stroke="#995d70" stroke-width="3"/><path d="M292 229q37 14 70 0" fill="none" stroke="#fff0d8" stroke-width="5"/>';
  return '<ellipse cx="327" cy="258" rx="59" ry="12" fill="#714a48" opacity=".2"/>' +
    (dish.vessel === 'cone' ? cone : cup) +
    '<ellipse cx="327" cy="189" rx="' + (dish.vessel === 'cone' ? '38' : '47') + '" ry="13" fill="#a5736b" stroke="#f9d5ad" stroke-width="4"/>' +
    dish.scoops.map((id, index) =>
      '<g transform="translate(' + scoopCenter(index).join(' ') + ')">' + scoopArt(flavors[id][1]) + '</g>').join('') +
    marks(dish.placements, iceToppings);
}

export function villageScene(kind, dish) {
  const pizza = kind === 'pizza';
  const base = 'var(--studio-wall, ' + (pizza ? '#f4d4ae' : '#f7d8dd') + ')';
  const landscape = 'var(--studio-landscape, ' + (pizza ? '#b2c3a0' : '#abc9b8') + ')';
  const served = dish.stage === 'served';
  const customer = '<g transform="translate(393 100)"><g class="' + (served ? 'village-cheer' : '') + '">' +
    '<path d="M-33 39q11-27 33-27t33 27" fill="#718f80"/><path d="M-30 0-38-32-7-18m37 18 8-32-31 14" fill="#db9472" stroke="#895b54" stroke-width="3"/>' +
    '<path d="M-30-13-34-25-20-18m50 5 4-12-14 7" fill="#f0b0a1"/><ellipse cy="1" rx="38" ry="27" fill="#e2a07b" stroke="#895b54" stroke-width="3"/>' +
    '<path d="M-30 11q8-14 30 0q22-14 30 0q-8 15-30 15t-30-15" fill="#f8dbc0"/><path d="M-16 4v1m32-1v1" stroke="#573d42" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M-5 12q5 9 10 0" stroke="#734955" stroke-width="2" fill="none"/>' +
    (served ? '<path d="M44-3q-15-10-9-16q5-4 10 2q6-6 11 0q4 6-12 14" fill="#d26e80"/>' : '') + '</g></g>';
  const background = '<rect width="480" height="300" fill="' + base + '"/><rect x="21" y="18" width="438" height="137" rx="20" fill="' + landscape + '" stroke="#9b685b" stroke-width="6"/>' +
    '<circle cx="291" cy="58" r="26" fill="#fff0c6"/><path d="M25 129q88-52 178-8t135-13t116 9v31H25Z" fill="var(--studio-tree, #8aa48e)"/>' +
    '<path d="M28 142q73-30 139-8t128-3t158-3v19H28Z" fill="var(--studio-hills, #75957f)"/><path d="M238 20v130M23 94h435" stroke="#9b685b" stroke-width="5"/>' +
    '<path d="M37 21q47 43 104 17m239-11q32 17 70 3" fill="none" stroke="#896252" stroke-width="4"/>' +
    '<g fill="#f3afb6" stroke="#fce1ca" stroke-width="2"><circle cx="52" cy="33" r="12"/><circle cx="81" cy="42" r="10"/><circle cx="114" cy="43" r="12"/><circle cx="397" cy="32" r="10"/><circle cx="435" cy="34" r="13"/></g>' +
    customer + '<path d="M0 150h480v150H0Z" fill="' + ('var(--studio-counter, ' + (pizza ? '#d69b73' : '#d6a0a1') + ')') + '"/><path d="M0 155h480m-480 128h480" stroke="#9c675b" stroke-width="5"/>' +
    '<path d="M0 165h480m-480 108h480" stroke="#ffe3c7" opacity=".62"/>';
  let foreground;
  if (kind === 'curry') foreground = curryCounterArt(dish);
  else if (pizza && dish.stage === 'bake') {
    foreground = '<g class="village-oven"><rect x="113" y="117" width="254" height="146" rx="28" fill="#ad6358" stroke="#794c50" stroke-width="5"/>' +
      '<path d="M139 240v-35q0-66 101-66t101 66v35Z" fill="#62444a"/><ellipse class="village-fire" cx="239" cy="221" rx="94" ry="27" fill="#f2a557"/>' +
      '<g transform="translate(84 132) scale(.63)">' + pizzaArt(dish) + '</g></g>';
  } else if (pizza) {
    foreground = pizzaArt(dish) +
      (dish.stage === 'roll' ? '<g transform="translate(247 ' + (185 + (dish.rolls % 2) * 13) + ')"><g class="village-roll">' + pizzaProps.pin + '</g></g>' : '');
  } else {
    const color = dish.flavor ? flavors[dish.flavor][1] : '#c1b7bd';
    foreground = '<path d="M50 183h158l-12 57q-5 18-67 18t-67-18Z" fill="#85a8a0" stroke="#5f7474" stroke-width="3"/>' +
      '<ellipse cx="129" cy="182" rx="79" ry="33" fill="#fff2dc" stroke="#527774" stroke-width="3"/><ellipse cx="129" cy="182" rx="71" ry="25" fill="' + color + '"/>' +
      '<path d="M72 183q18-18 39-4t34-2t39 2" fill="none" stroke="#fff7e6" opacity=".65" stroke-width="3"/>' + iceArt(dish);
  }
  if (served && kind !== 'curry') {
    const plated = pizza ? pizzaArt(dish) : iceArt(dish);
    foreground = '<g transform="translate(367 166)"><g class="village-served"><g transform="translate(' + (pizza ? '-247 -191' : '-327 -206') + ')">' + plated + '</g></g></g>';
  }
  return background + '<g class="village-food">' + foreground + '</g>';
}

export const pizzaRollLabel = rolls => 'Roll out the dough · ' + rolls + ' / ' + rollingPasses;
