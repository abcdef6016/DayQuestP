import { companions } from './cottage-daily.mjs';

export function companionArt(id) {
  const { coat, accent, scarf, kind } = companions[id];
  const ears = {
    'moss rabbit': '<path d="M-21-15Q-42-60-26-65Q-10-69-5-28M6-28Q11-70 27-65Q43-59 22-15"/><path d="M-23-25q-18-30-9-34q10-4 18 31m30 0q9-35 18-30q8 4-9 32" fill="' + accent + '" stroke="none"/>',
    'orchard cat': '<path d="M-35-5-42-42-8-24M35-5 42-42 8-24"/><path d="m-33-16-3-15 15 10m54 5 3-15-15 10" fill="' + accent + '" stroke="none"/>',
    'fern bear': '<circle cx="-29" cy="-24" r="15"/><circle cx="29" cy="-24" r="15"/><circle cx="-29" cy="-24" r="7" fill="' + accent + '" stroke="none"/><circle cx="29" cy="-24" r="7" fill="' + accent + '" stroke="none"/>',
    'garden frog': '<circle cx="-24" cy="-21" r="17"/><circle cx="24" cy="-21" r="17"/>'
  };
  return '<g fill="' + coat + '" stroke="#755750" stroke-width="2.5" stroke-linejoin="round">' +
    '<path d="M-35 39q3-22 35-22t35 22q-5 13-35 13t-35-13Z"/>' + ears[kind] +
    '<ellipse cy="1" rx="42" ry="29"/><path d="M-30 25q28 12 60 0l3 7q-31 16-65 0z" fill="' + scarf + '"/>' +
    '<path d="m15 34 13 0 4 19-11-2z" fill="' + scarf + '"/>' +
    '<g stroke="none" fill="' + accent + '"><ellipse cx="-25" cy="10" rx="8" ry="4"/><ellipse cx="25" cy="10" rx="8" ry="4"/></g>' +
    '<path d="M-15-4v2m30-2v2m-21 13q6 7 12 0" fill="none" stroke="#614846" stroke-width="3" stroke-linecap="round"/></g>';
}

export function cottageArt(id) {
  return `
    <defs>
      <linearGradient id="cottage-sky" x2="0" y2="1"><stop stop-color="#fae7c7"/><stop offset="1" stop-color="#f1bec0"/></linearGradient>
      <linearGradient id="cottage-grass" x2="0" y2="1"><stop stop-color="#afc596"/><stop offset="1" stop-color="#7d9a77"/></linearGradient>
    </defs>
    <rect width="640" height="290" fill="url(#cottage-sky)"/>
    <circle cx="458" cy="59" r="34" fill="#fff2c8"/>
    <path d="M0 143Q113 64 227 140T451 129T640 101V290H0Z" fill="#a6b99a"/>
    <path d="M0 181q107-45 232-18t221-7t187-17v151H0Z" fill="url(#cottage-grass)"/>
    <path d="M0 234q99-43 226-26t232 2q110-27 182-8v88H0Z" fill="#8dab7c"/>
    <path d="M283 217q-5 33-77 73h179q-48-41-49-73" fill="#e2bd9b"/>
    <path d="M293 241h35m-63 31h75" stroke="#f4d9ad" stroke-width="3" stroke-linecap="round"/>
    <g stroke="#986653" stroke-width="4" stroke-linejoin="round">
      <path d="M186 132 308 60l122 72v96H186Z" fill="#ffe1b6"/>
      <path d="M172 136 300 55q8-5 16 0l128 81-13 12-123-71-123 71Z" fill="#c47b76"/>
      <path d="M204 122 308 65l105 57M239 98l70-40 70 40M272 96l-15-13m89 13 15-13" fill="none" stroke="#edaa8d" stroke-width="3"/>
      <path d="M353 81V48h26v49" fill="#ae766a"/>
      <path d="M348 48h36v-9h-36Z" fill="#d1947b"/>
      <path d="M283 226v-52a25 25 0 0 1 50 0v52Z" fill="#8da394"/>
      <path d="M295 218v-44a13 13 0 0 1 26 0v44" fill="none" stroke="#b9cbb1" stroke-width="3"/>
      <circle cx="320" cy="188" r="3" fill="#ffdb8d" stroke="none"/>
      <rect x="211" y="149" width="49" height="42" rx="7" fill="#f6ca79"/>
      <rect x="354" y="149" width="49" height="42" rx="7" fill="#f6ca79"/>
      <path d="M235 150v40m-23-20h47m119-20v40m-23-20h47" stroke="#bb8065" stroke-width="3"/>
      <circle cx="308" cy="115" r="13" fill="#f6ca79"/>
      <path d="M296 115h24m-12-11v22" stroke="#bb8065" stroke-width="2"/>
    </g>
    <path d="M208 195h55m88 0h55" stroke="#a57259" stroke-width="6" stroke-linecap="round"/>
    <path d="M41 250Q66 141 53 49m5 107 61-52m-66 35L13 91m550 140Q548 145 567 65m-13 71 54-35" fill="none" stroke="#846958" stroke-width="12" stroke-linecap="round"/>
    <g fill="#e6a3ad" stroke="#f5c3bf" stroke-width="3">
      <circle cx="18" cy="65" r="32"/><circle cx="59" cy="52" r="42"/><circle cx="106" cy="75" r="32"/>
      <circle cx="95" cy="105" r="24"/><circle cx="18" cy="106" r="25"/><circle cx="607" cy="67" r="42"/><circle cx="563" cy="62" r="30"/><circle cx="577" cy="98" r="27"/>
    </g>
    <g fill="#f3d1c3" stroke="#e5adad" stroke-width="2">
      <path d="M141 169q-15-12-6-16q9-3 6 16m362-25q-14-11-7-16q9-3 7 16m-377 32q-3-12 4-12q8 3-4 12"/>
    </g>
    <g fill="#678a69"><ellipse cx="95" cy="248" rx="44" ry="16"/><ellipse cx="559" cy="232" rx="54" ry="16"/><ellipse cx="515" cy="243" rx="37" ry="16"/></g>
    <g fill="#ffdcaf"><circle cx="87" cy="238" r="4"/><circle cx="103" cy="249" r="4"/><circle cx="526" cy="233" r="4"/><circle cx="552" cy="225" r="4"/><circle cx="567" cy="240" r="4"/></g>
    <ellipse cx="460" cy="252" rx="42" ry="10" fill="#587058" opacity=".3"/>
    <g transform="translate(460 211) scale(.77)"><g class="cottage-companion">${companionArt(id)}</g></g>
  `;
}
