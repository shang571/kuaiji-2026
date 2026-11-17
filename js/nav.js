/* ============================================================
 导航与交互：章节切换、进度、搜索、公式抽屉、小测、计算器
   依赖：charts.js（drawFor）、bank.js（BANK/BS/renderBank）
   ============================================================ */

/* ============================================================
   核心：导航 / 进度 / 搜索 / 公式抽屉 / 小测 / 计算器
   ============================================================ */
var CUR = 0, TOTAL = 0, TITLES = [];

function pad2(n){ n=String(n); return n.length<2?'0'+n:n; }
function byCh(i){ return document.querySelector('.chapter[data-ch="'+i+'"]'); }

function go(i, opt){
  opt = opt || {};
  i = Math.max(0, Math.min(TOTAL-1, i|0));
  var cur = document.querySelector('.chapter.active');
  if(cur) cur.classList.remove('active');
  var target = byCh(i);
  if(!target) return;
  target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(it){
    it.classList.toggle('active', +it.getAttribute('data-ch')===i);
  });
  CUR = i;
  var actNav = document.querySelector('.nav-item.active');
  var navBox = document.getElementById('sbnav');
  if(actNav && navBox && navBox.scrollHeight > navBox.clientHeight + 10){
    var nt = actNav.offsetTop - navBox.offsetTop - navBox.clientHeight/2 + actNav.clientHeight/2;
    navBox.scrollTo({top: Math.max(0,nt), behavior:'smooth'});
  }
  var cn = document.getElementById('curNum'), ct = document.getElementById('curTitle');
  if(cn) cn.textContent = pad2(i+1);
  if(ct) ct.textContent = TITLES[i] || '';
  var pb2 = document.getElementById('prevBtn'), nb2 = document.getElementById('nextBtn');
  var pt = document.getElementById('prevTitle'), nt = document.getElementById('nextTitle');
  if(pb2) pb2.disabled = (i===0);
  if(nb2) nb2.disabled = (i===TOTAL-1);
  if(pt) pt.textContent = i>0 ? '← '+TITLES[i-1] : '已经是第一章';
  if(nt) nt.textContent = i<TOTAL-1 ? TITLES[i+1]+' →' : '已经是最后一章';
  document.body.classList.remove('nav-open');
  if(!opt.noScroll) window.scrollTo({top:0, behavior:'smooth'});
  /* 切章时清掉尺寸缓存：章节从 display:none 变可见后，容器宽度才可信 */
  target.querySelectorAll('canvas').forEach(function(cv){ cv._w = -1; });
  drawFor(i);
}
function next(){ if(CUR<TOTAL-1) go(CUR+1); }
function prev(){ if(CUR>0) go(CUR-1); }

/* ---------- 侧栏与按钮 ---------- */
document.querySelectorAll('.nav-item').forEach(function(it){
  it.tabIndex = 0;
  it.setAttribute('role','button');
  it.addEventListener('click', function(e){ e.preventDefault(); go(+it.getAttribute('data-ch')); });
  it.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); go(+it.getAttribute('data-ch')); }
  });
});
document.getElementById('prevBtn').addEventListener('click', prev);
document.getElementById('nextBtn').addEventListener('click', next);
document.getElementById('menuBtn').addEventListener('click', function(){ document.body.classList.toggle('nav-open'); });
document.getElementById('navMask').addEventListener('click', function(){ document.body.classList.remove('nav-open'); });

/* ---------- 键盘 ---------- */
document.addEventListener('keydown', function(e){
  var kg=document.getElementById('kgOverlay');
  if(kg && kg.classList.contains('show')) return;
  var tag = (e.target.tagName||'').toLowerCase();
  var typing = tag==='input' || tag==='textarea' || tag==='select';
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPanel('search'); return; }
  if(e.key==='Escape'){
    if(searchPanel.classList.contains('show')) closePanel();
    else if(drawer.classList.contains('show')) closePanel();
    else document.body.classList.remove('nav-open');
    return;
  }
  if(typing) return;
  if(e.key==='ArrowRight' && !e.shiftKey){ next(); }
  if(e.key==='ArrowLeft' && !e.shiftKey){ prev(); }
  if(e.key==='/'){ e.preventDefault(); openPanel('search'); }
});

/* ---------- 阅读进度条 ---------- */
window.addEventListener('scroll', function(){
  var h = document.documentElement.scrollHeight - window.innerHeight;
  var p = h>0 ? (window.scrollY/h*100) : 0;
  var rb = document.getElementById('readbar');
  if(rb) rb.style.width = Math.max(0, Math.min(100,p))+'%';
  var tt = document.getElementById('toTop');
  if(tt) tt.classList.toggle('show', window.scrollY > 700);
}, {passive:true});
var _toTop = document.getElementById('toTop');
if(_toTop) _toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });

