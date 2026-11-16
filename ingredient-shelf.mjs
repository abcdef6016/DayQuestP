export function shelfObject(label, art) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'shelf-object';
  item.innerHTML = '<svg viewBox="-24 -26 48 52" width="22" height="22" aria-hidden="true">' + art + '</svg>';
  const name = document.createElement('span');
  name.textContent = label;
  item.append(name);
  return item;
}

export const counterProps = {
  milk: '<path d="M-15-10-7-23H13l6 13v27l-8 5h-26Z" fill="#f4d9e8" stroke="#895970" stroke-width="2"/><path d="m-15-10 8-13h20l-7 13z" fill="#d4a5d8"/><path d="M6-10h13v27l-8 5H6z" fill="#b989be"/><rect x="-12" y="-2" width="15" height="15" rx="3" fill="#f6a4cc"/><path d="M-10 6q4-6 10 0" fill="none" stroke="#fff0fb" stroke-width="2"/>',
  banana: '<path d="M-18-13Q-13 12 10 8q9-2 13-9l-1 8Q8 28-11 13q-9-7-9-23Z" fill="#f7d480" stroke="#a67656" stroke-width="2"/><path d="M-14-5q10 22 28 15" fill="none" stroke="#e1a760" stroke-width="2"/><path d="m-19-12 4 1m36 9 2 4" stroke="#6c6554" stroke-width="3" stroke-linecap="round"/>',
  chocolate: '<path d="m-17-13 28-5 6 30-28 7Z" fill="#9d647e" stroke="#563649" stroke-width="2"/><path d="m-13-10 9-1 2 8-9 2Zm12-2 9-2 2 8-9 2ZM-10 2l9-2 2 8-9 2ZM2 0l9-2 2 8-9 2Z" fill="#704858"/><path d="m-11 9 27-5 2 8-28 7Z" fill="#e49bbf"/>',
  jar: '<path d="M-13-14h26l4 8v21q0 6-17 6t-17-6V-6Z" fill="#956877" stroke="#654456" stroke-width="2"/><rect x="-14" y="-20" width="28" height="8" rx="3" fill="#d9a4bc" stroke="#855b74" stroke-width="2"/><rect x="-12" y="-3" width="24" height="13" rx="4" fill="#f8d3be"/><path d="M-5 5q5-7 10 0" fill="none" stroke="#a86e83" stroke-width="2"/>',
  bottle: '<path d="M-7-19H7v11l7 7v17q0 5-14 5t-14-5V-1l7-7Z" fill="#d79575" stroke="#86576a" stroke-width="2"/><rect x="-8" y="-23" width="16" height="7" rx="3" fill="#b780aa"/><path d="M-11 0h22v12h-22Z" fill="#ffe4bc"/><path d="M-6 6h12" stroke="#c37d72" stroke-width="2"/>',
  scoop: '<path d="M-13 4h26L4 22H-4Z" fill="#d6a17c"/><path d="M-15 1q-4-6 2-10Q-13-23 0-23q13 0 14 14q7 4 2 11-5 5-10 1-6 5-12 0-4 4-9-2Z" fill="currentColor" stroke="#9c698e" stroke-width="2"/><path d="M-7-12q4-5 9-5" fill="none" stroke="#fff4f5" stroke-width="2" stroke-linecap="round"/>',
  noodles: '<ellipse cy="14" rx="20" ry="5" fill="#8e6476"/><path d="M-18-7q4-8 9 0t9 0t9 0t9 0m-36 8q4-8 9 0t9 0t9 0t9 0m-34 8q4-8 9 0t9 0t9 0t9 0" fill="none" stroke="#f2cd87" stroke-width="4" stroke-linecap="round"/>'
};
