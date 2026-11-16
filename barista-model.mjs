import { drinks } from './barista-recipes.mjs';

export const drinkById = Object.fromEntries(drinks.map(drink => [drink.id, drink]));
export const freshBarista = () => ({ recipeId: null, added: [], turns: 0, served: false });
export const mixTurns = 3;
export const mixLabels = { stir: 'Stir', shake: 'Shake', blend: 'Blend', muddle: 'Muddle' };

function prepIngredients(recipe) {
  return recipe.method === 'muddle'
    ? recipe.ingredients.filter(item => !['Ice', 'Sparkling water'].includes(item))
    : recipe.ingredients;
}

export function drinkPhase(dish) {
  if (!dish.recipeId) return 'menu';
  if (dish.served) return 'served';
  const recipe = drinkById[dish.recipeId];
  if (recipe.category === 'mud') return dish.added.length === recipe.ingredients.length ? 'serve' : 'add';
  if (!prepIngredients(recipe).every(item => dish.added.includes(item))) return 'add';
  if (dish.turns < mixTurns) return 'mix';
  return dish.added.length === recipe.ingredients.length ? 'serve' : 'add';
}

export function availableIngredients(dish) {
  if (drinkPhase(dish) !== 'add') return [];
  const recipe = drinkById[dish.recipeId];
  const missing = (dish.turns ? recipe.ingredients : prepIngredients(recipe)).filter(item => !dish.added.includes(item));
  return recipe.category === 'mud' ? missing.slice(0, 1) : missing;
}

export function baristaAction(dish, action, value) {
  if (action === 'choose' && Object.hasOwn(drinkById, value)) return { ...freshBarista(), recipeId: value };
  const phase = drinkPhase(dish);
  if (action === 'add' && phase === 'add' && availableIngredients(dish).includes(value))
    return { ...dish, added: [...dish.added, value] };
  if (action === 'mix' && phase === 'mix') return { ...dish, turns: dish.turns + 1 };
  if (action === 'serve' && phase === 'serve') return { ...dish, served: true };
  return dish;
}

export function validBaristaDish(dish) {
  if (!dish || !Array.isArray(dish.added) || !Number.isInteger(dish.turns) || dish.turns < 0 ||
      dish.turns > mixTurns || typeof dish.served !== 'boolean') return false;
  if (dish.recipeId === null) return dish.added.length === 0 && !dish.turns && !dish.served;
  if (!Object.hasOwn(drinkById, dish.recipeId)) return false;
  const recipe = drinkById[dish.recipeId];
  if (new Set(dish.added).size !== dish.added.length || !dish.added.every(item => recipe.ingredients.includes(item)))
    return false;
  if (recipe.category === 'mud' && (dish.turns || !dish.added.every((item,i) => item === recipe.ingredients[i]))) return false;
  if (recipe.method === 'muddle' && dish.turns < mixTurns && !dish.added.every(item => prepIngredients(recipe).includes(item))) return false;
  if (recipe.category !== 'mud' && dish.turns && !prepIngredients(recipe).every(item => dish.added.includes(item))) return false;
  return !dish.served || drinkPhase({ ...dish, served: false }) === 'serve';
}
