/* ============================================================
 图表：canvas 尺寸表 + 各章绘图函数
   依赖：无（仅 DOM）
   被 nav.js 的 go() 调用
   ============================================================ */

/* ============================================================
   Canvas 图表：固定逻辑坐标 800×H，按容器宽度等比缩放
   ============================================================ */
var CH = {
  flowChart:[800,200], eqBal:[800,260], subjTree:[780,220], voucherTree:[780,250],
  cycleRing:[780,300], costFlow:[800,230], bsChart:[800,280], compCurve:[800,260],
  smlChart:[800,270], npvCurve:[800,270], waccCurve:[800,260], dupontTree:[800,300]
};
function prep(c){
  if(!c) return null;
  var m = CH[c.id]; if(!m) return null;
  var LW = m[0], H = m[1];
  /* 宽度必须取父容器的可用宽度，不能取 canvas 自身：
     canvas 一旦被写入 style.width，就会把父容器撑开，clientWidth 随之变大，形成自锁。
     因此测量前先把 canvas 的 CSS 宽度归零，让父容器回到真实可用宽度。 */
  var host = c.parentNode;
  c.style.width = '0px';
  var w = 0;
  if(host){
    /* clientWidth 含 padding，必须扣掉左右内边距，否则画布比内容区宽，会被 max-width 二次压缩 */
    var hs = getComputedStyle(host);
    w = host.clientWidth - (parseFloat(hs.paddingLeft) || 0) - (parseFloat(hs.paddingRight) || 0);
  }
  if(!w || w < 60) w = LW;
  /* 图表按 800 逻辑宽绘制，字号在里面。若压缩到手机宽度，字会小到看不清，
     因此设下限，宁可让 .chart-box 横向滑动，也要保住可读字号。 */
  var MINW = 620;
  if(w < MINW) w = Math.min(MINW, LW);
  if(c._w === w){
    /* 尺寸没变，恢复原宽度即可，无需重绘 */
    c.style.width = w + 'px';
    return null;
  }
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var scale = w / LW;
  c.width = Math.round(w * dpr);
  c.height = Math.round(H * scale * dpr);
  /* 位图按 dpr 放大保证清晰，CSS 尺寸锁定到 w */
  c.style.width = w + 'px';
  c.style.height = (H * scale) + 'px';
  /* 允许比容器宽：超出部分由 .chart-box 横向滚动承接，不能用 max-width 压回去 */
  c.style.maxWidth = 'none';
  var ctx = c.getContext('2d');
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.clearRect(0, 0, LW, H);
  c._w = w;
  /* 内容比容器宽时，按构图决定初始滚动位置：
     环形/曲线/树状图是居中构图，居中显示才不空半边；
     从左到右的流程图则保持左起，避免切掉起点。 */
  if(host && host.scrollWidth > host.clientWidth + 1){
    var CENTERED = {
      eqBal:1, subjTree:1, cycleRing:1, bsChart:1, compCurve:1,
      smlChart:1, npvCurve:1, waccCurve:1, dupontTree:1
    };
    host.scrollLeft = CENTERED[c.id] ? Math.round((host.scrollWidth - host.clientWidth) / 2) : 0;
  }
  return {ctx:ctx, W:LW, H:H};
}
function rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function box(ctx,x,y,w,h,title,sub,fill,stroke,tc){
  ctx.fillStyle = fill || '#fbfdff';
  ctx.strokeStyle = stroke || '#cfe0ee';
  ctx.lineWidth = 1;
  rrect(ctx,x,y,w,h,1); ctx.fill(); ctx.stroke();
  ctx.textAlign='center';
  ctx.fillStyle = tc || '#1c2a33';
  ctx.font = '600 13px "Source Han Serif SC","Songti SC",serif';
  ctx.fillText(title, x+w/2, y+(sub?h/2-3:h/2+5));
  if(sub){
    ctx.font = '11px "Microsoft YaHei",sans-serif';
    ctx.fillStyle = tc ? 'rgba(255,255,255,.74)' : '#7e96a6';
    ctx.fillText(sub, x+w/2, y+h/2+14);
  }
}
function arrow(ctx,x1,y1,x2,y2,color){
  ctx.strokeStyle = color || '#5a97b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  var ang = Math.atan2(y2-y1, x2-x1);
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-6*Math.cos(ang-0.4), y2-6*Math.sin(ang-0.4));
  ctx.lineTo(x2-6*Math.cos(ang+0.4), y2-6*Math.sin(ang+0.4));
  ctx.closePath(); ctx.fillStyle=color||'#5a97b8'; ctx.fill();
}

