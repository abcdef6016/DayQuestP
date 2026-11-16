export const broths = {
  miso: { name: 'Golden miso', color: '#df9e56' },
  shoyu: { name: 'Forest shoyu', color: '#ad6249' },
  kombu: { name: 'Ginger kombu', color: '#efc77a' }
};

export const ingredients = {
  egg: { name: 'Jammy egg', art: '<ellipse rx="15" ry="10" fill="#fff8df"/><circle r="6" fill="#f2a748"/>' },
  nori: { name: 'Nori', art: '<path d="M-12-12L12-10 10 13-13 10Z" fill="#3e674e"/><path d="m-8-7 14 13m-12-2 5 5" stroke="#769773"/>' },
  mushroom: { name: 'Shiitake', art: '<path d="M-4 1h8v12h-8z" fill="#f4d3a0"/><path d="M-15 3a15 12 0 0 1 30 0Z" fill="#9c5b48"/><path d="m-6-2 11-3m-7-2 5 7" stroke="#ffdbac"/>' },
  scallion: { name: 'Scallions', garnish: true, art: '<g fill="none" stroke="#507f55" stroke-width="3"><ellipse cx="-8" cy="-3" rx="4" ry="3"/><ellipse cx="6" cy="4" rx="4" ry="3"/><ellipse cx="1" cy="-7" rx="3" ry="2"/></g>' },
  sesame: { name: 'Sesame', garnish: true, art: '<g fill="#fff2ce"><ellipse cx="-8" cy="-2" rx="2" ry="4"/><ellipse cx="0" cy="5" rx="2" ry="4"/><ellipse cx="8" cy="-5" rx="2" ry="4"/></g>' }
};

export const stirSteps = 8;
export const freshDish = () => ({ stage: 'choose', broth: null, stir: 0, placements: [] });

export function inBowl({ x, y }) {
  return Number.isFinite(x) && Number.isFinite(y) && ((x - 325) / 103) ** 2 + ((y - 224) / 36) ** 2 <= 1;
}

const bowlSlots = [
  [325,224],[282,219],[368,219],[303,202],[347,202],[303,244],[347,244],
  [251,225],[399,225],[276,238],[374,238],[325,207],[325,242]
].map(([x,y]) => ({ x,y }));

export function toppingPosition(placed, requested) {
  const clear = point => placed.every(item => Math.hypot((item.x - point.x) / 30, (item.y - point.y) / 18) >= 1);
  const safe = point => Math.hypot((point.x - 325) / 84, (point.y - 224) / 26) <= 1 && clear(point);
  if (safe(requested)) return requested;
  return bowlSlots.filter(safe).sort((a,b) => Math.hypot(a.x-requested.x,a.y-requested.y) -
    Math.hypot(b.x-requested.x,b.y-requested.y))[0];
}

export function arrangeToppings(placements) {
  const arranged = [];
  for (const item of placements) {
    const point = toppingPosition(arranged, item);
    arranged.push(point ? { ...item, ...point } : item);
  }
  return arranged;
}

export function cook(dish, action, value) {
  switch (action) {
    case 'pour-broth':
      if (['choose','pour'].includes(dish.stage) && Object.hasOwn(broths, value))
        return { ...dish, broth: value, stage: 'heat' };
      break;
    case 'choose':
      if (['choose', 'pour'].includes(dish.stage) && Object.hasOwn(broths, value) && value !== dish.broth)
        return { ...dish, broth: value, stage: 'pour' };
      break;
    case 'pour':
      if (dish.stage === 'pour') return { ...dish, stage: 'heat' };
      break;
    case 'heat':
      if (dish.stage === 'heat') return { ...dish, stage: 'noodles' };
      break;
    case 'noodles':
      if (dish.stage === 'noodles') return { ...dish, stage: 'stir' };
      break;
    case 'stir':
      if (dish.stage === 'stir') {
        const stir = Math.min(stirSteps, dish.stir + 1);
        return { ...dish, stir, stage: stir === stirSteps ? 'transfer' : 'stir' };
      }
      break;
    case 'transfer':
      if (dish.stage === 'transfer') return { ...dish, stage: 'toppings' };
      break;
    case 'place': {
      if (!value || !Object.hasOwn(ingredients, value.id) || !inBowl(value) || dish.placements.length >= 24) break;
      const { garnish } = ingredients[value.id];
      if (dish.stage !== 'toppings' || (garnish && !dish.placements.some(item => !ingredients[item.id].garnish))) break;
      const placed = arrangeToppings(dish.placements);
      if (!garnish && !placed.some(item => ingredients[item.id].garnish) &&
          placed.every(item => Math.hypot((item.x-325)/30, (item.y-224)/18) >= 1)) {
        placed.push({ x:325, y:224 });
      }
      const position = toppingPosition(placed, value);
      if (!position) break;
      const { x, y } = position;
      return { ...dish, placements: [...dish.placements, { id: value.id, x, y }] };
    }
    case 'serve':
      if (dish.stage === 'toppings' && dish.placements.some(item => ingredients[item.id].garnish))
        return { ...dish, stage: 'served' };
      break;
  }
  return dish;
}

const localCookingKey = 'dayquest_file_kitchens_v1';

export function localKitchenRecords() {
  return JSON.parse(localStorage.getItem(localCookingKey)) ?? {};
}

export function saveLocalKitchenRecords(records) {
  localStorage.setItem(localCookingKey, JSON.stringify(records));
}

export async function openCookingStore() {
  try {
    return await openCookingDatabase();
  } catch (error) {
    if (location.protocol !== 'file:') throw error;
    localKitchenRecords();
    return { local: true };
  }
}

function openCookingDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DayQuestCooking', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('ramen');
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cooking storage is open in another window.'));
    request.onsuccess = () => resolve(request.result);
  });
}

// Dish, undo history and scrapbook changes commit together.
export async function cookingRecord(db, update, key = 'kitchen', createDish = freshDish) {
  const empty = () => ({ dish: createDish(), history: [], recipes: [], name: '' });
  if (db.local) {
    const records = localKitchenRecords();
    const current = records[key] ?? empty();
    if (!update) return current;
    const next = update(current);
    saveLocalKitchenRecords({ ...records, [key]: next });
    return next;
  }
  return new Promise((resolve, reject) => {
    let updateError;
    const transaction = db.transaction('ramen', update ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('ramen');
    const request = store.get(key);
    let record;
    request.onsuccess = () => {
      record = request.result ?? empty();
      if (update) {
        try {
          record = update(record);
          store.put(record, key);
        } catch (error) {
          updateError = error;
          transaction.abort();
        }
      }
    };
    transaction.oncomplete = () => resolve(record);
    transaction.onabort = () => reject(updateError ?? transaction.error ?? new Error('Cooking save interrupted.'));
  });
}
