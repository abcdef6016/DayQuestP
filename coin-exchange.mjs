import { localDay } from './cottage-daily.mjs';

export const pointsPerExchange = 50;
export const coinsPerExchange = 10;
export const dailyExchangeLimit = 2;
export const exchangeSources = ['village', 'barista'];

export function mergeExchange(a, b) {
  const day = [a?.day ?? '', b?.day ?? ''].sort().at(-1);
  return {
    village: Math.max(a?.village ?? 0, b?.village ?? 0),
    barista: Math.max(a?.barista ?? 0, b?.barista ?? 0),
    day,
    count: Math.max(a?.day === day ? a.count : 0, b?.day === day ? b.count : 0)
  };
}

export function availablePoints(earned, ledger, source) {
  return Math.max(0, earned - (ledger?.[source] ?? 0));
}

export function exchangesLeft(ledger, day) {
  if (ledger?.day > day) return 0;
  return dailyExchangeLimit - (ledger?.day === day ? ledger.count : 0);
}

export function tradePoints(ledger, source, earned, day = localDay(new Date())) {
  if (!exchangeSources.includes(source) || !Number.isSafeInteger(earned) ||
      availablePoints(earned, ledger, source) < pointsPerExchange || exchangesLeft(ledger, day) <= 0) return null;
  const next = mergeExchange(ledger);
  next[source] += pointsPerExchange;
  next.count = dailyExchangeLimit - exchangesLeft(ledger, day) + 1;
  next.day = day;
  return next;
}

export function mountExchange(home, baristaPoints) {
  const root = document.getElementById('cooking-exchange');
  const buttons = [...root.querySelectorAll('[data-exchange]')];
  const status = root.querySelector('[role=status]');
  let busy = false;
  function render() {
    const ledger = home.exchangeLedger();
    const left = exchangesLeft(ledger, localDay(new Date()));
    root.querySelector('[data-exchange-left]').textContent = left + ' of ' + dailyExchangeLimit + ' exchanges available today';
    for (const button of buttons) {
      const source = button.dataset.exchange;
      const total = source === 'village' ? home.villagePoints() : baristaPoints();
      const balance = Number.isSafeInteger(total) ? availablePoints(total, ledger, source) : null;
      button.querySelector('span').textContent = balance === null ? 'Unavailable' : balance + ' points available';
      button.disabled = busy || !left || balance === null || balance < pointsPerExchange;
    }
  }
  root.querySelector('[data-exchange-rate]').textContent = pointsPerExchange + ' points for ' + coinsPerExchange + ' coins per exchange. The daily limit is shared by both kitchens.';
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-exchange]');
    if (!button || button.disabled || busy) return;
    busy = true;
    render();
    try {
      const source = button.dataset.exchange;
      const earned = source === 'village' ? home.villagePoints() : baristaPoints();
      const result = await home.exchangePoints(source, earned);
      status.textContent = result === 'saved' ? 'Added ' + coinsPerExchange + ' coins to your vault.'
        : result === 'unavailable' ? 'This exchange is no longer available.' : 'The exchange could not be saved.';
    } catch {
      status.textContent = 'The exchange could not be saved.';
    } finally {
      busy = false;
      render();
    }
  });
  home.ready.then(render);
  for (const event of ['dayquest:state','dayquest:barista-points','dayquest:navigation']) document.addEventListener(event, render);
  window.addEventListener('focus', render);
  setInterval(() => { if (!root.closest('.hidden')) render(); }, 30000);
}
