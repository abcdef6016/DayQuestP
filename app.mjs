import './cottage-notifications.mjs';
import { bindCookingButtons } from './cooking-input.mjs';
import { baristaPoints } from './barista.mjs';
import * as exchange from './coin-exchange.mjs';
import './notebook.mjs';
import { downloadCrystal, importCrystal } from './integration.mjs';

for (const id of ['desktop-nav','dayquest-mobile-nav','mobile-more'])
  bindCookingButtons(document.getElementById(id), {});

window.dayQuestRelease = { downloadCrystal, importCrystal, exchange };
exchange.mountExchange(window.dayQuestHome, baristaPoints);
