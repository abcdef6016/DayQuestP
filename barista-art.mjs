import { drinkById } from './barista-model.mjs';
const coffee = /coffee|cocoa|chocolate|cookie|malt/i;
const cream = /milk|cream|vanilla|buttermilk|sugar|marshmallow/i;
const citrus = /orange|lemon|lime|pineapple|grapefruit|peach|honey|caramel|maple|ginger/i;
const green = /mint|cucumber|rhubarb/i;
const ice = /^(ice|water|sparkling water)$/i;

export function ingredientColor(ingredient) {
  if (coffee.test(ingredient)) return '#77506b';
  if (cream.test(ingredient)) return '#f8dcbe';
  if (citrus.test(ingredient)) return '#f2b77d';
  if (green.test(ingredient)) return '#a2c8a0';
  if (ice.test(ingredient)) return '#c9bff4';
  return '#d481aa';
}

export function ingredientArt(ingredient) {
  if (/whipped cream/i.test(ingredient)) return '<g transform="translate(0 10) scale(.34)">' + foam() + '</g>';
  const color = ingredientColor(ingredient);
  if (ice.test(ingredient))
    return '<rect x="-10" y="-10" width="20" height="20" rx="5" fill="' + color + '" stroke="#f3e8ff" stroke-width="2"/><path d="M-6 0v-5h6" fill="none" stroke="#fff4ff" stroke-width="2"/>';
  if (green.test(ingredient))
    return '<path d="M-10 10Q-15-10 12-12 15 12-10 10Z" fill="' + color + '"/><path d="m-10 10 16-16" stroke="#5a8b73" stroke-width="2"/>';
  return '<ellipse cy="4" rx="15" ry="9" fill="#d09fc1" stroke="#76536e" stroke-width="2"/><path d="M-12 3q3-11 12-10 9 0 12 10-12 9-24 0Z" fill="' + color + '"/><path d="m-5-2 3-3m5 4 2-1" stroke="#ffebed" opacity=".75" stroke-width="2" stroke-linecap="round"/>';
}

const sauceColors = [
  [/chocolate/i,'#583136'], [/caramel|maple|honey/i,'#c7793b'], [/grenadine|cherry/i,'#a32e57'],
  [/strawberry|raspberry/i,'#cc5476'], [/lemon|pineapple|peach/i,'#e5a54e'], [/lime/i,'#8cab60'],
  [/rose/i,'#d484af']
];
function sauceColor(item) {
  return sauceColors.find(([pattern]) => pattern.test(item))?.[1] ?? '#bd8e5f';
}

function isSauce(item) {
  return /syrup|caramel|grenadine|honey|orgeat/i.test(item);
}

function isCream(item) {
  return /milk|cream/i.test(item) && !/ice cream|powder/i.test(item);
}

function foam(color = '#fff2df') {
  return '<path d="M-49 2q-8-14 12-19q-7-13 13-17q-5-12 13-17q3-15 18-18q-4 11 8 13q20 3 18 15q18 5 16 20q16 5 8 17q-24 18-100 6Z" fill="' + color +
    '" stroke="#d8acaa" stroke-width="2"/><path d="M-37-12q27 15 68 0m-53-17q25 10 50-1m-38-15q14 6 26 1m-6-14q4 3 11 3" fill="none" stroke="#d9b5af" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M-45 0q28 18 87 1l-5 6q-35 15-82 1Zm14-19q22 13 61 2q-12 9-33 11q-17-1-28-7Zm10-16q17 9 39-1q-11 10-31 10Z" fill="#b67b89" opacity=".22"/>' +
    '<path d="M-43-3q8 7 21 7m-14-22q12 5 29 4m-13-20q11 4 22 1m-5-14q5 3 11 1" stroke="#fffdf5" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M-40 2q19 5 32 1m-14-22q12 2 22 0" stroke="#fffaf0" stroke-width="4" fill="none" stroke-linecap="round"/>';
}

function blendColor(colors) {
  if (!colors.length) return '#cba883';
  const channels = [1,3,5].map(offset => Math.round(colors.reduce((sum,color) =>
    sum + parseInt(color.slice(offset,offset+2),16),0)/colors.length));
  return '#' + channels.map(channel => channel.toString(16).padStart(2,'0')).join('');
}

export function pourArt(color, thick = false) {
  return '<path class="barista-pour" d="M-37-87C-32-60-10-66-12-39S15-18 11 0" stroke="' + color +
    '" stroke-width="' + (thick ? 12 : 8) + '" stroke-linecap="round" fill="none"/><ellipse class="barista-splash" cy="4" rx="32" ry="8" fill="' + color + '" opacity=".8"/>';
}

