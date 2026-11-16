const bowl = '<path d="M22 42h76q-8 25-38 25T22 42Z" fill="#b5477e"/><ellipse cx="60" cy="42" rx="38" ry="13" fill="#ffcba9" stroke="#f7a7d7" stroke-width="3"/><path d="M41 42q8-10 17 0t18 0m-31 5q8-10 17 0t18 0" stroke="#a95f91" fill="none" stroke-width="2"/><path d="M47 27q-7-8 0-14m14 10q-7-8 0-14m14 18q-7-8 0-14" stroke="#ffe1f3" stroke-width="2" fill="none" stroke-linecap="round"/>';
const pizza = '<ellipse cx="61" cy="50" rx="42" ry="23" fill="#a15b88"/><ellipse cx="61" cy="45" rx="40" ry="20" fill="#ffc890"/><ellipse cx="61" cy="46" rx="33" ry="16" fill="#e58c89"/><g fill="#b84a82"><circle cx="49" cy="43" r="5"/><circle cx="76" cy="48" r="5"/><circle cx="62" cy="53" r="4"/></g><path d="M69 37q6-9 11-7-2 10-11 7m-35 9q5-8 9-4-1 7-9 4" fill="#a6d7b5"/>';
const ice = '<path d="M41 39h38l-16 34q-3 6-6 0Z" fill="#efaf88" stroke="#af6887" stroke-width="2"/><path d="m46 47 18 20m8-20-17 19m-4-27 17 20m-2-19-13 15" stroke="#b7748f" fill="none"/><path d="M39 40q-6-7 1-13-1-17 19-17 20 0 20 17 8 7 2 13-6 5-12 0-7 7-14 0-8 6-16 0Z" fill="#f4a6d0" stroke="#c778ae" stroke-width="2"/><path d="M50 24q5-6 11-6m5 1 5 3" stroke="#fff0fa" fill="none" stroke-width="3" stroke-linecap="round"/>';
const curry = '<path d="M18 49h84q-12 25-42 25T18 49Z" fill="#a55481"/><ellipse cx="60" cy="43" rx="42" ry="22" fill="#f5d1db"/><path d="M25 46q-2-15 17-16q22-1 23 17q-16 13-40-1" fill="#fff1da"/><ellipse cx="74" cy="44" rx="22" ry="15" fill="#d49958"/><path d="m70 33 6 4 5-6-1 8-9 2Z" fill="#93a877"/>';
export const kitchenIcons = { ramen: bowl, pizza, ice, curry };

function stall(x, y, roof) {
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="65" cy="122" rx="77" ry="12" fill="#170e31" opacity=".5"/>
    <path d="M10 39h110v80H10Z" fill="#b27cab" stroke="#6c4b8c" stroke-width="3"/>
    <path d="M8 46-6 43l21-30h98l22 30-13 3Z" fill="${roof}" stroke="#c58ec1" stroke-width="2"/>
    <path d="M18 17 5 43m34-27-9 29m27-29-3 28m22-28 4 28m16-29 9 30m4-29 16 26" stroke="#ffe1f3" stroke-opacity=".33" stroke-width="2"/>
    <rect x="22" y="52" width="86" height="48" rx="8" fill="#5c356d" stroke="#e2acd1" stroke-width="2"/>
    <path d="M10 101h111v9H10Z" fill="#e1a0ba"/>
    <path d="M25 59h80m-80 8h80m-80 8h80m-80 8h80m-80 8h80" stroke="#885d98" stroke-width="2"/>
    <path class="market-lantern" d="M15 48v12m100-12v12" fill="none" stroke="#ffdab9" stroke-width="3"/>
    <circle class="market-lantern" cx="15" cy="65" r="5" fill="#ffcf9b"/><circle class="market-lantern" cx="115" cy="65" r="5" fill="#ffcf9b"/>
  </g>`;
}

const panorama = `<svg viewBox="0 0 610 310" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="market-sky" x2="0" y2="1"><stop stop-color="var(--sky-top)"/><stop offset="1" stop-color="var(--sky-bottom)"/></linearGradient>
    <radialGradient id="market-halo"><stop stop-color="#ffd7fb" stop-opacity=".6"/><stop offset="1" stop-color="#ffd7fb" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="610" height="310" fill="url(#market-sky)"/>
  <circle cx="437" cy="84" r="84" fill="url(#market-halo)"/>
  <path d="M464 116a43 43 0 1 1-36-70 37 37 0 0 0 36 70Z" fill="#ffe3f4"/>
  <g fill="#ffe9fc" class="market-stars"><circle cx="84" cy="52" r="2"/><circle cx="128" cy="89" r="3"/><circle cx="206" cy="32" r="2"/><circle cx="276" cy="69" r="3"/><circle cx="322" cy="40" r="2"/><circle cx="523" cy="42" r="3"/><circle cx="573" cy="92" r="2"/><path d="M361 58l2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm155 55 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
  <path d="M0 163 106 91l100 66 130-68 115 64 95-62 64 51v168H0Z" fill="var(--hill-back)"/>
  <path d="M0 195q110-74 214-13t178-9 218 10v127H0Z" fill="var(--hill-front)"/>
  <path d="M0 260q155-71 305-36t305 13v73H0Z" fill="var(--meadow)"/>
  <path d="M124 309q123-95 209-83 80 11 161 83z" fill="#cb80b5" opacity=".28"/>
  <path d="M31 225q28-83 5-148m10 81 53-49m-55 28L5 106m574 123q-28-89 2-154m-14 72-52-32" fill="none" stroke="#76446e" stroke-width="8" stroke-linecap="round"/>
  <g fill="#d87cb8" stroke="#efacda" stroke-width="2" opacity=".88"><circle cx="28" cy="75" r="34"/><circle cx="76" cy="76" r="31"/><circle cx="61" cy="108" r="26"/><circle cx="578" cy="71" r="34"/><circle cx="548" cy="92" r="27"/><circle cx="605" cy="105" r="27"/></g>
  ${stall(82,133,'#bd518d')}${stall(240,116,'#8461bb')}${stall(398,134,'#d482af')}
  <g class="market-stars" fill="#ffd4f5"><circle cx="67" cy="269" r="3"/><circle cx="216" cy="277" r="3"/><circle cx="374" cy="264" r="2.5"/><circle cx="554" cy="267" r="3"/><path d="M270 278l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g>
</svg>`;

export const marketMarkup = `
  <div class="market-hero">
    <div class="market-intro">
      <h2>Food Village</h2>
      <p id="daily-menu-teaser">One kitchen opens each day. Unseal the menu to see what’s cooking.</p>
      <button type="button" id="daily-menu-reveal">Reveal today’s recipe</button>
    </div>
    <div class="market-panorama">${panorama}</div>
  </div>
  <div id="daily-menu-card" hidden></div>`;