function drawFlow(){
  var p=prep(document.getElementById('flowChart')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var boxes=[{t:'经济业务',s:'交易发生'},{t:'原始凭证',s:'发票/收据'},{t:'记账凭证',s:'会计分录'},{t:'账簿',s:'总账/明细账'},{t:'财务报表',s:'三张表'}];
  var bw=118, gap=(W-40-bw*5)/4, y=70, bh=64;
  boxes.forEach(function(b,i){
    var x = 20 + i*(bw+gap);
    ctx.fillStyle = i===4 ? '#336f92' : '#fbfdff';
    ctx.strokeStyle = i===4 ? '#336f92' : '#cfe0ee';
    ctx.lineWidth = 1;
    rrect(ctx,x,y,bw,bh,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = i===4 ? '#fbfdff' : '#1c2a33';
    ctx.font = '600 14px "Source Han Serif SC","Songti SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.t, x+bw/2, y+27);
    ctx.font = '11px "Microsoft YaHei",sans-serif';
    ctx.fillStyle = i===4 ? 'rgba(255,255,255,.76)' : '#7e96a6';
    ctx.fillText(b.s, x+bw/2, y+47);
    if(i<4){
      var ax = x+bw+8, ay = y+bh/2;
      ctx.strokeStyle='#5a97b8'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+gap-16,ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax+gap-16,ay); ctx.lineTo(ax+gap-21,ay-4); ctx.lineTo(ax+gap-21,ay+4); ctx.closePath();
      ctx.fillStyle='#5a97b8'; ctx.fill();
    }
  });
  ctx.fillStyle='#7e96a6'; ctx.font='11.5px "Microsoft YaHei",sans-serif';
  ctx.fillText('核对', 20+bw+gap/2-10, y+bh+22);
  ctx.fillText('核对', 20+2*(bw+gap)+(bw+gap)/2-10, y+bh+22);
}

function drawEqBal(){
  var p=prep(document.getElementById('eqBal')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var data=[{label:'初始',a:500,l:200,e:300},{label:'借款+100',a:600,l:300,e:300},{label:'还债-50',a:550,l:250,e:300},{label:'盈利+50',a:600,l:250,e:350}];
  var base=H-46, maxV=700, sc=(H-96)/maxV;
  var bw=34, groupW=150;
  data.forEach(function(d,i){
    var x0 = 60 + i*groupW;
    ctx.fillStyle='#336f92'; ctx.fillRect(x0, base-d.a*sc, bw, d.a*sc);
    ctx.fillStyle='#fff'; ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
    ctx.fillText(d.a, x0+bw/2, base-d.a*sc+15);
    ctx.fillStyle='#7ba3bb'; ctx.fillRect(x0+bw+5, base-d.l*sc, bw, d.l*sc);
    ctx.fillStyle='#fff'; ctx.fillText(d.l, x0+bw+5+bw/2, base-d.l*sc+15);
    ctx.fillStyle='#3a7076'; ctx.fillRect(x0+2*bw+10, base-d.e*sc, bw, d.e*sc);
    ctx.fillStyle='#fff'; ctx.fillText(d.e, x0+2*bw+10+bw/2, base-d.e*sc+15);
    ctx.fillStyle='#7e96a6'; ctx.font='12px "Source Han Serif SC","Songti SC",serif';
    ctx.fillText(d.label, x0+bw+7, base+22);
  });
  ctx.textAlign='left'; ctx.font='11.5px "Microsoft YaHei",sans-serif';
  ctx.fillStyle='#336f92'; ctx.fillRect(20,14,11,11); ctx.fillStyle='#41545f'; ctx.fillText('资产',36,24);
  ctx.fillStyle='#7ba3bb'; ctx.fillRect(92,14,11,11); ctx.fillStyle='#41545f'; ctx.fillText('负债',108,24);
  ctx.fillStyle='#3a7076'; ctx.fillRect(162,14,11,11); ctx.fillStyle='#41545f'; ctx.fillText('所有者权益',178,24);
}

function drawSubjTree(){
  var p=prep(document.getElementById('subjTree')); if(!p) return;
  var ctx=p.ctx;
  box(ctx,20,80,140,52,'原材料','一级科目（总账科目）','#336f92','#336f92','#fff');
  box(ctx,220,40,160,46,'原料及主要材料','二级科目（子目）');
  box(ctx,220,110,160,46,'辅助材料','二级科目（子目）');
  box(ctx,440,26,110,40,'甲材料','明细科目');
  box(ctx,440,78,110,40,'乙材料','明细科目');
  box(ctx,440,124,110,40,'丙材料','明细科目');
  arrow(ctx,160,96,220,63); arrow(ctx,160,116,220,133);
  arrow(ctx,380,55,440,46); arrow(ctx,380,63,440,98); arrow(ctx,380,133,440,144);
  ctx.fillStyle='#7e96a6'; ctx.font='11.5px "Microsoft YaHei",sans-serif'; ctx.textAlign='left';
  ctx.fillText('财政部统一规定', 20, 152);
  ctx.fillText('企业自行设置 →', 226, 178);
}

function drawVoucherTree(){
  var p=prep(document.getElementById('voucherTree')); if(!p) return;
  var ctx=p.ctx;
  box(ctx,330,10,140,44,'会计凭证','','#336f92','#336f92','#fff');
  box(ctx,150,90,150,44,'原始凭证',''); box(ctx,500,90,150,44,'记账凭证','');
  arrow(ctx,380,54,225,90); arrow(ctx,420,54,575,90);
  box(ctx,40,175,140,40,'外来原始凭证','发票/银行回单');
  box(ctx,200,175,140,40,'自制原始凭证','领料单/入库单');
  box(ctx,410,175,90,40,'收款凭证',''); box(ctx,510,175,90,40,'付款凭证',''); box(ctx,610,175,90,40,'转账凭证','');
  arrow(ctx,195,134,110,175); arrow(ctx,255,134,270,175);
  arrow(ctx,540,134,455,175); arrow(ctx,565,134,555,175); arrow(ctx,590,134,655,175);
}

function drawCycleRing(){
  var p=prep(document.getElementById('cycleRing')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var cx=W/2, cy=H/2, R=104;
  var items=['① 经济业务\n取得原始凭证','② 编制\n记账凭证','③ 登记\n账簿','④ 期末\n调整分录','⑤ 试算\n平衡','⑥ 编制\n财务报表'];
  ctx.strokeStyle='#dceaf4'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  for(var k=0;k<6;k++){
    var a1=-Math.PI/2+k*Math.PI/3+0.42, a2=-Math.PI/2+(k+1)*Math.PI/3-0.42;
    ctx.strokeStyle='#5a97b8'; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.arc(cx,cy,R,a1,a2); ctx.stroke();
    var ea=a2;
    ctx.beginPath();
    ctx.moveTo(cx+R*Math.cos(ea), cy+R*Math.sin(ea));
    ctx.lineTo(cx+(R-6)*Math.cos(ea-0.1), cy+(R-6)*Math.sin(ea-0.1));
    ctx.lineTo(cx+(R+6)*Math.cos(ea-0.1), cy+(R+6)*Math.sin(ea-0.1));
    ctx.closePath(); ctx.fillStyle='#5a97b8'; ctx.fill();
  }
  items.forEach(function(t,i){
    var a=-Math.PI/2+i*Math.PI/3;
    var x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
    ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2);
    ctx.fillStyle='#fbfdff'; ctx.fill();
    ctx.strokeStyle='#336f92'; ctx.lineWidth=1.5; ctx.stroke();
    var lines=t.split('\n');
    ctx.textAlign='center'; ctx.font='600 12px "Source Han Serif SC","Songti SC",serif'; ctx.fillStyle='#1c2a33';
    var lx=x+Math.cos(a)*32, ly=y+Math.sin(a)*26;
    lines.forEach(function(L,li){ ctx.fillText(L, lx, ly+li*15); });
  });
  ctx.textAlign='center'; ctx.font='600 15px "Source Han Serif SC","Songti SC",serif'; ctx.fillStyle='#336f92';
  ctx.fillText('会计循环', cx, cy-4);
  ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#7e96a6';
  ctx.fillText('每个会计期间重复一次', cx, cy+16);
}

function drawCostFlow(){
  var p=prep(document.getElementById('costFlow')); if(!p) return;
  var ctx=p.ctx;
  box(ctx,20,26,116,40,'直接材料','','#e3eef8','#cfe2ee');
  box(ctx,20,84,116,40,'直接人工','','#e3eef8','#cfe2ee');
  box(ctx,20,142,116,40,'制造费用','','#e3eef8','#cfe2ee');
  box(ctx,220,84,130,50,'生产成本','三项归集','#336f92','#336f92','#fff');
  box(ctx,420,84,120,50,'库存商品','完工入库');
  box(ctx,600,84,150,50,'主营业务成本','销售结转');
  arrow(ctx,136,46,220,96); arrow(ctx,136,104,220,109); arrow(ctx,136,162,220,124);
  arrow(ctx,350,109,420,109); arrow(ctx,540,109,600,109);
  ctx.fillStyle='#5a97b8'; ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  ctx.fillText('期末分配', 385, 132); ctx.fillText('出售时', 570, 132);
  ctx.fillStyle='#7e96a6';
  ctx.fillText('借：生产成本 / 贷：原材料', 278, 62);
  ctx.fillText('借：库存商品 / 贷：生产成本', 480, 62);
}

function drawBS(){
  var p=prep(document.getElementById('bsChart')); if(!p) return;
  var ctx=p.ctx;
  ctx.fillStyle='#336f92'; ctx.fillRect(50,20,320,34);
  ctx.fillStyle='#3a7076'; ctx.fillRect(420,20,330,34);
  ctx.fillStyle='#fff'; ctx.font='600 14px "Source Han Serif SC","Songti SC",serif'; ctx.textAlign='center';
  ctx.fillText('资产', 210, 43); ctx.fillText('负债及所有者权益', 585, 43);
  ctx.fillStyle='#f2f8fc'; ctx.fillRect(50,54,320,64); ctx.strokeStyle='#cfe0ee'; ctx.strokeRect(50,54,320,64);
  ctx.fillStyle='#1c2a33'; ctx.font='13px "Source Han Serif SC","Songti SC",serif'; ctx.fillText('流动资产', 210, 80);
  ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#7e96a6'; ctx.fillText('货币资金 / 应收账款 / 存货 …', 210, 100);
  ctx.fillStyle='#f2f8fc'; ctx.fillRect(50,118,320,86); ctx.strokeStyle='#cfe0ee'; ctx.strokeRect(50,118,320,86);
  ctx.fillStyle='#1c2a33'; ctx.font='13px "Source Han Serif SC","Songti SC",serif'; ctx.fillText('非流动资产', 210, 150);
  ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#7e96a6'; ctx.fillText('固定资产 / 无形资产 / 长期投资 …', 210, 172);
  ctx.fillStyle='#f0f7fb'; ctx.fillRect(420,54,330,64); ctx.strokeStyle='#cfe0ee'; ctx.strokeRect(420,54,330,64);
  ctx.fillStyle='#1c2a33'; ctx.font='13px "Source Han Serif SC","Songti SC",serif'; ctx.fillText('负债', 585, 80);
  ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#7e96a6'; ctx.fillText('流动负债 / 非流动负债', 585, 100);
  ctx.fillStyle='#f0f7fb'; ctx.fillRect(420,118,330,86); ctx.strokeStyle='#cfe0ee'; ctx.strokeRect(420,118,330,86);
  ctx.fillStyle='#1c2a33'; ctx.font='13px "Source Han Serif SC","Songti SC",serif'; ctx.fillText('所有者权益', 585, 150);
  ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#7e96a6'; ctx.fillText('实收资本 / 资本公积 / 盈余公积 / 未分配利润', 585, 172);
  ctx.fillStyle='#b04a33'; ctx.font='700 28px serif'; ctx.fillText('=', 385, 140);
  ctx.fillStyle='#e3edf5'; ctx.fillRect(50,208,320,30); ctx.fillRect(420,208,330,30);
  ctx.fillStyle='#336f92'; ctx.font='600 13px "Source Han Serif SC","Songti SC",serif';
  ctx.fillText('资产总计', 210, 228); ctx.fillText('负债和所有者权益总计', 585, 228);
}

function drawComp(){
  var p=prep(document.getElementById('compCurve')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var pl=58, pb=42, pt=24, pr=24;
  var pw=W-pl-pr, ph=H-pt-pb;
  var P=10000, r=0.08, NY=30;
  var maxV=P*Math.pow(1+r,NY);
  ctx.strokeStyle='#e3edf5'; ctx.lineWidth=1;
  for(var g=0;g<=4;g++){ var yy=pt+ph*g/4; ctx.beginPath(); ctx.moveTo(pl,yy); ctx.lineTo(W-pr,yy); ctx.stroke(); }
  ctx.strokeStyle='#a9c2d4'; ctx.setLineDash([4,4]); ctx.lineWidth=1.2; ctx.beginPath();
  for(var y=0;y<=NY;y++){
    var v=P*(1+r*y), x=pl+pw*y/NY, Y=pt+ph-ph*Math.min(v,maxV)/maxV;
    y===0?ctx.moveTo(x,Y):ctx.lineTo(x,Y);
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle='#336f92'; ctx.lineWidth=2; ctx.beginPath();
  for(var y2=0;y2<=NY;y2++){
    var v2=P*Math.pow(1+r,y2), x2=pl+pw*y2/NY, Y2=pt+ph-ph*v2/maxV;
    y2===0?ctx.moveTo(x2,Y2):ctx.lineTo(x2,Y2);
  }
  ctx.stroke();
  ctx.lineTo(pl+pw,pt+ph); ctx.lineTo(pl,pt+ph); ctx.closePath();
  ctx.fillStyle='rgba(51,111,146,.07)'; ctx.fill();
  ctx.strokeStyle='#cfe0ee'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pl,pt); ctx.lineTo(pl,pt+ph); ctx.lineTo(W-pr,pt+ph); ctx.stroke();
  ctx.fillStyle='#7e96a6'; ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  for(var k=0;k<=NY;k+=5) ctx.fillText(k+'年', pl+pw*k/NY, pt+ph+18);
  ctx.textAlign='right';
  ctx.fillText('¥'+Math.round(maxV/10000)+'万', pl-8, pt+10);
  ctx.fillText('¥1万', pl-8, pt+ph+4);
  ctx.textAlign='left';
  ctx.strokeStyle='#336f92'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W-200,pt+6); ctx.lineTo(W-176,pt+6); ctx.stroke();
  ctx.fillStyle='#41545f'; ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.fillText('复利', W-170, pt+10);
  ctx.strokeStyle='#a9c2d4'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(W-120,pt+6); ctx.lineTo(W-96,pt+6); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#41545f'; ctx.fillText('单利', W-90, pt+10);
  ctx.fillStyle='#b04a33'; ctx.beginPath(); ctx.arc(pl+pw, pt+ph-ph*maxV/maxV, 3.5,0,7); ctx.fill();
  ctx.textAlign='right'; ctx.fillStyle='#336f92'; ctx.font='600 12px "Source Han Serif SC","Songti SC",serif';
  ctx.fillText('30年 ¥'+Math.round(maxV).toLocaleString(), pl+pw-8, pt+ph-ph*maxV/maxV-10);
}

function drawSML(){
  var p=prep(document.getElementById('smlChart')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var pl=62, pb=44, pt=26, pr=30;
  var pw=W-pl-pr, ph=H-pt-pb;
  var rf=3, rm=10, maxB=2.0, maxR=20;
  function X(b){ return pl+pw*b/maxB; }
  function Y(r){ return pt+ph-ph*r/maxR; }
  ctx.strokeStyle='#e3edf5';
  for(var g=0;g<=4;g++){ var yy=pt+ph*g/4; ctx.beginPath(); ctx.moveTo(pl,yy); ctx.lineTo(W-pr,yy); ctx.stroke(); }
  ctx.strokeStyle='#cfe0ee'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pl,pt); ctx.lineTo(pl,pt+ph); ctx.lineTo(W-pr,pt+ph); ctx.stroke();
  ctx.strokeStyle='#3a7076'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(X(0),Y(rf)); ctx.lineTo(X(maxB),Y(rf+maxB*(rm-rf))); ctx.stroke();
  ctx.fillStyle='#b04a33'; ctx.beginPath(); ctx.arc(X(0),Y(rf),4,0,7); ctx.fill();
  ctx.fillStyle='#336f92'; ctx.beginPath(); ctx.arc(X(1),Y(rm),4,0,7); ctx.fill();
  ctx.fillStyle='#41545f'; ctx.font='11.5px "Microsoft YaHei",sans-serif'; ctx.textAlign='left';
  ctx.fillText('Rf='+rf+'%', X(0)+8, Y(rf)-8);
  ctx.fillText('市场组合 β=1, Rm='+rm+'%', X(1)+8, Y(rm)-8);
  var br=1.2, rr=rf+br*(rm-rf);
  ctx.strokeStyle='#b04a33'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(X(br),pt+ph); ctx.lineTo(X(br),Y(rr)); ctx.lineTo(pl,Y(rr)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#b04a33'; ctx.beginPath(); ctx.arc(X(br),Y(rr),3.5,0,7); ctx.fill();
  ctx.font='600 11.5px "Microsoft YaHei",sans-serif';
  ctx.fillText('β=1.2 → '+rr.toFixed(1)+'%', X(br)+8, Y(rr)+16);
  ctx.fillStyle='#7e96a6'; ctx.font='11.5px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  [0,0.5,1,1.5,2].forEach(function(b){ ctx.fillText('β='+b, X(b), pt+ph+18); });
  ctx.fillText('系统性风险 β', W/2, H-8);
  ctx.save(); ctx.translate(16,H/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('预期收益率 E(R)', 0, 0); ctx.restore();
}

function drawNPV(){
  var p=prep(document.getElementById('npvCurve')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var pl=72, pb=44, pt=26, pr=30;
  var pw=W-pl-pr, ph=H-pt-pb;
  var inv=1000000, cf=280000, n=6, maxR=0.30;
  var pts=[], maxV=-1e9, minV=1e9;
  for(var rr=0; rr<=maxR+0.001; rr+=0.01){
    var pv=0; for(var t=1;t<=n;t++) pv+=cf/Math.pow(1+rr,t);
    var v=pv-inv; pts.push({r:rr,v:v});
    if(v>maxV) maxV=v; if(v<minV) minV=v;
  }
  var range=maxV-minV;
  function X(r){ return pl+pw*r/maxR; }
  function Y(v){ return pt+ph*0.1+ph*0.85*(maxV-v)/range; }
  ctx.strokeStyle='#a9c2d4'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pl,Y(0)); ctx.lineTo(W-pr,Y(0)); ctx.stroke();
  ctx.strokeStyle='#3a7076'; ctx.lineWidth=2; ctx.beginPath();
  pts.forEach(function(p2,i){ i===0?ctx.moveTo(X(p2.r),Y(p2.v)):ctx.lineTo(X(p2.r),Y(p2.v)); });
  ctx.stroke();
  var irr=0;
  for(var i=1;i<pts.length;i++){
    if(pts[i-1].v>0 && pts[i].v<=0){ irr=pts[i-1].r+(pts[i].r-pts[i-1].r)*pts[i-1].v/(pts[i-1].v-pts[i].v); break; }
  }
  ctx.fillStyle='#b04a33'; ctx.beginPath(); ctx.arc(X(irr),Y(0),4,0,7); ctx.fill();
  ctx.fillStyle='#b04a33'; ctx.font='600 12px "Source Han Serif SC","Songti SC",serif'; ctx.textAlign='center';
  ctx.fillText('IRR ≈ '+(irr*100).toFixed(1)+'%', X(irr), Y(0)+22);
  var v10=0; for(var t2=1;t2<=n;t2++) v10+=cf/Math.pow(1.10,t2); v10-=inv;
  if(v10>0){
    ctx.strokeStyle='#336f92'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(X(0.10),Y(0)); ctx.lineTo(X(0.10),Y(v10)); ctx.lineTo(pl,Y(v10)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#336f92'; ctx.beginPath(); ctx.arc(X(0.10),Y(v10),3.5,0,7); ctx.fill();
    ctx.textAlign='left'; ctx.font='11.5px "Microsoft YaHei",sans-serif';
    ctx.fillText('10% 时 NPV='+Math.round(v10).toLocaleString(), X(0.10)+8, Y(v10)-6);
  }
  ctx.strokeStyle='#cfe0ee'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pl,pt); ctx.lineTo(pl,pt+ph); ctx.lineTo(W-pr,pt+ph); ctx.stroke();
  ctx.fillStyle='#7e96a6'; ctx.font='11.5px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  [0,0.1,0.2,0.3].forEach(function(r){ ctx.fillText((r*100)+'%', X(r), pt+ph+18); });
  ctx.fillText('折现率', W/2, H-8);
  ctx.save(); ctx.translate(18,H/2); ctx.rotate(-Math.PI/2); ctx.fillText('NPV（元）',0,0); ctx.restore();
}

function drawWACC(){
  var p=prep(document.getElementById('waccCurve')); if(!p) return;
  var ctx=p.ctx, W=p.W, H=p.H;
  var pl=64, pb=44, pt=26, pr=30;
  var pw=W-pl-pr, ph=H-pt-pb;
  var T=0.25, ke0=11.5, kd0=5.5;
  var pts=[];
  for(var wd=0; wd<=0.85; wd+=0.02){
    var kd=kd0+6*Math.pow(wd,2.4), ke=ke0+5*Math.pow(wd,2.0);
    pts.push({w:wd, v:wd*kd*(1-T)+(1-wd)*ke});
  }
  var minV=99, maxV=0, minW=0;
  pts.forEach(function(q){ if(q.v<minV){minV=q.v; minW=q.w;} if(q.v>maxV) maxV=q.v; });
  var rng=maxV-minV;
  function X(w){ return pl+pw*w/0.85; }
  function Y(v){ return pt+ph*0.08+ph*0.84*(v-minV)/rng; }
  ctx.strokeStyle='#e3edf5';
  for(var g=0;g<=4;g++){ var yy=pt+ph*g/4; ctx.beginPath(); ctx.moveTo(pl,yy); ctx.lineTo(W-pr,yy); ctx.stroke(); }
  ctx.strokeStyle='#3a7076'; ctx.lineWidth=2; ctx.beginPath();
  pts.forEach(function(q,i){ i===0?ctx.moveTo(X(q.w),Y(q.v)):ctx.lineTo(X(q.w),Y(q.v)); });
  ctx.stroke();
  ctx.strokeStyle='#b04a33'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(X(minW),pt+ph); ctx.lineTo(X(minW),Y(minV)); ctx.lineTo(pl,Y(minV)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#b04a33'; ctx.beginPath(); ctx.arc(X(minW),Y(minV),4,0,7); ctx.fill();
  ctx.font='600 12px "Source Han Serif SC","Songti SC",serif'; ctx.textAlign='left';
  ctx.fillText('最优负债率 ≈ '+Math.round(minW*100)+'%　WACC ≈ '+(minV*100).toFixed(2)+'%', X(minW)+10, Y(minV)-8);
  ctx.strokeStyle='#cfe0ee'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pl,pt); ctx.lineTo(pl,pt+ph); ctx.lineTo(W-pr,pt+ph); ctx.stroke();
  ctx.fillStyle='#7e96a6'; ctx.font='11.5px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  [0,0.2,0.4,0.6,0.8].forEach(function(w){ ctx.fillText(Math.round(w*100)+'%', X(w), pt+ph+18); });
  ctx.fillText('负债占比 Wd', W/2, H-8);
  ctx.save(); ctx.translate(18,H/2); ctx.rotate(-Math.PI/2); ctx.fillText('WACC',0,0); ctx.restore();
}

function drawDupont(){
  var p=prep(document.getElementById('dupontTree')); if(!p) return;
  var ctx=p.ctx;
  box(ctx,320,10,160,44,'ROE 净资产收益率','最终目标','#3a7076','#3a7076','#fff');
  box(ctx,40,110,150,46,'净利率','盈利能力');
  box(ctx,250,110,140,46,'总资产周转率','营运效率');
  box(ctx,470,110,150,46,'权益乘数','财务杠杆');
  arrow(ctx,400,54,120,110,'#3a7076'); arrow(ctx,400,54,320,110,'#3a7076'); arrow(ctx,400,54,545,110,'#3a7076');
  box(ctx,20,210,100,42,'净利润','','#e3efef','#cfe0ee');
  box(ctx,130,210,100,42,'营业收入','','#e3efef','#cfe0ee');
  box(ctx,250,210,100,42,'营业收入','','#e3efef','#cfe0ee');
  box(ctx,360,210,100,42,'总资产','','#e3efef','#cfe0ee');
  box(ctx,480,210,100,42,'总资产','','#e3efef','#cfe0ee');
  box(ctx,590,210,100,42,'所有者权益','','#e3efef','#cfe0ee');
  arrow(ctx,90,156,72,210); arrow(ctx,140,156,172,210);
  arrow(ctx,300,156,300,210); arrow(ctx,340,156,400,210);
  arrow(ctx,510,156,530,210); arrow(ctx,560,156,635,210);
  ctx.fillStyle='#7e96a6'; ctx.font='11px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
  ctx.fillText('÷', 122, 200); ctx.fillText('÷', 360, 200); ctx.fillText('÷', 572, 200);
  ctx.fillStyle='#b04a33'; ctx.font='600 11.5px "Microsoft YaHei",sans-serif';
  ctx.fillText('×           ×', 400, 96);
}

function drawFor(i){
  if(i===0) drawFlow();
  if(i===2) drawEqBal();
  if(i===4) drawSubjTree();
  if(i===6) drawVoucherTree();
  if(i===7) drawCycleRing();
  if(i===10) drawCostFlow();
  if(i===13) drawBS();
  /* 注意：第 15 章插入「润叶家具」整章后，财务各章整体后移一位，
     这里的下标必须与 .chapter[data-ch] 保持一致 */
  /* 财管按教材十二章重排后：价值观念(16) 含时间价值与风险两张图，
     财务分析(17) 杜邦，资本结构(20) WACC，投资决策原理(21) NPV */
  if(i===16){ drawComp(); drawSML(); }
  if(i===17) drawDupont();
  if(i===20) drawWACC();
  if(i===21) drawNPV();
}
var _rsz;
window.addEventListener('resize', function(){
  clearTimeout(_rsz);
  _rsz=setTimeout(function(){
    var c=document.querySelector('.chapter.active');
    if(!c) return;
    c.querySelectorAll('canvas').forEach(function(cv){ cv._w=-1; });
    drawFor(CUR);
  }, 160);
});
