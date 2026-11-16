import { broths, ingredients, stirSteps, arrangeToppings } from './cooking.mjs';

const strands = '<path d="M-49-8q12-15 24 0t24 0t24 0t24 0M-56 2q12-15 24 0t24 0t24 0t24 0t24 0M-43 12q12-15 24 0t24 0t24 0t24 0" fill="none" stroke="#ffe19a" stroke-width="4" stroke-linecap="round"/>';
const steam = '<path d="M-24 0q-10-11 0-22t0-20M0-4q-10-11 0-22t0-20M26 0q-10-11 0-22t0-20" fill="none" stroke="#fff8e6" stroke-width="4" stroke-linecap="round"/>';
const placement = ({ id, x, y }) => '<g transform="translate(' + x + ' ' + y + ')">' + ingredients[id].art + '</g>';

export function bowlArt(dish, clip = "ramen-rim") {
  return '<ellipse cx="325" cy="264" rx="106" ry="14" fill="#6a4132" opacity=".2"/>' +
    '<path d="M218 223h214q-13 45-73 50h-68q-60-5-73-50" fill="#d57777"/>' +
    '<path d="M238 251q86 31 175-1" fill="none" stroke="#fff0d9" stroke-width="4"/>' +
    '<ellipse cx="325" cy="224" rx="109" ry="41" fill="#fff1d8" stroke="#a45356" stroke-width="3"/>' +
    (dish.stage === 'toppings' || dish.stage === 'served'
      ? '<ellipse cx="325" cy="224" rx="102" ry="35" fill="' + broths[dish.broth].color + '"/>' +
        '<g transform="translate(325 223) scale(1.4 1.1)">' + strands + '</g>' +
        '<g clip-path="url(#' + clip + ')">' + arrangeToppings(dish.placements).map(placement).join('') + '</g>'
      : '<ellipse cx="325" cy="224" rx="92" ry="29" fill="#fae0c6"/>');
}

export const rim = (id = 'ramen-rim') => '<clipPath id="' + id + '"><ellipse cx="325" cy="224" rx="102" ry="35"/></clipPath>';

export const kitchenArt = `
  <defs>
    ${rim()}
    <linearGradient id="ramen-sky" x2="0" y2="1"><stop stop-color="#fff3dd"/><stop offset="1" stop-color="#f4c8bc"/></linearGradient>
    <linearGradient id="ramen-woods" x2="0" y2="1"><stop stop-color="#dae8b9"/><stop offset="1" stop-color="#99bb9e"/></linearGradient>
  </defs>
  <rect width="480" height="300" fill="url(#ramen-sky)"/>
  <rect x="20" y="19" width="440" height="163" rx="20" fill="url(#ramen-woods)" stroke="#925c51" stroke-width="7"/>
  <circle cx="310" cy="65" r="26" fill="#fff4cc"/>
  <path d="M24 151Q89 82 169 138T308 129T456 122V178H24Z" fill="var(--studio-tree, #a0bd94)"/>
  <path d="M24 166q65-46 123-17t116-4t193 1v32H24z" fill="var(--studio-hills, #759583)"/>
  <path d="M23 65q41 2 100-32m-62 23L48 32m32 16 23 7m356-13q-71 15-111-10" fill="none" stroke="#8b6253" stroke-width="5"/>
  <g fill="#f7a5ae" stroke="#ffdcce" stroke-width="3">
    <circle cx="48" cy="32" r="13"/><circle cx="68" cy="37" r="11"/><circle cx="98" cy="34" r="14"/>
    <circle cx="115" cy="44" r="10"/><circle cx="367" cy="37" r="13"/><circle cx="397" cy="41" r="11"/><circle cx="432" cy="34" r="15"/>
  </g>
  <path d="M238 21v154M22 111h435" stroke="#925c51" stroke-width="5" opacity=".6"/>
  <path d="M43 0v41m394-41v41" stroke="#744a44" stroke-width="3"/>
  <g fill="#f9b28e" stroke="#a65959" stroke-width="3">
    <rect x="27" y="41" width="32" height="45" rx="12"/><rect x="421" y="41" width="32" height="45" rx="12"/>
  </g>
  <path d="M32 53h22m-22 19h22m372-19h22m-22 19h22" stroke="#ffe6bd" stroke-width="3"/>
  <path d="M0 173h480v127H0z" fill="var(--studio-counter, #d89a76)"/>
  <path d="M0 178h480M0 285h480" stroke="#a66756" stroke-width="5"/>
  <path d="M0 192h480M0 275h480m-480 17h480" stroke="#f5c3a1" opacity=".85"/>
  <g id="ramen-customer" transform="translate(370 136)">
    <g class="ramen-bunny">
      <path d="M-33 45q4-23 33-23t33 23" fill="#799385" stroke="#77514b" stroke-width="3"/>
      <path d="M-19-10q-22-44-9-52q13-7 24 44m15 0q6-49 20-44q15 6-3 53" fill="#fff0d9" stroke="#77514b" stroke-width="3"/>
      <ellipse cx="-22" cy="-42" rx="4" ry="13" transform="rotate(-16 -22 -42)" fill="#f2a4a6"/>
      <ellipse cx="24" cy="-42" rx="4" ry="13" transform="rotate(13 24 -42)" fill="#f2a4a6"/>
      <ellipse cy="5" rx="40" ry="32" fill="#fff0d9" stroke="#77514b" stroke-width="3"/>
      <g fill="#704b48"><circle cx="-14" cy="3" r="3"/><circle cx="14" cy="3" r="3"/></g>
      <g fill="#f2a4a6"><ellipse cx="-23" cy="12" rx="7" ry="4"/><ellipse cx="23" cy="12" rx="7" ry="4"/></g>
      <path d="M-5 12q5 9 10 0" fill="none" stroke="#704b48" stroke-width="2.5" stroke-linecap="round"/>
      <path class="ramen-heart" d="M46-15q-12-9-6-14q4-3 8 2q5-5 9-1q4 6-11 13" fill="#ce5e72"/>
    </g>
  </g>
  <g id="ramen-pot"></g><g id="ramen-bowl"></g><g id="ramen-effect"></g>
`;

