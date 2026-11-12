/* ============ Flags for the countries outside Africa (Nov 2026) ============
   Global apps are filed under their home country; without these, those countries fell back to the Pan-African mark.
   Same 30×30 square format as the African flags in ui.js. Loaded right after ui.js-dependent scripts, before pages render. */
(function(){
  if (typeof FLAGS !== 'object' || !FLAGS) return;
  const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const hz = cs => cs.map((c, i) => r(0, 30 / cs.length * i, 30, 30 / cs.length + .2, c)).join('');
  const vt = cs => cs.map((c, i) => r(30 / cs.length * i, 0, 30 / cs.length + .2, 30, c)).join('');
  const nordic = (bg, cross, inner) => r(0, 0, 30, 30, bg) + r(8, 0, 6, 30, cross) + r(0, 12, 30, 6, cross) + (inner ? r(9.5, 0, 3, 30, inner) + r(0, 13.5, 30, 3, inner) : '');
  const star = (cx, cy, R, f) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .42 : R; p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2)); } return `<polygon points="${p.join(' ')}" fill="${f}"/>`; };
  const ukCorner = s => `<g transform="scale(${s})"><rect width="30" height="30" fill="#012169"/><path d="M0 0L30 30M30 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0L30 30M30 0L0 30" stroke="#c8102e" stroke-width="2"/><path d="M15 0V30M0 15H30" stroke="#fff" stroke-width="10"/><path d="M15 0V30M0 15H30" stroke="#c8102e" stroke-width="6"/></g>`;
  const F = {
    us: hz(['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234']) + r(0, 0, 14, 13, '#3c3b6e') + [3, 7, 11].map(x => [3, 6.5, 10].map(y => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join('')).join(''),
    gb: ukCorner(1),
    ca: r(0, 0, 30, 30, '#fff') + r(0, 0, 7.5, 30, '#d52b1e') + r(22.5, 0, 7.5, 30, '#d52b1e') + '<path d="M15 7l1.6 3 2-1-.6 4.4 2.6-2.2.6 1.4 2.4-.5-.8 2.8 1.2.6-4.6 3.6.5 1.6-4.2-.6V24h-1.4v-3.9l-4.2.6.5-1.6-4.6-3.6 1.2-.6-.8-2.8 2.4.5.6-1.4 2.6 2.2-.6-4.4 2 1z" fill="#d52b1e"/>',
    se: nordic('#006aa7', '#fecc02'),
    fi: nordic('#fff', '#002f6c'),
    dk: nordic('#c8102e', '#fff'),
    de: hz(['#000', '#dd0000', '#ffce00']),
    nl: hz(['#ae1c28', '#fff', '#21468b']),
    fr: vt(['#0055a4', '#fff', '#ef4135']),
    es: r(0, 0, 30, 30, '#aa151b') + r(0, 7.5, 30, 15, '#f1bf00'),
    lt: hz(['#fdb913', '#006a44', '#c1272d']),
    ee: hz(['#0072ce', '#000', '#fff']),
    il: r(0, 0, 30, 30, '#fff') + r(0, 4, 30, 3.5, '#0038b8') + r(0, 22.5, 30, 3.5, '#0038b8') + '<path d="M15 9.5l4.8 8.3H10.2zM15 20.5l-4.8-8.3h9.6z" fill="none" stroke="#0038b8" stroke-width="1.2"/>',
    ae: hz(['#00732f', '#fff', '#000']) + r(0, 0, 8, 30, '#ff0000'),
    in: hz(['#ff9933', '#fff', '#138808']) + '<circle cx="15" cy="15" r="3.6" fill="none" stroke="#000080" stroke-width=".9"/><circle cx="15" cy="15" r=".8" fill="#000080"/>',
    cn: r(0, 0, 30, 30, '#de2910') + star(7, 8, 4.5, '#ffde00') + star(13.5, 3.5, 1.3, '#ffde00') + star(16, 6.5, 1.3, '#ffde00') + star(16, 10.5, 1.3, '#ffde00') + star(13.5, 13.5, 1.3, '#ffde00'),
    jp: r(0, 0, 30, 30, '#fff') + '<circle cx="15" cy="15" r="7" fill="#bc002d"/>',
    sg: r(0, 0, 30, 15, '#ef3340') + r(0, 15, 30, 15, '#fff') + '<circle cx="8" cy="7.5" r="4.4" fill="#fff"/><circle cx="9.6" cy="7.5" r="4.2" fill="#ef3340"/>' + [[12.5, 4.6], [15, 6.4], [14.1, 9.4], [10.9, 9.4], [10, 6.4]].map(([x, y]) => star(x, y, .9, '#fff')).join(''),
    ph: r(0, 0, 30, 15, '#0038a8') + r(0, 15, 30, 15, '#ce1126') + '<path d="M0 0L14 15L0 30z" fill="#fff"/><circle cx="5" cy="15" r="2.4" fill="#fcd116"/>',
    br: r(0, 0, 30, 30, '#009c3b') + '<path d="M15 4L27 15L15 26L3 15z" fill="#ffdf00"/><circle cx="15" cy="15" r="5.4" fill="#002776"/><path d="M9.8 13.8q5.2-1.4 10.4 1.8" stroke="#fff" stroke-width=".9" fill="none"/>',
    au: r(0, 0, 30, 30, '#012169') + ukCorner(.5) + star(7.5, 22.5, 3, '#fff') + star(22, 7, 1.4, '#fff') + star(25.5, 13, 1.4, '#fff') + star(19, 15, 1.4, '#fff') + star(22.5, 24, 1.6, '#fff'),
    nz: r(0, 0, 30, 30, '#012169') + ukCorner(.5) + [[22, 7], [25.5, 13], [19, 15], [22.5, 24]].map(([x, y]) => star(x, y, 2, '#fff') + star(x, y, 1.3, '#c8102e')).join(''),
    zw: hz(['#319208', '#ffd200', '#de2010', '#000', '#de2010', '#ffd200', '#319208']) + '<path d="M0 0L14 15L0 30z" fill="#fff" stroke="#000" stroke-width=".6"/>' + star(5, 15, 3, '#de2010'),
    tn: r(0, 0, 30, 30, '#e70013') + '<circle cx="15" cy="15" r="7" fill="#fff"/><circle cx="15.8" cy="15" r="4.6" fill="#e70013"/><circle cx="17" cy="15" r="3.7" fill="#fff"/>' + star(16.6, 15, 2.6, '#e70013'),
  };
  Object.keys(F).forEach(k => { if (!FLAGS[k]) FLAGS[k] = F[k]; });
})();
