function element(tag, content = '') {
  const el = document.createElement(tag);
  el.textContent = content;
  return el;
}

function inline(parent, text) {
  const tokens = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\`([^\`\n]+)\`|~~([^~\n]+)~~|==([^=\n]+)==|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let end = 0;
  for (const match of text.matchAll(tokens)) {
    parent.append(text.slice(end, match.index));
    const [, bold, italic, code, strike, highlight, label, href] = match;
    if (label) {
      const link = element('a', label);
      link.href = href;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      parent.append(link);
    } else parent.append(element(bold ? 'strong' : italic ? 'em' : code ? 'code' : highlight ? 'mark' : 's', bold ?? italic ?? code ?? strike ?? highlight));
    end = match.index + match[0].length;
  }
  parent.append(text.slice(end));
}

export function renderNote(root, body, formatted, toggle) {
  root.replaceChildren();
  if (!formatted) {
    root.append(element('p', body));
    return;
  }
  let list;
  let code;
  body.split('\n').forEach((line, index) => {
    if (/^\s*\`\`\`/.test(line)) {
      if (code) code = null;
      else { code = element('pre'); root.append(code); }
      list = null;
      return;
    }
    if (code) { code.append(line + '\n'); return; }
    const task = /^- \[([ xX])\] (.*)$/.exec(line);
    const bullet = /^[-*] (.*)$/.exec(line);
    const numbered = /^(\d+)\. (.*)$/.exec(line);
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (task || bullet || numbered) {
      const tag = numbered ? 'OL' : 'UL';
      if (list?.tagName !== tag) {
        list = element(tag.toLowerCase());
        if (numbered) list.start = Number(numbered[1]);
        root.append(list);
      }
      const item = element('li');
      if (task) {
        const label = element('label');
        const box = element('input');
        box.type = 'checkbox';
        box.checked = task[1] !== ' ';
        box.addEventListener('change', () => toggle(index, box.checked));
        label.append(box, ' ');
        inline(label, task[2] || 'Task');
        item.className = 'notebook-check';
        item.append(label);
      } else inline(item, bullet?.[1] ?? numbered[2]);
      list.append(item);
      return;
    }
    list = null;
    if (/^---+$/.test(line)) { root.append(element('hr')); return; }
    const quote = line.startsWith('> ');
    const block = element(heading ? 'h' + (heading[1].length + 2) : quote ? 'blockquote' : 'p');
    inline(block, heading?.[2] ?? (quote ? line.slice(2) : line));
    root.append(block);
  });
}