export function potArt(dish) {
  const poured = !['choose', 'pour'].includes(dish.stage);
  const heated = ['noodles', 'stir', 'transfer'].includes(dish.stage);
  const pitcher = dish.stage === 'pour'
    ? '<g transform="translate(53 122)">' + props.pour.replace('#e4a366', broths[dish.broth].color) + '</g>' : '';
  return pitcher + '<rect x="36" y="230" width="166" height="38" rx="12" fill="#51434b"/>' +
    '<circle cx="183" cy="250" r="7" fill="' + (heated ? '#ffb965' : '#aa7880') + '"/>' +
    (heated ? '<path class="ramen-flame" d="M75 246q-12-11 5-25q-2 13 10 15q9-19 19-26q-4 13 7 19q11-8 15-18q14 13 7 23q15-1 18-10q12 17-13 22z" fill="#ffae62"/>' : '') +
    '<path d="M55 166H34q-16 0-7 17l24 10m135-28h20q16 0 7 17l-22 10" fill="none" stroke="#59424a" stroke-width="8"/>' +
    '<path d="M43 167h153l-11 55q-4 20-66 20t-66-20Z" fill="#758d88" stroke="#4d5a57" stroke-width="3"/>' +
    '<path d="M58 199q4 20 21 23" fill="none" stroke="#adc2aa" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="120" cy="166" rx="78" ry="30" fill="#3e5452" stroke="#a7b8a2" stroke-width="5"/>' +
    (poured && !['toppings','served'].includes(dish.stage)
      ? '<ellipse cx="120" cy="167" rx="69" ry="23" fill="' + broths[dish.broth].color + '"/>' : '') +
    (heated ? '<g class="ramen-bubbles" fill="none" stroke="#fff0bb" stroke-width="2"><circle cx="76" cy="165" r="5"/><circle cx="145" cy="157" r="7"/><circle cx="164" cy="177" r="4"/></g>' : '') +
    (['stir','transfer'].includes(dish.stage)
      ? '<g transform="translate(120 168) rotate(' + (dish.stir * 5 - 16) + ') scale(1 ' + (0.55 + dish.stir / stirSteps / 2) + ')">' + strands + '</g>' : '') +
    (heated ? '<g transform="translate(120 145)"><g class="ramen-steam">' + steam + '</g></g>' : '');
}

export const props = {
  pour: '<path d="M-15-13H9v26h-24z" fill="#e4a366" stroke="#80574f" stroke-width="2"/><path d="M9-8h6v12H9M-15-12l-7-4 7 12" fill="none" stroke="#80574f" stroke-width="2"/>',
  noodles: '<g transform="scale(.45)">' + strands + '</g>',
  transfer: '<path d="m-9 9 25-25" stroke="#87574a" stroke-width="5"/><ellipse cx="-8" cy="8" rx="15" ry="7" fill="#e5b882"/><g transform="translate(-8 7) scale(.22)">' + strands + '</g>',
  serve: '<path d="M-28 0h56q-5 17-28 17T-28 0" fill="#d57777"/><ellipse rx="28" ry="8" fill="#f6c67b"/><g transform="scale(.35)">' + strands + '</g>'
};
