import { drinks } from './barista-recipes.mjs';

export const customers = {
  rowan: { name: 'Rowan', coat: '#e2a07b', ears: 'fox' },
  juniper: { name: 'Juniper', coat: '#f5deb8', ears: 'rabbit' },
  mallow: { name: 'Mallow', coat: '#d7a2c6', ears: 'cat' }
};
export const freshOrders = () => ({ points: 0, served: 0, order: null, seconds: 60 });
const orderDrinks = drinks.filter(drink => drink.ingredients.length >= 3 && drink.ingredients.length <= 6);

export function newOrder(seconds, now = Date.now(), random = Math.random) {
  const ids = Object.keys(customers);
  const recipe = orderDrinks[Math.floor(random() * orderDrinks.length)];
  return { recipeId: recipe.id, customer: ids[Math.floor(random() * ids.length)],
    deadline: now + seconds * 1000, result: null, earned: 0 };
}

export function scoreOrder(game, recipeId, now = Date.now()) {
  const { order } = game;
  if (!order || order.result || order.recipeId !== recipeId || game.rush?.ended) return game;
  if (game.rush && now >= order.deadline) return game;
  const remaining = Math.ceil((order.deadline - now) / 1000);
  const earned = remaining > 0 ? 50 + remaining : 0;
  return {
    ...game, points: game.points + earned, served: game.served + Number(earned > 0),
    ...(game.rush ? { rush: { ...game.rush, served: game.rush.served + Number(earned > 0), points: game.rush.points + earned } } : {}),
    order: { ...order, result: earned ? 'served' : 'expired', earned, nextAt: now + 650 }
  };
}

export const rushSeconds = 60;
export const customerSeconds = 20;
const rushDrinks = orderDrinks.filter(drink => drink.ingredients.length <= 4);

function rushOrder(rush, now, previous, random) {
  const easy = rushDrinks.filter(drink => drink.ingredients.length === 3);
  const pool = rush.duration === 30 && easy.length > 1 ? easy : rushDrinks;
  const choices = pool.filter(drink => drink.id !== previous?.recipeId);
  const recipe = choices[Math.floor(random() * choices.length)];
  const ids = Object.keys(customers);
  return { recipeId: recipe.id, customer: ids[(rush.number - 1) % ids.length],
    deadline: Math.min(now + customerSeconds * 1000, rush.deadline), result: null, earned: 0 };
}

export function startRush(game, now = Date.now(), random = Math.random, duration = rushSeconds) {
  const rush = { duration, deadline: now + duration * 1000, number: 1, served: 0, missed: 0, points: 0, ended: false };
  return { ...game, rush, order: rushOrder(rush, now, null, random), seconds: duration };
}

export function advanceRush(game, now = Date.now(), random = Math.random) {
  const { rush, order } = game;
  if (!rush || rush.ended) return game;
  const sessionEnded = now >= rush.deadline;
  const missed = !order.result && now >= order.deadline;
  if (!sessionEnded && !missed && (!order.result || now < order.nextAt)) return game;
  const updated = { ...rush, missed: rush.missed + Number(missed) };
  if (sessionEnded) {
    return { ...game, rush: { ...updated, ended: true },
      order: order.result ? order : { ...order, result: 'expired' } };
  }
  updated.number++;
  return { ...game, rush: updated, order: rushOrder(updated, now, order, random) };
}

export function stopRush(game) {
  if (!game.rush || game.rush.ended) return game;
  const order = game.order?.result ? game.order : { ...game.order, result: 'expired' };
  return { ...game, rush: { ...game.rush, ended: true }, order };
}

export function validOrders(game) {
  if (!game || (game.seconds !== undefined && ![30,60,90].includes(game.seconds)) || !Number.isSafeInteger(game.points) || game.points < 0 ||
      !Number.isSafeInteger(game.served) || game.served < 0) return false;
  const order = game.order;
  const rush = game.rush;
  if (rush && (!order || (rush.duration !== undefined && ![30,60].includes(rush.duration)) || ![rush.deadline,rush.number,rush.served,rush.missed,rush.points].every(value =>
    Number.isSafeInteger(value) && value >= 0) || rush.number < 1 || typeof rush.ended !== 'boolean' ||
    order.deadline > rush.deadline || (order.result === 'served' && !Number.isSafeInteger(order.nextAt)))) return false;
  return order === null || Boolean(order && orderDrinks.some(drink => drink.id === order.recipeId) &&
    Object.hasOwn(customers, order.customer) && Number.isSafeInteger(order.deadline) && order.deadline > 0 &&
    [null,'served','expired'].includes(order.result) && Number.isSafeInteger(order.earned) &&
    order.earned >= 0 && order.earned <= 140 && (order.result === 'served') === (order.earned > 0));
}
