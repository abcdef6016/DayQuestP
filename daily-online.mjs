const books = {
  ramen: 'Tonkotsu Ramen',
  pizza: 'Tomato Pizza',
  ice: 'Vanilla Ice Cream (Egg-Free)',
  curry: 'Chickpea Curry (Masaledaar Chole)'
};
const host = 'https://en.wikibooks.org';
const key = 'dayquest_online_recipe_v1';
let request;

function renderPreview(link, preview, { title, ingredients }) {
  link.textContent = title + ' · Wikibooks Cookbook';
  if (!ingredients?.length) return;
  const license = document.createElement('a');
  license.href = 'https://creativecommons.org/licenses/by-sa/4.0/';
  license.textContent = 'CC BY-SA 4.0';
  preview.replaceChildren('Ingredient preview: ' + ingredients.join(' · ') + ' (', license, ')');
}

export function showOnlineRecipe(container, day, kind) {
  const identity = day + '/' + kind;
  if (container.dataset.recipe === identity) return;
  request?.abort();
  container.dataset.recipe = identity;
  const title = 'Cookbook:' + books[kind];
  const link = document.createElement('a');
  link.href = host + '/wiki/' + encodeURIComponent(title.replaceAll(' ', '_'));
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const preview = document.createElement('small');
  container.replaceChildren(link, preview);
  renderPreview(link, preview, { title: books[kind] });
  let cached;
  try { cached = JSON.parse(localStorage.getItem(key)); } catch {}
  if (cached?.identity === identity && typeof cached.title === 'string' && Array.isArray(cached.ingredients)) {
    renderPreview(link, preview, cached);
    return;
  }

  const controller = new AbortController();
  request = controller;
  const timeout = setTimeout(() => controller.abort(), 5000);
  const query = new URLSearchParams({ action: 'parse', format: 'json', formatversion: '2',
    redirects: '1', origin: '*', prop: 'text', page: title });
  fetch(host + '/w/api.php?' + query, { signal: controller.signal, credentials: 'omit' }).then(async response => {
    if (!response.ok) return;
    const recipe = (await response.json()).parse;
    if (typeof recipe?.text !== 'string' || typeof recipe.title !== 'string' || controller.signal.aborted) return;
    const content = document.createElement('template');
    content.innerHTML = recipe.text;
    const heading = content.content.querySelector('[id="Ingredients"]');
    let section = heading?.closest('.mw-heading')?.nextElementSibling ?? heading?.nextElementSibling;
    while (section && !section.matches('ul, ol, table, .mw-heading, h2, h3')) section = section.nextElementSibling;
    if (!section?.matches('ul, ol, table')) section = null;
    const ingredients = Array.from(section?.querySelectorAll('li, td:first-child') ?? [])
      .slice(0, 3).map(item => item.textContent.trim().replace(/\s+/g, ' ').slice(0, 75)).filter(Boolean);
    const record = { identity, title: recipe.title.replace(/^Cookbook:/, ''), ingredients };
    renderPreview(link, preview, record);
    try { localStorage.setItem(key, JSON.stringify(record)); } catch {}
  }).catch(() => {}).finally(() => clearTimeout(timeout));
}