/* 打印时展开答案 */
window.addEventListener('beforeprint', function(){
  document.querySelectorAll('.chapter.active details').forEach(function(d){
    d.setAttribute('data-was', d.open?'1':'0');
    d.open = true;
  });
});
window.addEventListener('afterprint', function(){
  document.querySelectorAll('.chapter.active details').forEach(function(d){
    if(d.getAttribute('data-was')==='0') d.open = false;
  });
});

/* 小测选项键盘可达 */
document.querySelectorAll('.quiz .opt').forEach(function(o){
  o.tabIndex = 0;
  o.setAttribute('role','button');
  o.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); o.click(); }
  });
});

/* ---------- Toast ---------- */
var _toastT;
function toast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(function(){ t.classList.remove('show'); }, 1800);
}

/* ---------- 面板：搜索 / 公式 ---------- */
var searchPanel = document.getElementById('searchOverlay');
var drawer = document.getElementById('fxDrawer');
var _fxGloss = document.getElementById('fxGloss');
if(_fxGloss) _fxGloss.addEventListener('click', function(){
  var c = document.querySelector('#fxDrawer [data-close]');
  if(c) c.click();
  if(typeof go==='function') go(24);
  setTimeout(function(){
    var g=document.getElementById('glossary');
    if(!g) return;
    var y=g.getBoundingClientRect().top+window.scrollY-92;
    var de=document.documentElement, prev=de.style.scrollBehavior;
    de.style.scrollBehavior='auto';
    window.scrollTo(0,y);
    setTimeout(function(){ de.style.scrollBehavior=prev; },0);
  }, 380);
});
function openPanel(which){
  closePanel();
  if(which==='search'){
    searchPanel.classList.add('show');
    var inp = document.getElementById('searchInput');
    setTimeout(function(){ inp.focus(); inp.select(); }, 30);
  }else{
    drawer.classList.add('show');
  }
}
function closePanel(){
  if(searchPanel) searchPanel.classList.remove('show');
  if(drawer) drawer.classList.remove('show');
}
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-open]');
  if(b){ e.preventDefault(); openPanel(b.getAttribute('data-open')); }
});
if(searchPanel){
  searchPanel.addEventListener('click', function(e){ if(e.target===searchPanel) closePanel(); });
}
document.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closePanel); });