export function additionArt(item) {
  if (isSauce(item) || isCream(item)) {
    const sauce = isSauce(item);
    const color = sauce ? sauceColor(item) : /buttermilk/i.test(item) ? '#f3d7b1' : '#fff0df';
    return pourArt(color, !sauce) + (/whipped cream/i.test(item)
      ? '<g class="barista-foam-arrival" transform="scale(.63)">' + foam() + '</g>' : '');
  }
  return '<g class="ramen-drop">' + ingredientArt(item) + '</g>';
}

function drinkSolids(dish) {
  const layer = drinkById[dish.recipeId]?.category === 'mud';
  return (dish.added ?? []).filter(item => item !== 'Ice' && !/whipped cream/i.test(item) &&
    !(item === 'Ice cream' && (layer || dish.turns < 3)));
}

export function drinkSurface(dish) {
  return 224 - Math.min(88, drinkSolids(dish).length * 21);
}

export function baristaGlass(dish, clipId) {
  const ingredients = dish.added ?? [];
  const recipe = drinkById[dish.recipeId];
  const layers = recipe?.category === 'mud';
  const whipped = ingredients.some(item => /whipped cream/i.test(item));
  const scoops = ingredients.includes('Ice cream') && (layers || dish.turns < 3);
  const solids = drinkSolids(dish);
  const count = solids.length;
  const y = drinkSurface(dish);
  const color = blendColor(solids.map(item => isSauce(item) ? sauceColor(item) : ingredientColor(item)));
  const fillId = clipId + '-fill', shadeId = clipId + '-shade';
  const body = solids.length
    ? '<path d="M186 ' + y + 'q52-16 108 0v125H186Z" fill="url(#' + fillId + ')"/>' +
      '<ellipse cx="240" cy="' + y + '" rx="52" ry="8" fill="' + color + '" stroke="#fff0e2" stroke-opacity=".4"/>' : '';
  const ribbons = solids.filter(isSauce).map((item,i) =>
    '<path d="M' + (199+i*12) + ' ' + (y+3) + 'q-11 13 8 19t-3 25m30-20q12 3 8 18" stroke="' +
    sauceColor(item) + '" stroke-width="5" stroke-linecap="round" fill="none" opacity="' + (dish.turns >= 3 && !layers ? .34 : .8) + '"/>').join('');
  const bands = layers ? solids.map((item,index) => {
    const line = 226 - (index+1) * Math.min(22, 84 / Math.max(count,1));
    return '<path d="M183 ' + line + 'q52-13 116 0v21q-58-9-116 1Z" fill="' +
      (isSauce(item) ? sauceColor(item) : ingredientColor(item)) + '"/>';
  }).join('') : '';
  const cubes = ingredients.includes('Ice') ? [[218,5,-16],[252,1,21],[274,9,12]].map(([x,dy,angle]) =>
    '<g opacity=".71" transform="translate(' + x + ' ' + Math.min(214,y+dy) + ') rotate(' + angle +
    ') scale(.72)">' + ingredientArt('Ice') + '</g>').join('') : '';
  const garnish = ingredients.find(item => /^(lime|lemon|orange|mint|strawberry|banana)$/i.test(item));
  const float = garnish && !layers && (recipe?.method !== 'blend' || dish.turns < 3)
    ? '<g transform="translate(267 ' + (count ? y+4 : 204) + ') rotate(-17) scale(.71)">' +
      ingredientArt(garnish) + '</g>' : '';
  const chocolate = ingredients.some(item => /chocolate|cocoa/i.test(item));
  const toppingDrizzle = chocolate
    ? '<path d="M-38-8q9-7 16 2t16-1t16 1t19-5m-29-21q9 7 19 2" fill="none" stroke="#653640" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M-34-9q8-4 11 1m22 2q5-4 10-1" fill="none" stroke="#bb766f" stroke-width="1.1" stroke-linecap="round"/>' : '';
  const top = whipped
    ? '<g transform="translate(240 ' + (count ? y+2 : 212) + ') scale(.93)">' + foam() + toppingDrizzle + '</g>'
    : scoops ? '<g transform="translate(238 ' + (count ? y+3 : 214) + ')"><path d="M-35 0q-4-13 8-20q4-24 26-24t27 23q16 10 11 23q-15 15-37 7q-24 7-35-9Z" fill="#fae1ca" stroke="#c4959c" stroke-width="2"/><path d="M-14-30q13-12 26 0" fill="none" stroke="#fff4e5" stroke-width="4" stroke-linecap="round"/></g>' : '';

  return '<defs><clipPath id="' + clipId + '"><path d="M185 117h110l-12 102q-1 12-43 12t-43-12Z"/></clipPath>' +
    '<linearGradient id="' + fillId + '" x2="0" y2="1"><stop stop-color="' + color + '"/><stop offset="1" stop-color="' + color + '"/><stop offset="1" stop-color="#45293b" stop-opacity=".32"/></linearGradient>' +
    '<linearGradient id="' + shadeId + '"><stop stop-color="#fff6f5" stop-opacity=".18"/><stop offset=".6" stop-color="#fff6f5" stop-opacity="0"/><stop offset="1" stop-color="#604163" stop-opacity=".45"/></linearGradient></defs>' +
    '<ellipse cx="240" cy="236" rx="72" ry="12" fill="#412743" opacity=".35"/><path d="M185 117h110l-12 102q-1 12-43 12t-43-12Z" fill="#d3b8ea" fill-opacity=".42"/>' +
    '<g clip-path="url(#' + clipId + ')">' + body + bands + ribbons + cubes + float +
    '<rect x="181" y="112" width="118" height="118" fill="url(#' + shadeId + ')"/><path d="m202 142 8 62m10 3 2 10" stroke="#fff6f7" stroke-width="4" stroke-linecap="round" opacity=".57"/></g>' +
    '<path d="M185 118l12 101q1 12 43 12t43-12l12-101" fill="none" stroke="#edc7f1" stroke-width="3"/><ellipse cx="240" cy="117" rx="55" ry="11" fill="none" stroke="#edc7f1" stroke-width="3"/>' + top;
}

