import { allowVisits, cottageSnapshot, restoreCottage } from './cottage.mjs';
import { companions } from './cottage-daily.mjs';
import { openFoodShop } from './village.mjs';
import { createCrystal, readCrystal, readKitchens, restoreKitchens, kitchens } from './save-crystal.mjs';

const dayquest = window.dayQuestHome;
const status = document.querySelector('#save-crystal-status');
const exportButton = document.querySelector('#save-crystal-download');
const importField = document.querySelector('#save-crystal-file');
const sound = document.querySelector('#setting-sound');
const visits = document.querySelector('#setting-visits');
const stamps = document.querySelector('#collection-stamps');
const summary = document.querySelector('#collection-summary');
let busy = false;
let collectionGeneration = 0;
let earned = new Set();
const shopCount = Object.keys(kitchens).length - 1;

function syncSettings() {
  sound.checked = dayquest.soundEnabled();
  visits.checked = cottageSnapshot().visits;
}
sound.addEventListener('change', () => dayquest.setSound(sound.checked));
visits.addEventListener('change', () => allowVisits(visits.checked));
document.addEventListener('dayquest:state', syncSettings);
document.addEventListener('dayquest:cottage', syncSettings);

function drawStamps() {
  const seen = cottageSnapshot().seen.length;
  const groups = [
    ['Ramen stamp', earned.has('kitchen')],
    ['Pizza stamp', earned.has('pizza')],
    ['Ice cream stamp', earned.has('ice')],
    ['Curry stamp', earned.has('curry')],
    ['Food Village tour', ['kitchen','pizza','ice'].every(key => earned.has(key))],
    ['Companion circle', seen === Object.keys(companions).length]
  ];
  stamps.replaceChildren();
  for (const [name, unlocked] of groups) {
    const item = document.createElement('li');
    item.classList.toggle('stamp-earned', unlocked);
    item.textContent = name;
    const label = document.createElement('span');
    label.textContent = unlocked ? 'Earned' : 'To collect';
    item.append(label);
    stamps.append(item);
  }
  summary.textContent = 'Shops collected ' + earned.size + ' / ' + shopCount + ' · Companions met ' + seen + ' / ' + Object.keys(companions).length;
}

async function refreshStamps() {
  const generation = ++collectionGeneration;
  try {
    const kitchens = await readKitchens();
    if (generation !== collectionGeneration) return;
    earned = new Set(Object.keys(kitchens).filter(key => key !== 'barista' && kitchens[key].recipes.length));
    drawStamps();
  } catch {
    if (generation === collectionGeneration) summary.textContent = 'Cooking stamps are unavailable while site storage is disabled.';
  }
}

document.querySelector('#collection-scrapbook').addEventListener('click', () => {
  dayquest.navigate('ramen');
  openFoodShop('scrapbook');
});
document.querySelector('#collection-cottage').addEventListener('click', () => dayquest.navigate('home'));
document.addEventListener('dayquest:kitchens', refreshStamps);
document.addEventListener('dayquest:recipe-saved', refreshStamps);
document.addEventListener('dayquest:cottage', drawStamps);

function lockControls(value) {
  busy = value;
  exportButton.disabled = value;
  importField.disabled = value;
}

export async function downloadCrystal() {
  if (busy) return;
  lockControls(true);
  status.textContent = 'Preparing your Save Crystal…';
  try {
    await dayquest.ready;
    const kitchens = await readKitchens().catch(() => null);
    const backup = createCrystal(dayquest.productivitySnapshot(), kitchens, cottageSnapshot());
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dayquest_save_crystal.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = kitchens ? 'Save Crystal downloaded.'
      : 'Productivity backup downloaded. Kitchen storage was unavailable.';
  } catch {
    status.textContent = 'Could not create a Save Crystal. Check that site storage is available.';
  } finally {
    lockControls(false);
  }
}

export async function importCrystal(input) {
  const file = input.files[0];
  input.value = '';
  if (!file || busy) return;
  lockControls(true);
  status.textContent = 'Checking your Save Crystal…';
  try {
    const backup = readCrystal(JSON.parse(await file.text()));
    const message = backup.cooking
      ? 'Restore productivity progress and settings from this Save Crystal? Notes, recipes, and companion discoveries will merge. Kitchen work already underway will stay on this device.'
      : 'Restore the productivity data in this older Save Crystal? Saved notes will merge and your kitchens will stay as they are.';
    if (!window.confirm(message)) {
      status.textContent = 'Restore canceled.';
      return;
    }
    if (!(await dayquest.restoreProductivity(backup.productivity))) {
      status.textContent = 'Could not save the restored productivity data. Try again.';
      return;
    }

    let kept = 0;
    if (backup.cooking) {
      try {
        kept = await restoreKitchens(backup.cooking);
      } catch {
        status.textContent = 'Productivity data restored. The kitchens and Cottage could not be restored. Try the same file again.';
        return;
      }
      document.dispatchEvent(new Event('dayquest:kitchens'));
      if (!restoreCottage(backup.cottage)) {
        status.textContent = 'Productivity data and kitchens restored. Cottage settings could only be restored for this session.';
        return;
      }
    }
    status.textContent = kept
      ? 'Save Crystal restored. ' + kept + (kept === 1 ? ' local kitchen draft was kept.' : ' local kitchen drafts were kept.')
      : 'Save Crystal restored.';
  } catch (error) {
    status.textContent = error instanceof SyntaxError ? 'This file is not valid JSON.' : error.message;
  } finally {
    lockControls(false);
  }
}

dayquest.ready.then(() => {
  syncSettings();
  drawStamps();
  refreshStamps();
});