/* ---------- 全文搜索 ---------- */
var INDEX = [];
function buildIndex(){
  INDEX = [];
  document.querySelectorAll('.chapter').forEach(function(sec){
    var ch = +sec.getAttribute('data-ch');
    var title = sec.querySelector('h2');
    var titleText = title ? title.textContent.trim() : '';
    if(title) INDEX.push({ch:ch, el:title, text:titleText, head:titleText, kind:3});
    var head = titleText;
    sec.querySelectorAll('h3,h4,p,li,td,th,summary,.qstem,.card-t,.defn p').forEach(function(el){
      var t = (el.textContent||'').replace(/\s+/g,' ').trim();
      if(t.length < 6) return;
      var tag = el.tagName;
      if(tag==='H3' || tag==='H4') head = t;
      INDEX.push({ch:ch, el:el, text:t, head:head, kind:(tag==='H3'||tag==='H4')?2:1});
    });
  });
}
function esc(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function snippet(text, q){
  var low = text.toLowerCase(), p = low.indexOf(q);
  if(p<0) p = 0;
  var s = Math.max(0, p-34), e = Math.min(text.length, p+q.length+78);
  var pre = s>0?'…':'', post = e<text.length?'…':'';
  var seg = text.slice(s,e);
  var re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
  return pre + esc(seg).replace(re,'<mark>$1</mark>') + post;
}
function doSearch(q){
  var box = document.getElementById('searchRes');
  q = (q||'').trim();
  if(!q){ box.innerHTML='<div class="search-empty">输入关键词，搜索全部 25 章内容</div>'; return; }
  var low = q.toLowerCase(), hits = [], seen = {};
  INDEX.forEach(function(it){
    var t = it.text.toLowerCase(), p = t.indexOf(low);
    if(p<0) return;
    var key = it.ch+'|'+it.text.slice(0,40);
    if(seen[key]) return;
    seen[key]=1;
    var score = it.kind*1000 - p*0.2 - Math.min(t.length,400)*0.05;
    if(t===low) score += 3000;
    hits.push({it:it, score:score});
  });
  hits.sort(function(a,b){ return b.score-a.score; });
  hits = hits.slice(0,16);
  if(!hits.length){ box.innerHTML='<div class="search-empty">没有找到「'+esc(q)+'」，换个说法试试</div>'; return; }
  box.innerHTML = hits.map(function(h){
    var label = h.it.kind>=2 ? h.it.text : (h.it.head || h.it.text);
    var body = h.it.kind>=2 ? '' : '<div class="sx">'+snippet(h.it.text, q)+'</div>';
    return '<div class="sres" data-ch="'+h.it.ch+'" data-idx="'+INDEX.indexOf(h.it)+'">'
      +'<div class="st">'+esc(label.slice(0,48))+(label.length>48?'…':'')+'</div>'
      +'<div class="sm">第 '+pad2(h.it.ch+1)+' 章 · '+(TITLES[h.it.ch]||'')+'</div>'+body+'</div>';
  }).join('');
  bindResults();
}
function bindResults(){
  document.querySelectorAll('#searchRes .sres').forEach(function(r){
    r.addEventListener('click', function(){
      var ch = +r.getAttribute('data-ch');
      var idx = +r.getAttribute('data-idx');
      var el = INDEX[idx] ? INDEX[idx].el : null;
      closePanel();
      go(ch, {noScroll:true});
      if(el){
        setTimeout(function(){
          var y = el.getBoundingClientRect().top + window.scrollY - 86;
          window.scrollTo({top:y, behavior:'smooth'});
          el.classList.add('flash');
          setTimeout(function(){ el.classList.remove('flash'); }, 1800);
        }, 80);
      }
    });
  });
}
var searchInput = document.getElementById('searchInput');
if(searchInput){
  searchInput.addEventListener('input', function(){ doSearch(searchInput.value); });
  searchInput.addEventListener('keydown', function(e){
    var items = document.querySelectorAll('#searchRes .sres');
    if(!items.length) return;
    var cur = document.querySelector('#searchRes .sres.sel');
    var idx = Array.prototype.indexOf.call(items, cur);
    if(e.key==='ArrowDown'){ e.preventDefault(); idx = Math.min(items.length-1, idx+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); idx = Math.max(0, idx-1); }
    else if(e.key==='Enter'){ e.preventDefault(); (cur||items[0]).click(); return; }
    else return;
    items.forEach(function(it){ it.classList.remove('sel'); });
    items[idx].classList.add('sel');
    items[idx].scrollIntoView({block:'nearest'});
  });
}

/* ---------- 公式手册 ---------- */
var FX = [
  {g:'会计等式与账户', n:'会计恒等式', f:'资产 = 负债 + 所有者权益', d:'资产负债表的编制依据'},
  {g:'会计等式与账户', n:'扩展等式', f:'资产 = 负债 + 所有者权益 + (收入 − 费用)', d:'期间内的动态平衡'},
  {g:'会计等式与账户', n:'账户余额', f:'期末余额 = 期初余额 + 本期增加 − 本期减少', d:'先判断账户性质，再定借贷方向'},
  {g:'会计等式与账户', n:'试算平衡', f:'借方发生额合计 = 贷方发生额合计', d:'平衡不代表没有错误'},
  {g:'会计计量与折旧', n:'直线法', f:'年折旧 = (原值 − 净残值) ÷ 使用年限', d:'每期折旧额相等'},
  {g:'会计计量与折旧', n:'双倍余额递减', f:'年折旧 = 期初账面净值 × (2 ÷ 年限)', d:'最后两年改直线，并扣除残值'},
  {g:'会计计量与折旧', n:'年数总和法', f:'年折旧 = (原值 − 净残值) × 尚可使用年限 ÷ 年数总和', d:'年数总和 = n(n+1)÷2'},
  {g:'会计计量与折旧', n:'坏账准备', f:'当期计提 = 应收余额 × 比例 − 已提数', d:'结果为负则冲回'},
  {g:'会计计量与折旧', n:'增值税', f:'应纳 = 销项税额 − 进项税额', d:'不含税价 = 含税价 ÷ (1+税率)'},
  {g:'会计计量与折旧', n:'营业利润', f:'营业收入 − 营业成本 − 税金及附加 − 期间费用 + 其他收益 + 投资收益 − 减值损失', d:'不含营业外收支'},
  {g:'会计计量与折旧', n:'净利润', f:'(营业利润 + 营业外收入 − 营业外支出) × (1 − 所得税率)', d:'转入未分配利润'},
  {g:'时间价值', n:'复利终值', f:'FV = PV × (1+r)ⁿ', d:'一次性收付'},
  {g:'时间价值', n:'复利现值', f:'PV = FV ÷ (1+r)ⁿ', d:'折现'},
  {g:'时间价值', n:'普通年金现值', f:'PVA = A × [1 − (1+r)⁻ⁿ] ÷ r', d:'每期期末收付'},
  {g:'时间价值', n:'普通年金终值', f:'FVA = A × [(1+r)ⁿ − 1] ÷ r', d:'每期期末收付'},
  {g:'时间价值', n:'预付年金', f:'PVA预 = 普通年金现值 × (1+r)', d:'期初收付，多一期利息'},
  {g:'时间价值', n:'永续年金', f:'PV = A ÷ r', d:'无到期日'},
  {g:'时间价值', n:'固定增长模型', f:'P = D₁ ÷ (r − g)', d:'要求 r > g'},
  {g:'风险与收益', n:'期望收益率', f:'E(R) = Σ PᵢRᵢ', d:'概率加权平均'},
  {g:'风险与收益', n:'标准差', f:'σ = √Σ Pᵢ[Rᵢ − E(R)]²', d:'绝对风险指标'},
  {g:'风险与收益', n:'变异系数', f:'CV = σ ÷ E(R)', d:'不同规模项目的相对风险'},
  {g:'风险与收益', n:'CAPM', f:'E(R) = Rf + β(Rm − Rf)', d:'β 衡量系统性风险'},
  {g:'投资决策', n:'债券价值', f:'V = Σ I ÷ (1+r)ᵗ + M ÷ (1+r)ⁿ', d:'只看剩余期限'},
  {g:'投资决策', n:'净现值', f:'NPV = Σ CFt ÷ (1+r)ᵗ − C₀', d:'NPV > 0 才接受'},
  {g:'投资决策', n:'获利指数', f:'PI = 未来现金流现值 ÷ 初始投资', d:'PI > 1 可行'},
  {g:'资本成本', n:'债券成本', f:'Kd = I(1−T) ÷ [P(1−f)]', d:'利息可抵税'},
  {g:'资本成本', n:'普通股成本', f:'Ks = D₁ ÷ [P₀(1−f)] + g', d:'股利不抵税'},
  {g:'资本成本', n:'留存收益成本', f:'Ke = D₁ ÷ P₀ + g', d:'无筹资费用'},
  {g:'资本成本', n:'WACC', f:'WACC = Σ WjKj', d:'权重优先用市场价值'},
  {g:'杠杆与营运资本', n:'营业杠杆', f:'DOL = 边际贡献 ÷ EBIT', d:'用基期数据'},
  {g:'杠杆与营运资本', n:'财务杠杆', f:'DFL = EBIT ÷ (EBIT − I)', d:'无优先股时'},
  {g:'杠杆与营运资本', n:'联合杠杆', f:'DTL = DOL × DFL = 边际贡献 ÷ (EBIT − I)', d:'收入变动放大 EPS'},
  {g:'杠杆与营运资本', n:'每股收益', f:'EPS = (EBIT − I)(1−T) ÷ N', d:'N 为普通股股数'},
  {g:'杠杆与营运资本', n:'经济订货批量', f:'EOQ = √(2DK ÷ Kc)', d:'此时订货成本 = 储存成本'},
  {g:'杠杆与营运资本', n:'现金周转期', f:'存货周转期 + 应收周转期 − 应付周转期', d:'越短越好'},
  {g:'比率与股利', n:'周转率', f:'营业收入 ÷ 平均余额；天数 = 360 ÷ 周转率', d:'用平均余额'},
  {g:'比率与股利', n:'杜邦分解', f:'ROE = 净利率 × 总周转率 × 权益乘数', d:'三条赚钱路径'},
  {g:'比率与股利', n:'剩余股利', f:'净利润 − 投资额 × 目标权益比重', d:'先投资后分配'},
  {g:'比率与股利', n:'转换比率', f:'债券面值 ÷ 转换价格', d:'可转债核心参数'}
];
function renderFx(kw){
  var body = document.getElementById('fxBody'); if(!body) return;
  kw = (kw||'').trim().toLowerCase();
  var groups = {}, order = [];
  FX.forEach(function(x){
    if(kw && (x.n+x.f+x.d).toLowerCase().indexOf(kw)<0) return;
    if(!groups[x.g]){ groups[x.g]=[]; order.push(x.g); }
    groups[x.g].push(x);
  });
  if(!order.length){ body.innerHTML='<div class="search-empty">没有匹配的公式</div>'; return; }
  body.innerHTML = order.map(function(g){
    return '<div class="fx-group"><h4>'+g+'</h4>'+groups[g].map(function(x){
      return '<div class="fx"><div class="fn">'+x.n+'</div><div class="ff">'+x.f+'</div><div class="fd">'+x.d+'</div></div>';
    }).join('')+'</div>';
  }).join('');
}
var fxSearch = document.getElementById('fxSearch');
if(fxSearch) fxSearch.addEventListener('input', function(){ renderFx(fxSearch.value); });

/* ---------- 随堂小测 ---------- */
var EXP = {
  0:'会计主体是“独立主体，但不一定是法律主体”。分公司虽不是法人，但要独立核算，因此可以是会计主体。典型对照：子公司两者都是√，分公司会计主体√、法律主体×。',
  1:'权责发生制看“权利是否已取得”。商品已售出，收款权利已成立，所以本月确认收入并形成应收账款。C 错在“银行存款”——钱还没到账。',
  2:'用存款还债：银行存款（资产）减少，短期借款（负债）减少，两边同减同额，等式仍然平衡。这就是第④类“资产与权益同减”。',
  3:'售后回租是“实质重于形式”的经典案例：法律形式是销售，但经济实质是融资（风险和报酬未转移），因此不能确认销售收入。',
  4:'会计科目是账户的名称，只解决“叫什么”；账户不但有名称，还有账页和结构，能记录具体增减变动。两者反映的经济内容相同。A、C 都说反了。',
  5:'固定资产按 10 万入账（全额），付出的 6 万冲减银行存款，欠的 4 万形成应付账款。一借多贷，借贷合计都是 10 万。A 漏记了负债，C 方向反了。',
  6:'现金与银行存款之间的划转，只编制付款凭证，不编制收款凭证，以避免同一笔业务在两边重复记账。所以提现只编“银行存款付款凭证”。',
  7:'折旧不直接冲减“固定资产”原值，而是贷记“累计折旧”这个备抵账户。报表上以“原值−累计折旧”列示净值，这样能保留资产的历史成本信息。',
  8:'偿还期超过 1 年的借款记“长期借款”。3 年 > 1 年，所以是长期借款。短期借款指 1 年以内。C 错——借款形成的是负债，不是所有者权益。',
  9:'固定资产入账价值 = 价款 50 000 + 安装费 3 000 = 53 000 元。增值税 6 500 元不计入成本（一般纳税人可抵扣），单独记入“应交税费—应交增值税（进项税额）”。',
  10:'按岗位归集：生产工人工资 → 生产成本；车间管理人员 → 制造费用；行政管理人员 → 管理费用；销售人员 → 销售费用。车间管理人员属于间接费用，先归集到制造费用，期末再分配。',
  11:'收入按不含税价款确认。增值税是价外税，代收代付，不计入收入也不计入成本。所以确认收入 10 万元，另记销项税额 1.3 万元。',
  12:'应纳增值税 = 销项税额 − 进项税额 = 5 − 3.5 = 1.5 万元。这就是增值税“链条抵扣”的核心：只对增值部分纳税。',
  13:'现金流量表是唯一按收付实现制编制的报表——它就是要反映“钱实际进出了多少”。资产负债表、利润表、所有者权益变动表都按权责发生制。',
  14:'利润最大化的三大缺陷：① 未考虑时间价值；② 未考虑风险；③ 易导致短期行为（如削减研发、少提折旧来粉饰当期利润）。这正是“股东财富最大化”取代它的原因。',
  15:'FV = 10 000 × (1+10%)³ = 10 000 × 1.331 = 13 310 元。注意是复利：第一年利息 1000，第二年按 11000 计息 1100，第三年按 12100 计息 1210，合计 3310。A 是单利算法。',
  16:'β = 0.6 < 1，说明该股票波动幅度只有市场的 0.6 倍，属于防御型资产（如公用事业、消费必需品）。β 小不代表没风险，只是系统性风险低于市场。',
  17:'两个指标都通过门槛：NPV = 12 万 > 0（创造价值），IRR = 15% > 资本成本 10%（回报超过要求）。两个标准一致时结论明确：接受。',
  18:'有税 MM 理论的核心是税盾：利息在税前扣除，相当于政府补贴了一部分利息成本，因此负债能提升企业价值。A 表述绝对化——债务成本通常较低但不是“永远”。',
  19:'EOQ 的数学本质是最小化“订货成本 + 储存成本”之和。订货批量大→订货次数少（订货成本低）但储存成本高；批量小则相反。两者交点即最优批量。',
  20:'权益乘数 = ROE ÷ (净利率 × 周转率) = 20% ÷ (2% × 2.5) = 20% ÷ 5% = 4.0。这说明该公司 ROE 主要靠高杠杆撑起（权益乘数 4 意味着负债率约 75%），风险值得警惕。',
  21:'剩余股利政策先满足投资所需的权益资金：800 × 60% = 480 万元，剩余 1000 − 480 = 520 万元才用于分红。这样能保持目标资本结构、降低资本成本，但股利波动大。'
};
function pick(el, ok, qid){
  var q = el.closest('.quiz');
  if(!q || q.dataset.answered) return;
  q.dataset.answered = '1';
  var opts = q.querySelectorAll('.opt');
  opts.forEach(function(o){ o.style.pointerEvents='none'; });
  el.classList.add(ok?'ok':'no');
  if(!ok){
    opts.forEach(function(o){
      if((o.getAttribute('onclick')||'').indexOf('true')>-1) o.classList.add('ok');
    });
  }
  var fb = document.getElementById('fb'+qid);
  if(fb){
    fb.className = 'qfb show ' + (ok?'ok':'no');
    fb.innerHTML = (ok?'✓ 正确　':'✗ 再想想　') + (EXP[qid]||'');
  }
  var foot = q.querySelector('.quiz-foot');
  if(!foot){ foot=document.createElement('div'); foot.className='quiz-foot'; q.appendChild(foot); }
  var btn=document.createElement('button');
  btn.type='button'; btn.textContent='重做本题';
  btn.onclick=function(){
    delete q.dataset.answered;
    opts.forEach(function(o){ o.classList.remove('ok','no'); o.style.pointerEvents=''; });
    if(fb){ fb.className='qfb'; fb.innerHTML=''; }
    foot.remove();
  };
  foot.innerHTML=''; foot.appendChild(btn);
}

/* ---------- 计算器 ---------- */
function fmt(n, d){
  if(typeof n!=='number' || !isFinite(n)) return '—';
  d = (d===undefined) ? 2 : d;
  return n.toLocaleString('zh-CN', {minimumFractionDigits:0, maximumFractionDigits:d});
}
function num(id, def){
  var el=document.getElementById(id);
  if(!el) return def;
  var v=parseFloat(el.value);
  return isFinite(v) ? v : def;
}
function calcTV(){
  var type=document.getElementById('tv_type').value;
  var A=num('tv_amt',0), r=num('tv_rate',0)/100, n=num('tv_n',0);
  var name='', val=0, formula='';
  if(A<=0 || n<0){ toast('请输入有效金额与期数'); return; }
  if(type==='fv'){
    val=A*Math.pow(1+r,n); name='复利终值 FV'; formula='FV = '+fmt(A)+' × (1+'+fmt(r*100)+'%)<sup>'+n+'</sup>';
  } else if(type==='pv'){
    val=A/Math.pow(1+r,n); name='复利现值 PV'; formula='PV = '+fmt(A)+' ÷ (1+'+fmt(r*100)+'%)<sup>'+n+'</sup>';
  } else if(type==='pva'){
    val = r===0 ? A*n : A*(1-Math.pow(1+r,-n))/r;
    name='普通年金现值 PVA'; formula='PVA = '+fmt(A)+' × [1−(1+'+fmt(r*100)+'%)<sup>−'+n+'</sup>] ÷ '+fmt(r*100)+'%';
  } else if(type==='fva'){
    val = r===0 ? A*n : A*(Math.pow(1+r,n)-1)/r;
    name='普通年金终值 FVA'; formula='FVA = '+fmt(A)+' × [(1+'+fmt(r*100)+'%)<sup>'+n+'</sup>−1] ÷ '+fmt(r*100)+'%';
  } else {
    val = r===0 ? 0 : A/r;
    name='永续年金现值'; formula='PV = '+fmt(A)+' ÷ '+fmt(r*100)+'%';
  }
  var out=document.getElementById('tvOut');
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>计算类型</span><span><strong>'+name+'</strong></span></div>'+
    '<div class="row"><span>公式</span><span style="font-family:Cambria,serif">'+formula+'</span></div>'+
    '<div style="margin-top:10px"><span>结果 = </span><span class="big">¥'+fmt(val)+'</span></div>'+
    (type==='fv'||type==='fva' ? '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">其中利息/增值部分 = ¥'+fmt(val-A*(type==='fva'?n:1))+'</div>' : '');
}
function calcCAPM(){
  var rf=num('c_rf',0)/100, rm=num('c_rm',0)/100, b=num('c_b',0);
  var prem=rm-rf, comp=b*prem, er=rf+comp;
  var out=document.getElementById('cOut');
  var risk = b>1.2?'进攻型（高风险高预期）' : (b<0.8?'防御型（低波动）' : '接近市场平均水平');
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>市场风险溢价 (Rm−Rf)</span><span>'+fmt(prem*100)+'%</span></div>'+
    '<div class="row"><span>该资产风险补偿 β×(Rm−Rf)</span><span>'+b+' × '+fmt(prem*100)+'% = '+fmt(comp*100)+'%</span></div>'+
    '<div class="row"><span>风险类型判断</span><span>'+risk+'</span></div>'+
    '<div style="margin-top:10px"><span>E(R) = '+fmt(rf*100)+'% + '+fmt(comp*100)+'% = </span><span class="big">'+fmt(er*100)+'%</span></div>'+
    '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">含义：投资该资产至少要获得 '+fmt(er*100)+'% 的年回报，否则不值得承担这个风险。</div>';
}
function calcNPV(){
  var inv=num('n_inv',0), cf=num('n_cf',0), n=num('n_n',0), r=num('n_r',0)/100;
  if(inv<=0 || n<=0){ toast('请输入有效投资额与期数'); return; }
  var pv=0;
  for(var t=1;t<=n;t++) pv += cf/Math.pow(1+r,t);
  var npv=pv-inv;
  var lo=-0.99, hi=10;
  for(var k=0;k<200;k++){
    var mid=(lo+hi)/2, p=0;
    for(var t2=1;t2<=n;t2++) p+=cf/Math.pow(1+mid,t2);
    if(p-inv>0) lo=mid; else hi=mid;
  }
  var irr=(lo+hi)/2;
  var payback = cf>0 ? inv/cf : Infinity;
  var out=document.getElementById('nOut');
  var ok = npv>0 && irr>r;
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>未来现金流现值合计</span><span>¥'+fmt(pv,0)+'</span></div>'+
    '<div class="row"><span>初始投资</span><span>¥'+fmt(inv,0)+'</span></div>'+
    '<div class="row"><span>净现值 NPV</span><span style="color:'+(npv>0?'#336f92':'#b04a33')+';font-weight:600">¥'+fmt(npv,0)+'</span></div>'+
    '<div class="row"><span>内含报酬率 IRR</span><span>'+fmt(irr*100)+'%　（资本成本 '+fmt(r*100)+'%）</span></div>'+
    '<div class="row"><span>静态回收期</span><span>'+(isFinite(payback)?fmt(payback)+' 年':'—')+'</span></div>'+
    '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed #cfe0ee">'+
      '<span>决策结论：</span><span class="big" style="font-size:17px">'+(ok?'✓ 接受该项目':'✗ 拒绝该项目')+'</span>'+
    '</div>'+
    '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">'+
      'NPV '+(npv>0?'&gt; 0，项目创造价值':'&lt; 0，项目毁灭价值')+'；'+
      'IRR '+(irr>r?'高于':'低于')+'资本成本 '+(irr>r?'→ 回报达标':'→ 回报不足')+'。'+
    '</div>';
}
function calcWACC(){
  var kd=num('w_kd',0)/100, ke=num('w_ke',0)/100, wd=num('w_wd',0)/100, T=num('w_t',0)/100;
  if(wd<0||wd>1){ toast('债务占比应在 0–100% 之间'); return; }
  var we=1-wd, atkd=kd*(1-T), wacc=wd*atkd+we*ke;
  var out=document.getElementById('wOut');
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>税后债务成本 Kd×(1−T)</span><span>'+fmt(kd*100)+'% × (1−'+fmt(T*100)+'%) = '+fmt(atkd*100)+'%</span></div>'+
    '<div class="row"><span>权益占比 We</span><span>'+fmt(we*100)+'%</span></div>'+
    '<div class="row"><span>税盾节约</span><span>'+fmt((kd-atkd)*wd*100)+' 个百分点（加权）</span></div>'+
    '<div style="margin-top:10px"><span>WACC = '+fmt(wd*100)+'% × '+fmt(atkd*100)+'% + '+fmt(we*100)+'% × '+fmt(ke*100)+'% = </span><span class="big">'+fmt(wacc*100)+'%</span></div>'+
    '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">投资门槛：项目预期收益率必须高于 '+fmt(wacc*100)+'%，才值得投。</div>';
}
function calcEOQ(){
  var D=num('e_d',0), K=num('e_k',0), Kc=num('e_kc',0);
  if(D<=0||K<=0||Kc<=0){ toast('需求量与成本必须大于 0'); return; }
  var eoq=Math.sqrt(2*D*K/Kc), orders=D/eoq, orderCost=orders*K, holdCost=(eoq/2)*Kc, total=orderCost+holdCost;
  var out=document.getElementById('eOut');
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>经济订货批量 EOQ</span><span style="font-weight:600">'+fmt(eoq,0)+' 件</span></div>'+
    '<div class="row"><span>年订货次数</span><span>'+fmt(orders,1)+' 次</span></div>'+
    '<div class="row"><span>年订货成本</span><span>¥'+fmt(orderCost,0)+'</span></div>'+
    '<div class="row"><span>年储存成本</span><span>¥'+fmt(holdCost,0)+'</span></div>'+
    '<div style="margin-top:10px"><span>年总成本（两项之和）= </span><span class="big">¥'+fmt(total,0)+'</span></div>'+
    '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">注意：在 EOQ 处，订货成本 = 储存成本（'+fmt(orderCost,0)+' = '+fmt(holdCost,0)+'），这是模型的数学性质。</div>';
}
function calcDupont(){
  var np=num('d_np',0), rev=num('d_rev',0), ta=num('d_ta',0), eq=num('d_eq',0);
  if(rev<=0||ta<=0||eq<=0){ toast('营业收入、总资产、所有者权益必须大于 0'); return; }
  var nm=np/rev, to=rev/ta, em=ta/eq, roe=nm*to*em;
  var driver='';
  if(nm>0.15) driver='盈利能力驱动（高净利率）';
  else if(to>1.5) driver='营运效率驱动（高周转）';
  else if(em>3) driver='财务杠杆驱动（高负债）';
  else driver='三因素相对均衡';
  var out=document.getElementById('dOut');
  out.className='cout fin show';
  out.innerHTML =
    '<div class="row"><span>净利率 = 净利润 ÷ 营业收入</span><span>'+fmt(np,0)+' ÷ '+fmt(rev,0)+' = '+fmt(nm*100)+'%</span></div>'+
    '<div class="row"><span>总资产周转率 = 营业收入 ÷ 总资产</span><span>'+fmt(rev,0)+' ÷ '+fmt(ta,0)+' = '+fmt(to,3)+' 次</span></div>'+
    '<div class="row"><span>权益乘数 = 总资产 ÷ 所有者权益</span><span>'+fmt(ta,0)+' ÷ '+fmt(eq,0)+' = '+fmt(em,3)+'</span></div>'+
    '<div class="row"><span>资产负债率（推算）</span><span>'+fmt((1-1/em)*100)+'%</span></div>'+
    '<div style="margin-top:10px"><span>ROE = '+fmt(nm*100)+'% × '+fmt(to,3)+' × '+fmt(em,3)+' = </span><span class="big">'+fmt(roe*100)+'%</span></div>'+
    '<div style="margin-top:8px;font-size:13px">主要驱动路径：<strong style="color:#3a7076">'+driver+'</strong></div>';
}
function valMode(){
  var m=document.getElementById('v_mode').value;
  document.getElementById('v_bond').style.display = m==='bond'?'':'none';
  document.getElementById('v_stock').style.display = m==='stock'?'':'none';
  var o=document.getElementById('vOut'); if(o) o.className='cout fin';
}
function calcVal(){
  var m=document.getElementById('v_mode').value;
  var out=document.getElementById('vOut');
  if(m==='bond'){
    var F=num('v_face',0), c=num('v_coupon',0)/100, r=num('v_rate',0)/100, n=num('v_year',0);
    if(F<=0||n<=0){ toast('面值与年限必须大于 0'); return; }
    var coupon=F*c, pvC, pvF, V;
    if(r===0){ pvC=coupon*n; pvF=F; }
    else { pvC=coupon*(1-Math.pow(1+r,-n))/r; pvF=F/Math.pow(1+r,n); }
    V=pvC+pvF;
    var diff=V-F, verdict = Math.abs(diff)<0.5?'平价发行' : (diff>0?'溢价发行（票面利率高于市场利率）':'折价发行（票面利率低于市场利率）');
    out.className='cout fin show';
    out.innerHTML =
      '<div class="row"><span>每年利息</span><span>¥'+fmt(coupon,2)+'</span></div>'+
      '<div class="row"><span>利息现值</span><span>¥'+fmt(pvC,2)+'</span></div>'+
      '<div class="row"><span>本金现值</span><span>¥'+fmt(pvF,2)+'</span></div>'+
      '<div class="row"><span>与面值差额</span><span>¥'+fmt(diff,2)+'</span></div>'+
      '<div style="margin-top:10px"><span>债券价值 = </span><span class="big">¥'+fmt(V,2)+'</span></div>'+
      '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">'+verdict+'。注意：只折现<strong>剩余期限</strong>，已过去的年份不计入。</div>';
  }else{
    var d1=num('v_d1',0), g=num('v_g',0)/100, r2=num('v_r',0)/100;
    if(d1<=0){ toast('预计股利必须大于 0'); return; }
    if(r2<=g){ toast('必要报酬率必须大于增长率'); return; }
    var P=d1/(r2-g);
    out.className='cout fin show';
    out.innerHTML =
      '<div class="row"><span>股利增长率 g</span><span>'+fmt(g*100)+'%</span></div>'+
      '<div class="row"><span>必要报酬率 r</span><span>'+fmt(r2*100)+'%</span></div>'+
      '<div class="row"><span>分母 r − g</span><span>'+fmt((r2-g)*100)+'%</span></div>'+
      '<div style="margin-top:10px"><span>股票价值 = D₁ ÷ (r − g) = </span><span class="big">¥'+fmt(P,2)+'</span></div>'+
      '<div style="font-size:12.5px;color:#7e96a6;margin-top:6px">这是固定增长（Gordon）模型。若 g=0，退化为永续年金 P = D ÷ r。</div>';
  }
}

/* ---------- 已背标记 ---------- */
var MASTER = [];  /* 背诵勾选只在本次浏览有效，不持久化 */
document.querySelectorAll('[data-master]').forEach(function(cb){
  var k = cb.getAttribute('data-master');
  cb.checked = MASTER.indexOf(k)>-1;
  cb.addEventListener('change', function(){
    var i = MASTER.indexOf(k);
    if(cb.checked && i<0) MASTER.push(k);
    if(!cb.checked && i>-1) MASTER.splice(i,1);
    toast(cb.checked?'已标记为掌握':'已取消标记');
  });
});

/* ---------- 初始化 ---------- */
/* 把每个图表 canvas 单独包进滚动容器：
   否则图表横向滑动时，图注和图例也会跟着被推出可视区。 */
function wrapChartCanvas(){
  var list = document.querySelectorAll('.chart-box > canvas');
  Array.prototype.forEach.call(list, function(cv){
    if(cv.parentNode && cv.parentNode.className === 'cv-scroll') return;
    var box = document.createElement('div');
    box.className = 'cv-scroll';
    cv.parentNode.insertBefore(box, cv);
    box.appendChild(cv);
  });
}
