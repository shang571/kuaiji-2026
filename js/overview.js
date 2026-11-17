/* ============================================================
   课程总览 + 篇章位置
   数据源：侧栏 #sbnav（分组 + 章节标题），避免在别处重复维护章目
   依赖：nav.js 的 go()
   ============================================================ */
(function () {
  var nav = document.getElementById('sbnav');
  var overlay = document.getElementById('ovOverlay');
  var body = document.getElementById('ovBody');
  var btn = document.getElementById('ovBtn');
  var closeBtn = document.getElementById('ovClose');
  if (!nav || !overlay || !body) return;

  /* ---------- 1. 从导航解析出「篇 → 章」 ---------- */
  var groups = [];
  var at = {};
  var cur = null;

  Array.prototype.forEach.call(nav.children, function (el) {
    if (el.classList && el.classList.contains('nav-group')) {
      cur = { name: el.textContent.trim(), items: [] };
      groups.push(cur);
    } else if (el.classList && el.classList.contains('nav-item') && cur) {
      var ch = parseInt(el.getAttribute('data-ch'), 10);
      var numEl = el.querySelector('.n');
      var num = numEl ? numEl.textContent.trim() : '';
      var title = el.textContent.replace(num, '').trim();
      var item = { ch: ch, num: num, title: title };
      cur.items.push(item);
      at[ch] = { name: cur.name, idx: cur.items.length - 1, total: 0, num: num, title: title };
    }
  });

  /* 补每篇总章数 */
  groups.forEach(function (g) {
    g.items.forEach(function (it) {
      at[it.ch].total = g.items.length;
    });
  });

  /* ---------- 2. 前置 / 延伸关系 ---------- */
  var REL = {
    0:  { pre: [],        rel: [2, 3] },
    1:  { pre: [0],       rel: [7] },
    2:  { pre: [0],       rel: [3, 5] },
    3:  { pre: [2],       rel: [4] },
    4:  { pre: [2],       rel: [5] },
    5:  { pre: [4],       rel: [7] },
    6:  { pre: [5],       rel: [7] },
    7:  { pre: [5, 6],    rel: [13] },
    8:  { pre: [5],       rel: [9] },
    9:  { pre: [8],       rel: [10] },
    10: { pre: [9],       rel: [11] },
    11: { pre: [10],      rel: [12] },
    12: { pre: [11],      rel: [13] },
    13: { pre: [7, 12],   rel: [17, 14] },
    14: { pre: [8, 13],   rel: [17] },
    15: { pre: [],        rel: [16, 21] },
    16: { pre: [15],      rel: [20, 21] },
    17: { pre: [13, 15],  rel: [20] },
    18: { pre: [15],      rel: [19, 20] },
    19: { pre: [16, 18],  rel: [20, 25] },
    20: { pre: [16, 19],  rel: [21, 25] },
    21: { pre: [16, 20],  rel: [22, 23] },
    22: { pre: [21],      rel: [23, 26] },
    23: { pre: [15],      rel: [24] },
    24: { pre: [23],      rel: [20] },
    25: { pre: [20],      rel: [19, 26] },
    26: { pre: [20, 25],  rel: [18] },
    27: { pre: [0, 13],   rel: [29] },
    28: { pre: [],        rel: [27] },
    29: { pre: [],        rel: [27, 28] }
  };

  /* ---------- 3. 渲染总览 ---------- */
  function linkNode(ch) {
    var info = at[ch];
    var a = document.createElement('a');
    a.setAttribute('data-ch', ch);
    var b = document.createElement('b');
    b.textContent = info ? info.num : '';
    a.appendChild(b);
    a.appendChild(document.createTextNode(info ? info.title : ('第 ' + (ch + 1) + ' 章')));
    a.addEventListener('click', function () {
      close();
      if (typeof window.go === 'function') window.go(ch);
    });
    return a;
  }

  groups.forEach(function (g) {
    var sec = document.createElement('section');
    sec.className = 'ov-sec';
    var h = document.createElement('h4');
    h.textContent = g.name;
    sec.appendChild(h);
    g.items.forEach(function (it) {
      sec.appendChild(linkNode(it.ch));
    });
    body.appendChild(sec);
  });

  /* ---------- 4. 篇章位置卡 ---------- */
  function cardFor(ch) {
    var info = at[ch];
    if (!info) return null;
    var card = document.createElement('div');
    card.className = 'poscard';

    var h = document.createElement('div');
    h.className = 'pos-h';
    h.textContent = '在全书中的位置';
    card.appendChild(h);

    var where = document.createElement('div');
    where.className = 'pos-where';
    where.appendChild(document.createTextNode(info.name + '　'));
    var b = document.createElement('b');
    b.textContent = '第 ' + (info.idx + 1) + ' / ' + info.total + ' 章';
    where.appendChild(b);
    card.appendChild(where);

    var rel = REL[ch] || { pre: [], rel: [] };
    if (rel.pre.length || rel.rel.length) {
      var row = document.createElement('div');
      row.className = 'pos-links';
      if (rel.pre.length) {
        var s1 = document.createElement('span');
        s1.textContent = '前置';
        row.appendChild(s1);
        rel.pre.forEach(function (c) { if (at[c]) row.appendChild(linkNode(c)); });
      }
      if (rel.rel.length) {
        var s2 = document.createElement('span');
        s2.textContent = '延伸';
        row.appendChild(s2);
        rel.rel.forEach(function (c) { if (at[c]) row.appendChild(linkNode(c)); });
      }
      card.appendChild(row);
    }
    return card;
  }

  var chapters = document.querySelectorAll('.chapter');
  Array.prototype.forEach.call(chapters, function (sec) {
    var ch = parseInt(sec.getAttribute('data-ch'), 10);
    var card = cardFor(ch);
    if (card) sec.appendChild(card);
  });

  /* ---------- 5. 开合 ---------- */
  function open() {
    overlay.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('open');
    document.documentElement.style.overflow = '';
  }
  window.ovOpen = open;
  window.ovClose = close;

  if (btn) btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();