function customerArt(customer, served) {
  const ears = customer.ears === 'rabbit'
    ? '<path d="M-20-15q-20-36-7-39q11-2 21 33m10 0q9-36 20-33q12 6-4 38" fill="' + customer.coat + '" stroke="#8e6279" stroke-width="3"/>'
    : '<path d="M-30-9-37-34-10-23M30-9 37-34 10-23" fill="' + customer.coat + '" stroke="#8e6279" stroke-width="3"/>';
  return '<g class="barista-customer" transform="translate(360 116)"><g class="' + (served ? 'barista-cheer' : '') + '">' +
    '<path d="M-33 44q5-23 33-23t33 23" fill="#825c8c"/>' + ears +
    '<ellipse rx="37" ry="27" fill="' + customer.coat + '" stroke="#8e6279" stroke-width="3"/><ellipse cy="11" rx="24" ry="13" fill="#ffe6d5"/>' +
    '<path d="M-13-4v2m26-2v2M-5 9q5 7 10 0" fill="none" stroke="#583b55" stroke-width="3" stroke-linecap="round"/>' +
    (served ? '<path d="M49 1q-15-10-10-17q5-5 10 1q7-6 13 0q3 7-13 16" fill="#f6a0c8"/>' : '') + '</g></g>';
}

export function baristaScene(dish, customer) {
  return '<rect width="480" height="270" fill="var(--studio-wall,#a477ac)"/><rect x="19" y="19" width="442" height="157" rx="24" fill="var(--sky-top)" stroke="#9b729e" stroke-width="5"/>' +
    '<circle cx="381" cy="61" r="24" fill="#ffe0ee"/><path d="M22 134q80-54 191-12t148-14t98 6v59H22Z" fill="var(--hill-front)"/>' +
    '<path d="M240 21v151M23 94h435" stroke="#be8cad" opacity=".68" stroke-width="4"/>' + (customer ? customerArt(customer,dish.served) : '') + '<path d="M0 175h480v95H0Z" fill="var(--studio-counter,#976991)"/><path d="M0 179h480M0 251h480" stroke="#d2a0bd" stroke-width="4"/>' +
    '<path d="M45 179v-35h53v35q-25 19-53 0Zm53-24h17q13 0 1 14h-18" fill="#ba88b1" stroke="#865e8a" stroke-width="3"/><path d="M385 180v-67h51v67Z" fill="#bd9db7" stroke="#745477" stroke-width="3"/><rect x="391" y="125" width="38" height="32" rx="4" fill="#77557a"/><path d="m400 135 20 11m-19 4 13-18" stroke="#deb4d8" stroke-width="2"/>' +
    '<g class="barista-glass">' + (customer && dish.served ? '<g transform="translate(360 176) scale(.72) translate(-240 -173)">' : '<g>') +
    baristaGlass(dish,'barista-glass-clip') + '</g></g><g class="barista-effect" pointer-events="none"></g>';
}

export function inGlass({ x,y }) {
  return x >= 175 && x <= 305 && y >= 96 && y <= 234;
}
