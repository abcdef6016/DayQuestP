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
  if (!order || order.result || order.recipeId !== recipeId) return game;
  const remaining = Math.ceil((order.deadline - now) / 1000);
  const earned = remaining > 0 ? 50 + remaining : 0;
  return {
    ...game, points: game.points + earned, served: game.served + Number(earned > 0),
    order: { ...order, result: earned ? 'served' : 'expired', earned }
  };
}

export function validOrders(game) {
  if (!game || (game.seconds !== undefined && ![30,60,90].includes(game.seconds)) || !Number.isSafeInteger(game.points) || game.points < 0 ||
      !Number.isSafeInteger(game.served) || game.served < 0) return false;
  const order = game.order;
  return order === null || Boolean(order && orderDrinks.some(drink => drink.id === order.recipeId) &&
    Object.hasOwn(customers, order.customer) && Number.isSafeInteger(order.deadline) && order.deadline > 0 &&
    [null,'served','expired'].includes(order.result) && Number.isSafeInteger(order.earned) &&
    order.earned >= 0 && order.earned <= 140 && (order.result === 'served') === (order.earned > 0));
}
