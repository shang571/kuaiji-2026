/* ============================================================
 知识点网络（2D）：95 节点 / 113 边 / 聚类 / 缩放 / 跳章
   依赖：nav.js 的 go()（仅在交互时调用）
   ============================================================ */

/* ============================================================
   知识点网络：95 个知识点 · 按主题聚类 · 可缩放/筛选/跳章
   ============================================================ */
(function(){
  var GROUPS = [
    {name:'会计 · 总论与基础', color:'#336f92'},
    {name:'会计 · 核算方法', color:'#4f8aab'},
    {name:'会计 · 业务核算', color:'#3a7076'},
    {name:'会计 · 报表与案例', color:'#8d7a4c'},
    {name:'财务管理 · 十二章', color:'#5f6f9a'}
  ];

  var NODES = [
    /* 卷一 总论 */
    {id:'def', n:'会计定义', g:0, ch:0, d:'以货币为主要计量单位，对一定主体的经济活动进行核算与监督的管理活动。'},
    {id:'calc', n:'核算职能', g:0, ch:0, d:'确认、计量、记录、报告，形成财务信息，面向过去。'},
    {id:'sup', n:'监督职能', g:0, ch:0, d:'审查经济活动的合法性与合理性，贯穿业务全过程。'},
    {id:'fa', n:'财务会计', g:0, ch:0, d:'对外报告，受会计准则约束，关注过去。'},
    {id:'ma', n:'管理会计', g:0, ch:0, d:'对内报告，方法灵活，关注未来。'},
    {id:'entity', n:'会计主体', g:0, ch:0, d:'会计服务的特定单位，限定核算的空间范围。'},
    {id:'going', n:'持续经营', g:0, ch:0, d:'假定企业按当前规模持续经营，是折旧与历史成本的前提。'},
    {id:'period', n:'会计分期', g:0, ch:0, d:'把持续经营期间划分为等长期间，产生权责发生制与调整分录。'},
    {id:'money', n:'货币计量', g:0, ch:0, d:'以货币为主要计量单位，隐含币值稳定假设。'},
    {id:'accrual', n:'权责发生制', g:0, ch:1, d:'按权利与责任是否发生确认收入费用，不看现金收付。'},
    {id:'cash', n:'收付实现制', g:0, ch:1, d:'按现金实际收付确认，是现金流量表的编制基础。'},
    {id:'adj', n:'调整分录', g:0, ch:1, d:'期末处理应计、预计、估计项目，把权责发生制落到账上。'},
    {id:'asset', n:'资产', g:0, ch:2, d:'过去交易形成、拥有或控制、预期带来经济利益的资源。'},
    {id:'liab', n:'负债', g:0, ch:2, d:'过去交易形成的现时义务，预期导致经济利益流出。'},
    {id:'equity', n:'所有者权益', g:0, ch:2, d:'资产减负债后的剩余权益，归所有者享有。'},
    {id:'rev', n:'收入', g:0, ch:2, d:'日常活动形成、导致权益增加、与投入资本无关的流入。'},
    {id:'exp', n:'费用', g:0, ch:2, d:'日常活动发生、导致权益减少、与分配利润无关的流出。'},
    {id:'profit', n:'利润', g:0, ch:2, d:'收入减费用后的经营成果，还包括利得与损失。'},
    {id:'eq', n:'会计等式', g:0, ch:2, d:'资产 = 负债 + 所有者权益；扩展式再加入收入与费用。'},
    {id:'qual', n:'信息质量要求', g:0, ch:3, d:'可靠性、相关性、可理解性、可比性、实质重于形式、重要性、谨慎性、及时性。'},
    {id:'pru', n:'谨慎性', g:0, ch:3, d:'不高估资产收益、不低估负债费用，但不允许秘密准备。'},
    {id:'hist', n:'历史成本', g:0, ch:3, d:'按取得时的实际成本计量，是默认的计量属性。'},
    {id:'fv', n:'公允价值', g:0, ch:3, d:'市场参与者在计量日有序交易中形成的价格。'},

    /* 卷二 核算方法 */
    {id:'subj', n:'会计科目', g:1, ch:4, d:'对会计对象具体内容的分类项目，只有名称没有结构。'},
    {id:'acct', n:'账户', g:1, ch:4, d:'根据科目开设，有格式与结构，能记录增减变动。'},
    {id:'tacct', n:'T型账户', g:1, ch:4, d:'左借右贷的简化账户，用于汇总与试算。'},
    {id:'double', n:'复式记账', g:1, ch:5, d:'每笔业务在两个及以上相互联系的账户中登记。'},
    {id:'debit', n:'借贷记账法', g:1, ch:5, d:'以「有借必有贷、借贷必相等」为记账规则。'},
    {id:'rule', n:'记账规则', g:1, ch:5, d:'任何分录借方合计等于贷方合计。'},
    {id:'trial', n:'试算平衡', g:1, ch:5, d:'检查借贷发生额与余额是否相等，但发现不了全部错误。'},
    {id:'entry', n:'会计分录', g:1, ch:5, d:'标明账户、方向与金额的记录，分简单与复合分录。'},
    {id:'orig', n:'原始凭证', g:1, ch:6, d:'业务发生时取得或填制，证明业务真实发生。'},
    {id:'vouch', n:'记账凭证', g:1, ch:6, d:'根据原始凭证编制，载明会计分录。'},
    {id:'book', n:'会计账簿', g:1, ch:6, d:'由账页组成，分类连续记录经济业务。'},
    {id:'gl', n:'总分类账', g:1, ch:6, d:'按一级科目设置，提供总括核算指标。'},
    {id:'sub', n:'明细分类账', g:1, ch:6, d:'按明细科目设置，提供详细指标，与总账平行登记。'},
    {id:'cycle', n:'会计循环', g:1, ch:7, d:'确认、计量、记录、报告，每个会计期间重复一次。'},
    {id:'recon', n:'对账', g:1, ch:7, d:'账证、账账、账实、账表四方面核对。'},
    {id:'close', n:'结账', g:1, ch:7, d:'期末结算本期发生额与余额，转入下期。'},

    /* 卷三 业务核算 */
    {id:'capital', n:'实收资本', g:2, ch:8, d:'投资者投入并计入注册资本的资本。'},
    {id:'premium', n:'资本公积', g:2, ch:8, d:'资本溢价等非经营收益形成的权益。'},
    {id:'stloan', n:'短期借款', g:2, ch:8, d:'一年以内偿还的借款，利息计入财务费用。'},
    {id:'ltloan', n:'长期借款', g:2, ch:8, d:'超过一年偿还的借款，利息按用途资本化或费用化。'},
    {id:'fa_asset', n:'固定资产', g:2, ch:9, d:'为生产经营持有、使用寿命超过一个会计年度的有形资产。'},
    {id:'cip', n:'在建工程', g:2, ch:9, d:'需安装或自建资产在达到可使用状态前的归集科目。'},
    {id:'dep', n:'累计折旧', g:2, ch:9, d:'固定资产的备抵账户，不直接冲减原值。'},
    {id:'mat', n:'原材料', g:2, ch:9, d:'用于生产的材料，按实际成本核算。'},
    {id:'transit', n:'在途物资', g:2, ch:9, d:'已付款但尚未验收入库的采购物资。'},
    {id:'cost', n:'生产成本', g:2, ch:10, d:'归集直接材料、直接人工与分配来的制造费用。'},
    {id:'mfg', n:'制造费用', g:2, ch:10, d:'车间间接费用，期末分配计入产品成本。'},
    {id:'goods', n:'库存商品', g:2, ch:10, d:'完工验收入库、等待销售的产品。'},
    {id:'sales', n:'主营业务收入', g:2, ch:11, d:'销售商品或提供劳务的主要收入，不含增值税。'},
    {id:'cogs', n:'主营业务成本', g:2, ch:11, d:'已售商品的成本，由库存商品结转。'},
    {id:'tax', n:'税金及附加', g:2, ch:11, d:'消费税、城建税、教育费附加等，计入当期损益。'},
    {id:'opex', n:'期间费用', g:2, ch:11, d:'销售、管理、财务费用，直接计入当期损益。'},
    {id:'vat', n:'增值税', g:2, ch:12, d:'价外税，应纳 = 销项 − 进项，不计入收入与成本。'},
    {id:'yearprofit', n:'本年利润', g:2, ch:12, d:'期末结转收入与费用，计算当期损益。'},
    {id:'dist', n:'利润分配', g:2, ch:12, d:'提取盈余公积、向投资者分配利润。'},
    {id:'surplus', n:'盈余公积', g:2, ch:12, d:'从净利润中提取的积累资金。'},

    /* 卷四 财务报告 */
    {id:'bs', n:'资产负债表', g:3, ch:13, d:'时点报表，资产 = 负债 + 所有者权益。'},
    {id:'is', n:'利润表', g:3, ch:13, d:'时期报表，收入 − 费用 = 利润。'},
    {id:'cf', n:'现金流量表', g:3, ch:13, d:'按收付实现制编制，分经营、投资、筹资三类。'},
    {id:'soce', n:'所有者权益变动表', g:3, ch:13, d:'反映所有者权益各组成部分的增减变动。'},
    {id:'notes', n:'财务报表附注', g:3, ch:13, d:'报表项目的文字说明与明细资料，不可或缺。'},
    {id:'present', n:'报表列报要求', g:3, ch:13, d:'真实、完整、及时、可比等六项列报要求。'},

    /* 卷五 财务管理 */
    {id:'goal', n:'财务管理目标', g:4, ch:15, d:'股东财富最大化，兼顾债权人、员工等利益相关者。'},
    {id:'agency', n:'代理问题', g:4, ch:15, d:'股东与经营者、债权人之间的利益冲突及治理机制。'},
    {id:'tvm', n:'货币时间价值', g:4, ch:16, d:'同一金额在不同时点价值不同，是折现的基础。'},
    {id:'comp', n:'复利', g:4, ch:16, d:'利滚利，FV = PV × (1+r)ⁿ。'},
    {id:'annuity', n:'年金', g:4, ch:16, d:'等额、等间隔的系列收付，分普通、预付、递延、永续。'},
    {id:'risk', n:'风险与收益', g:4, ch:16, d:'高风险要求高回报，风险分系统性与非系统性。'},
    {id:'beta', n:'β系数', g:4, ch:16, en:'Beta Coefficient', d:'贝塔系数：衡量系统性风险，市场组合 β = 1。'},
    {id:'capm', n:'CAPM', g:4, ch:16, en:'Capital Asset Pricing Model', d:'资本资产定价模型：E(R) = Rf + β(Rm − Rf)，给风险定价。'},
    {id:'budget', n:'资本预算', g:4, ch:21, d:'用 NPV、IRR、回收期评价长期投资项目。'},
    {id:'npv', n:'NPV', g:4, ch:21, en:'Net Present Value', d:'净现值：未来现金流现值减初始投资，大于 0 才创造价值。'},
    {id:'irr', n:'IRR', g:4, ch:21, en:'Internal Rate of Return', d:'内含报酬率：使 NPV 为零的折现率，高于资本成本可行。'},
    {id:'sunk', n:'沉没成本', g:4, ch:21, d:'已发生且不可收回，不进入决策的增量现金流。'},
    {id:'costcap', n:'资本成本', g:4, ch:20, d:'投资者要求的最低报酬率，也是项目的折现率。'},
    {id:'wacc', n:'WACC', g:4, ch:20, en:'Weighted Average Cost of Capital', d:'加权平均资本成本：各类资本成本按权重加权，是投资门槛。'},
    {id:'mm', n:'MM理论', g:4, ch:20, en:'Modigliani-Miller Theorem', d:'MM 定理：有税时负债的税盾提升企业价值。'},
    {id:'dol', n:'经营杠杆', g:4, ch:20, d:'边际贡献 ÷ EBIT，衡量经营风险。'},
    {id:'dfl', n:'财务杠杆', g:4, ch:20, d:'EBIT ÷ (EBIT − I)，衡量财务风险。'},
    {id:'wc', n:'营运资本', g:4, ch:23, d:'流动资产减流动负债，反映短期偿债与周转。'},
    {id:'eoq', n:'EOQ', g:4, ch:23, en:'Economic Order Quantity', d:'经济订货批量：使订货成本与储存成本之和最低的订货批量。'},
    {id:'credit', n:'信用政策', g:4, ch:23, d:'信用标准、信用条件与收账政策的组合。'},
    {id:'ratio', n:'财务比率', g:4, ch:17, d:'偿债、营运、盈利、市价四类比率。'},
    {id:'dupont', n:'杜邦分析', g:4, ch:17, d:'ROE = 净利率 × 总资产周转率 × 权益乘数。'},
    {id:'common', n:'普通股', g:4, ch:19, d:'永久资本，无固定股利，会稀释控制权。'},
    {id:'bond', n:'债券', g:4, ch:19, d:'有期限、固定利息，利息可抵税。'},
    {id:'convert', n:'可转换债券', g:4, ch:19, d:'纯债 + 看涨期权，票面利率低，转股稀释股权。'},
    {id:'lease', n:'融资租赁', g:4, ch:19, d:'融资与融物结合，租金含设备价款、利息与手续费。'},
    {id:'dividend', n:'股利政策', g:4, ch:25, d:'剩余股利、固定股利、固定支付率、低正常加额外。'},
    {id:'ytwz', n:'在途物资', g:2, ch:14, d:'货款已付、货物未到时的过渡科目，验收入库后转入原材料。'},
    {id:'ytsc', n:'完工入库', g:2, ch:14, d:'生产成本归集完毕转入库存商品，成本由此定型。'},
    {id:'ytcb', n:'成本结转', g:2, ch:14, d:'销售时把库存商品成本转入主营业务成本，与收入同期配比。'}
  ];

  var EDGES = [
    ['def','calc'],['def','sup'],['def','money'],['def','entity'],['calc','sup'],['fa','calc'],['fa','ma'],
    ['entity','going'],['going','period'],['period','money'],['period','accrual'],['accrual','cash'],['accrual','adj'],
    ['asset','liab'],['asset','equity'],['liab','equity'],['asset','eq'],['liab','eq'],['equity','eq'],
    ['rev','profit'],['exp','profit'],['profit','eq'],['qual','pru'],['qual','hist'],['hist','fv'],
    ['eq','bs'],['asset','bs'],['qual','present'],['adj','cycle'],
    ['subj','acct'],['acct','tacct'],['acct','debit'],['double','debit'],['debit','rule'],['debit','entry'],
    ['rule','trial'],['entry','vouch'],['orig','vouch'],['vouch','book'],['book','gl'],['book','sub'],
    ['gl','sub'],['cycle','entry'],['cycle','trial'],['cycle','recon'],['cycle','close'],['trial','recon'],
    ['subj','asset'],['trial','bs'],
    ['capital','premium'],['stloan','ltloan'],['fa_asset','cip'],['fa_asset','dep'],['mat','transit'],
    ['mat','cost'],['cost','mfg'],['cost','goods'],['goods','cogs'],['sales','cogs'],['sales','tax'],
    ['sales','vat'],['opex','yearprofit'],['sales','yearprofit'],['cogs','yearprofit'],['yearprofit','dist'],
    ['dist','surplus'],['capital','equity'],['fa_asset','asset'],['goods','asset'],['goods','bs'],['yearprofit','soce'],
    ['is','rev'],['is','exp'],['is','profit'],['cf','cash'],['soce','dist'],['notes','bs'],['present','bs'],
    ['bs','is'],['is','cf'],['cf','soce'],['present','is'],['notes','is'],
    ['goal','agency'],['tvm','comp'],['tvm','annuity'],['comp','npv'],['annuity','npv'],['risk','beta'],
    ['beta','capm'],['capm','costcap'],['costcap','wacc'],['npv','budget'],['irr','budget'],['sunk','budget'],
    ['wacc','budget'],['wacc','mm'],['dol','dfl'],['wc','eoq'],['wc','credit'],['ratio','dupont'],
    ['ratio','bs'],['ratio','is'],['common','costcap'],['bond','costcap'],['convert','common'],['convert','bond'],
    ['lease','bond'],['dividend','common'],['dividend','dist'],['npv','costcap'],['irr','costcap'],['goal','profit',
    ['ytwz','raw'],['ytwz','ytcb'],['ytsc','ytcb'],['cost','ytcb'],['is','ytcb']
  ]
  ];

  var N = NODES.length;
  var MAP = {};
  NODES.forEach(function(n,i){ MAP[n.id]=n; n.i=i; n.deg=0; n.rel=[]; });
  EDGES.forEach(function(e){
    var a=MAP[e[0]], b=MAP[e[1]];
    if(!a||!b) return;
    a.deg++; b.deg++; a.rel.push(b.id); b.rel.push(a.id);
  });

  var built=false, SEL=null, FILTER=null, QUERY='';
  var TX=0, TY=0, K=1, W=1000, H=720;
  var svg, view, stage, detail, listBox, chipsBox, searchInput, overlay;
  var nodeEls={}, edgeEls=[];

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function pad2(n){ n=String(n); return n.length<2?'0'+n:n; }

  function measure(){
    var r=stage.getBoundingClientRect();
    var aspect=(r.height||720)/Math.max(1,(r.width||1000));
    W=1000;
    H=Math.round(Math.max(640, Math.min(1500, W*aspect)));
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
  }

  var EGO={cx:0, cy:0, r1:0, r2:0};

  function layoutEgo(){
    var list=NODES.slice().sort(function(a,b){ return (a.g-b.g)||(a.ch-b.ch)||(a.i-b.i); });
    var n=list.length, per=Math.ceil(n/2);
    var cx=W/2, cy=H/2;
    var R=Math.min(W,H)/2-42;
    var rs=[R*0.52, R*0.76];
    list.forEach(function(nd,i){
      var ring=Math.floor(i/per), idx=i%per;
      var cnt=Math.min(per, n-ring*per);
      var a=-Math.PI/2 + idx*Math.PI*2/cnt;
      nd.x=cx+Math.cos(a)*rs[ring];
      nd.y=cy+Math.sin(a)*rs[ring];
      nd._ang=a; nd._ring=ring; nd._ego=true;
    });
    EGO.cx=cx; EGO.cy=cy; EGO.r1=rs[0]; EGO.r2=rs[1];
  }

  function placeLabels(){}

  function fit(){
    var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
    NODES.forEach(function(n){
      if(!n._ego) return;
      if(n.x-120<minX)minX=n.x-120;
      if(n.x+120>maxX)maxX=n.x+120;
      if(n.y-40<minY)minY=n.y-40;
      if(n.y+40>maxY)maxY=n.y+40;
    });
    var pad=48;
    var k=Math.min((W-pad*2)/Math.max(1,(maxX-minX)), (H-pad*2)/Math.max(1,(maxY-minY)), 2.4);
    K=k; TX=(W-(maxX+minX)*k)/2; TY=(H-(maxY+minY)*k)/2;
    apply();
  }

  function apply(){
    if(view) view.setAttribute('transform','translate('+TX+','+TY+') scale('+K+')');
    if(svg) svg.classList.toggle('zoomed', K>1.6);
  }

  function build(){
    overlay=document.getElementById('kgOverlay');
    stage=document.getElementById('kgStage');
    svg=document.getElementById('kgSvg');
    detail=document.getElementById('kgDetail');
    listBox=document.getElementById('kgList');
    chipsBox=document.getElementById('kgChips');
    searchInput=document.getElementById('kgSearch');

    measure();
    layoutEgo();

    var out='<g id="kgView">'
      +'<circle class="kg-ring" r="0"/><circle class="kg-ring" r="0"/>'
      +'<text class="kg-center" x="0" y="-6" text-anchor="middle">会计与财务管理</text>'
      +'<text class="kg-center2" x="0" y="16" text-anchor="middle">95 个知识点</text>';
    EDGES.forEach(function(e,idx){
      var a=MAP[e[0]], b=MAP[e[1]];
      if(!a||!b) return;
      out+='<line class="kg-edge" data-i="'+idx+'" x1="'+a.x.toFixed(1)+'" y1="'+a.y.toFixed(1)+'" x2="'+b.x.toFixed(1)+'" y2="'+b.y.toFixed(1)+'"/>';
      (a.ei=a.ei||[]).push(idx); (b.ei=b.ei||[]).push(idx);
    });
    NODES.forEach(function(n){
      var r=(5.2+Math.min(n.deg,8)*0.75).toFixed(1);
      out+='<g class="kg-node'+(n.label?'':' nolabel')+'" data-id="'+n.id+'" transform="translate('+n.x.toFixed(1)+','+n.y.toFixed(1)+')">'
        +'<circle r="3.8" stroke="'+GROUPS[n.g].color+'"/>'
        +'<text x="10" y="4.3" text-anchor="start">'+esc(n.n)+'</text></g>';
    });
    out+='</g>';
    svg.innerHTML=out;
    view=document.getElementById('kgView');

    svg.querySelectorAll('.kg-node').forEach(function(el){
      nodeEls[el.getAttribute('data-id')]=el;
      el.addEventListener('click', function(ev){ ev.stopPropagation(); kgFocus(el.getAttribute('data-id')); });
    });
    svg.querySelectorAll('.kg-edge').forEach(function(el,i){ edgeEls.push(el); });
    svg.addEventListener('click', function(){
      if(window.__kgSuppressClick){ window.__kgSuppressClick=false; return; }
      select(null);
    });

    buildSide();
    buildChips();
    bindZoomPan();
    renderEgo();
    select(null);
    built=true;
  }

  function buildSide(){
    var html='';
    GROUPS.forEach(function(g,gi){
      var items=NODES.filter(function(n){return n.g===gi;});
      html+='<div class="kg-g" data-g="'+gi+'"><i class="dot" style="background:'+g.color+'"></i>'
        +'<span>'+g.name+'</span><b>'+items.length+'</b></div>';
      items.forEach(function(n){
        html+='<a class="kg-link" data-id="'+n.id+'" data-g="'+gi+'" data-name="'+esc(n.n)+'">'+esc(n.n)+'</a>';
      });
    });
    listBox.innerHTML=html;
    listBox.querySelectorAll('.kg-g').forEach(function(el){
      el.addEventListener('click', function(){
        var gi=+el.getAttribute('data-g');
        FILTER=(FILTER===gi)?null:gi;
        applyFilter();
        select(null);
      });
    });
    listBox.querySelectorAll('.kg-link').forEach(function(el){
      el.addEventListener('click', function(){
        kgFocus(el.getAttribute('data-id'));
      });
    });
  }

  function buildChips(){
    var html='<button data-g="" class="on">全部</button>';
    GROUPS.forEach(function(g,gi){ html+='<button data-g="'+gi+'">'+g.name.replace('卷','')+'</button>'; });
    chipsBox.innerHTML=html;
    chipsBox.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        FILTER=b.getAttribute('data-g')===''?null:+b.getAttribute('data-g');
        applyFilter(); select(null);
      });
    });
  }

  function applyFilter(){
    NODES.forEach(function(n){
      var el=nodeEls[n.id]; if(!el) return;
      var ok=(FILTER===null || n.g===FILTER);
      if(QUERY){
        var q=QUERY.toLowerCase();
        ok = ok && ((n.n+' '+n.d).toLowerCase().indexOf(q)>=0);
      }
      el.classList.toggle('dim', !ok);
    });
    listBox.querySelectorAll('.kg-link').forEach(function(el){
      var g=+el.getAttribute('data-g');
      var ok=(FILTER===null || g===FILTER);
      if(QUERY) ok = ok && el.getAttribute('data-name').toLowerCase().indexOf(QUERY.toLowerCase())>=0;
      el.classList.toggle('hide', !ok);
    });
    listBox.querySelectorAll('.kg-g').forEach(function(el){
      el.classList.toggle('active', FILTER!==null && +el.getAttribute('data-g')===FILTER);
    });
    if(chipsBox) chipsBox.querySelectorAll('button').forEach(function(b){
      var g=b.getAttribute('data-g');
      b.classList.toggle('on', (FILTER===null && g==='') || (FILTER!==null && +g===FILTER));
    });
  }

  function select(id){
    SEL=id;
    if(overlay) overlay.classList.toggle('has-sel', !!id);
    var n=id?MAP[id]:null;
    NODES.forEach(function(x){
      var el=nodeEls[x.id]; if(!el) return;
      el.classList.toggle('sel', !!n && x.id===n.id);
      el.classList.toggle('rel', !!n && n.rel.indexOf(x.id)>=0);
      el.classList.toggle('fade', !!n && x.id!==n.id && n.rel.indexOf(x.id)<0);
    });
    edgeEls.forEach(function(el,i){
      var e=EDGES[i]; if(!e) return;
      var on=!!n && (e[0]===n.id || e[1]===n.id);
      el.classList.toggle('on', on);
      el.classList.toggle('hide', !on);
    });
    if(listBox) listBox.querySelectorAll('.kg-link').forEach(function(el){
      el.classList.toggle('on', !!n && el.getAttribute('data-id')===n.id);
    });
    if(detail) renderDetail(n);
    updateCrumb();
  }

  function renderEgo(){
    NODES.forEach(function(n){
      var el=nodeEls[n.id]; if(!el) return;
      el.classList.remove('hide','hop2','center','nolabel');
      el.setAttribute('transform','translate('+n.x.toFixed(1)+','+n.y.toFixed(1)+')');
      var t=el.querySelector('text'), ci=el.querySelector('circle');
      if(ci) ci.setAttribute('r',3.2);
      if(t){
        var deg=n._ang*180/Math.PI;
        var flip=(n._ang>Math.PI/2 && n._ang<Math.PI*1.5);
        if(flip){
          t.setAttribute('transform','rotate('+(deg+180).toFixed(1)+') translate(-9,0)');
          t.setAttribute('text-anchor','end');
        }else{
          t.setAttribute('transform','rotate('+deg.toFixed(1)+') translate(9,0)');
          t.setAttribute('text-anchor','start');
        }
        t.setAttribute('x','0'); t.setAttribute('y','4.2');
      }
    });
    edgeEls.forEach(function(le){ le.classList.add('hide'); le.classList.remove('on'); });
    var rings=view?view.querySelectorAll('.kg-ring'):[];
    if(rings.length===2){
      rings[0].setAttribute('cx',EGO.cx); rings[0].setAttribute('cy',EGO.cy); rings[0].setAttribute('r',EGO.r1);
      rings[1].setAttribute('cx',EGO.cx); rings[1].setAttribute('cy',EGO.cy); rings[1].setAttribute('r',EGO.r2);
    }
    var c1=view?view.querySelector('.kg-center'):null, c2=view?view.querySelector('.kg-center2'):null;
    if(c1){ c1.setAttribute('x',EGO.cx); c1.setAttribute('y',EGO.cy-6); }
    if(c2){ c2.setAttribute('x',EGO.cx); c2.setAttribute('y',EGO.cy+18); }
    fit();
    updateCrumb();
  }

  function kgFocus(id){ if(MAP[id]) select(id); }

  function updateCrumb(){
    var p=document.getElementById('kgPath');
    var n=SEL?MAP[SEL]:null;
    if(p) p.innerHTML = n ? '<b>'+esc(n.n)+'</b>　'+n.rel.length+' 个关联' : '95 个知识点 · 点击查看关系';
    var b=document.getElementById('kgBack');
    if(b) b.style.display='none';
  }

  function renderDetail(n){
    if(!detail) return;
    if(!n){
      var legend='';
      GROUPS.forEach(function(g,i){
        var c=NODES.filter(function(x){return x.g===i;}).length;
        legend+='<div><i style="background:'+g.color+'"></i>'+g.name+'　<span style="color:var(--muted)">'+c+' 个</span></div>';
      });
      detail.innerHTML='<div class="kg-empty"><b>怎么用这张网</b>'
        +'95 个知识点排成一个圆环，点击任意节点查看它的定义与关联关系；滚轮缩放，左侧可搜索或按卷筛选。</div>'
        +'<div class="kg-dsec">主题分布</div><div class="kg-legend">'+legend+'</div>';
      return;
    }
    var rel=n.rel.map(function(id){return MAP[id];}).filter(Boolean);
    var relHtml=rel.map(function(r){return '<button data-id="'+r.id+'">'+esc(r.n)+'</button>';}).join('');
    var title=(typeof TITLES!=='undefined' && TITLES[n.ch])?TITLES[n.ch]:'';
    detail.innerHTML='<div class="kg-dgroup"><i style="background:'+GROUPS[n.g].color+'"></i>'
      +GROUPS[n.g].name+'</div>'
      +'<div class="kg-dname">'+esc(n.n)+'</div>'
      +(n.en?'<div class="kg-den">'+esc(n.en)+'</div>':'')
      +'<div class="kg-ddef">'+esc(n.d)+'</div>'
      +'<a class="kg-dch" data-ch="'+n.ch+'">第 '+pad2(n.ch+1)+' 章 · '+esc(title)+' →</a>'
      +'<div class="kg-dsec">关联知识点 · '+rel.length+'</div>'
      +'<div class="kg-rel">'+(relHtml||'<span style="color:var(--muted);font-size:12px">暂无</span>')+'</div>';
    detail.querySelector('.kg-dch').addEventListener('click', function(){ jump(n.ch); });
    detail.querySelectorAll('.kg-rel button').forEach(function(b){
      b.addEventListener('click', function(){
        kgFocus(b.getAttribute('data-id'));
      });
    });
  }

  function center(id){
    var n=MAP[id]; if(!n) return;
    K=Math.max(K,1.35);
    TX=W/2-n.x*K; TY=H/2-n.y*K;
    apply();
  }

  function jump(ch){
    close();
    if(typeof go==='function') go(ch);
  }

  function toGraph(e){
    var p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
    var loc=p.matrixTransform(svg.getScreenCTM().inverse());
    return {x:(loc.x-TX)/K, y:(loc.y-TY)/K};
  }

  function updateNode(n){
    var el=nodeEls[n.id]; if(!el) return;
    el.setAttribute('transform','translate('+n.x.toFixed(1)+','+n.y.toFixed(1)+')');
    if(n.ei) n.ei.forEach(function(i){
      var e=EDGES[i], a=MAP[e[0]], b=MAP[e[1]], le=edgeEls[i];
      if(!le) return;
      le.setAttribute('x1',a.x.toFixed(1)); le.setAttribute('y1',a.y.toFixed(1));
      le.setAttribute('x2',b.x.toFixed(1)); le.setAttribute('y2',b.y.toFixed(1));
    });
  }

  function relayout(){
    layoutEgo();
    renderEgo();
    select(SEL);
  }

  function bindZoomPan(){
    var drag=null, ndrag=null;
    svg.addEventListener('pointerdown', function(e){
      var g=e.target.closest('.kg-node');
      if(g){
        select(g.getAttribute('data-id'));
        return;
      }
      drag={x:e.clientX,y:e.clientY,tx:TX,ty:TY};
      stage.classList.add('drag');
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', function(e){
      if(ndrag){
        var gp=toGraph(e), n=MAP[ndrag.id];
        n.x=Math.max(18,Math.min(W-18,gp.x+ndrag.dx));
        n.y=Math.max(18,Math.min(H-18,gp.y+ndrag.dy)); ndrag.moved=true;
        updateNode(n);
        return;
      }
      if(!drag) return;
      var rect=svg.getBoundingClientRect();
      var sx=W/rect.width, sy=H/rect.height;
      TX=drag.tx+(e.clientX-drag.x)*sx;
      TY=drag.ty+(e.clientY-drag.y)*sy;
      apply();
    });
    function end(e){
      if(ndrag){
        var el=nodeEls[ndrag.id];
        if(el) el.classList.remove('drag');
        if(ndrag.moved){ window.__kgSuppressClick=true; select(ndrag.id); }
        ndrag=null;
      }
      drag=null; stage.classList.remove('drag');
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', function(e){
      e.preventDefault();
      var p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY;
      var loc=p.matrixTransform(svg.getScreenCTM().inverse());
      var f=e.deltaY<0?1.12:0.893;
      var k2=Math.max(0.45, Math.min(3.2, K*f));
      TX=loc.x-(loc.x-TX)*k2/K;
      TY=loc.y-(loc.y-TY)*k2/K;
      K=k2; apply();
    }, {passive:false});

    document.querySelectorAll('#kgOverlay [data-z]').forEach(function(b){
      b.addEventListener('click', function(){
        var z=b.getAttribute('data-z');
        if(z==='reset'){ fit(); return; }
        if(z==='relayout'){ relayout(); return; }
        var k2=Math.max(0.45, Math.min(3.2, K*(z==='in'?1.18:0.847)));
        TX=W/2-(W/2-TX)*k2/K; TY=H/2-(H/2-TY)*k2/K; K=k2; apply();
      });
    });
  }

  function open(){
    overlay.classList.add('show');
    document.body.style.overflow='hidden';
    if(!built) build();
    else { measure(); fit(); }
    if(searchInput) setTimeout(function(){ searchInput.value=''; QUERY=''; applyFilter(); }, 0);
    if(overlay.classList.contains('mode3') && window.__KG3D) window.__KG3D.activate();
  }
  function close(){
    overlay.classList.remove('show');
    document.body.style.overflow='';
    if(window.__KG3D) window.__KG3D.deactivate();
  }

  overlay=document.getElementById('kgOverlay');
  var _bk=document.getElementById('kgBack'); if(_bk) _bk.addEventListener('click', kgBack);
  document.querySelectorAll('[data-kg]').forEach(function(b){
    b.addEventListener('click', function(e){ e.preventDefault(); document.body.classList.remove('nav-open'); open(); });
  });
  document.getElementById('kgClose').addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && overlay && overlay.classList.contains('show')) close();
  });
  document.getElementById('kgSearch').addEventListener('input', function(e){
    QUERY=e.target.value.trim();
    applyFilter();
  });
  document.getElementById('kgSearch').addEventListener('keydown', function(e){
    if(e.key!=='Enter') return;
    var first=null;
    NODES.forEach(function(n){
      if(first) return;
      if((FILTER===null||n.g===FILTER) && (n.n+' '+n.d).indexOf(QUERY)>=0) first=n;
    });
    if(first){ kgFocus(first.id); }
  });

  var _rt;
  window.addEventListener('resize', function(){
    if(!built || !overlay || !overlay.classList.contains('show')) return;
    clearTimeout(_rt);
    _rt=setTimeout(function(){ measure(); fit(); }, 200);
  });

  window.__KG={
    NODES:NODES, GROUPS:GROUPS, EDGES:EDGES, MAP:MAP,
    select:select,
    refit:function(){ measure(); fit(); },
    state:function(){ return {filter:FILTER, query:QUERY, sel:SEL}; }
  };

  window.kgOpen=open;
  window.kgClose=close;
})();
