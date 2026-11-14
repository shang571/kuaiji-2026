
(function(){
  if(window.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
  if(window.Element && !Element.prototype.closest){
    Element.prototype.closest = function(sel){
      var el=this;
      while(el && el.nodeType===1){
        var m=el.matches||el.msMatchesSelector||el.webkitMatchesSelector;
        if(m && m.call(el,sel)) return el;
        el=el.parentElement||el.parentNode;
      }
      return null;
    };
  }
})();
setTimeout(function(){
  if(!document.body.hasAttribute('data-booted')){
    var w=document.getElementById('bootWarn');
    if(w) w.style.display='block';
  }
}, 5000);


/* ====================== */


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
  if(i===16) drawComp();
  if(i===17) drawSML();
  if(i===18) drawNPV();
  if(i===19) drawWACC();
  if(i===21) drawDupont();
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



/* ====================== */


/* ============================================================
   题库：54 题（会计 28 / 财管 26）
   ============================================================ */
var BANK = [
/* ---------- 会计 ---------- */
{id:'a1',cat:'acct',type:'single',ch:0,q:'会计是以（　）作为主要计量单位。',o:['实物计量单位','劳动计量单位','货币计量单位','时间计量单位'],a:[2],e:'会计以货币为主要计量单位，这是货币计量假设的直接体现。实物、劳动量度只能作为辅助。'},
{id:'a2',cat:'acct',type:'single',ch:0,q:'下列关于会计主体的说法，正确的是（　）。',o:['会计主体与法律主体完全对等','会计主体不一定是法律主体','法律主体就是会计主体','法律主体不一定是会计主体'],a:[1],e:'会计主体是独立主体，但不一定是法律主体。分公司是会计主体而非法律主体，企业集团编制合并报表也是会计主体。'},
{id:'a3',cat:'acct',type:'single',ch:0,q:'某分公司不是独立法人，它是否可以作为会计主体？',o:['不可以，必须有法人资格','可以，会计主体不要求法人资格','只有编制合并报表时才可以','只有独立核算且具备法人资格时才可以'],a:[1],e:'会计主体解决「为谁核算」的空间范围问题，与法人资格无关。分公司独立核算，因此是会计主体。'},
{id:'a4',cat:'acct',type:'single',ch:1,q:'3 月 29 日销售产品 20 000 元，5 月 15 日收到货款存入银行。按收付实现制核算，该项收入应归属于（　）。',o:['3 月','5 月','本年','视情况而定'],a:[1],e:'收付实现制以现金是否收到为标准。5 月 15 日实际收到款项，因此收入归属 5 月；若按权责发生制则归属 3 月。'},
{id:'a5',cat:'acct',type:'single',ch:1,q:'按权责发生制，下列应确认为本月费用的是（　）。',o:['支付上月的水电费','本月负担但尚未支付的借款利息','预付下年度的保险费','购入生产设备的支出'],a:[1],e:'权责发生制看责任是否发生。本月负担的利息无论是否支付都属于本月费用；支付上月费用属于上月，预付下年属于下年，设备支出属于资本性支出。'},
{id:'a6',cat:'acct',type:'single',ch:2,q:'下列项目中，属于资产项目的是（　）。',o:['应收账款','预收账款','资本公积','实收资本'],a:[0],e:'应收账款是企业拥有的债权，属于资产；预收账款是负债；资本公积与实收资本属于所有者权益。'},
{id:'a7',cat:'acct',type:'single',ch:2,q:'所有者权益在数量上等于（　）。',o:['流动资产减去全部负债','全部资产减去流动负债','全部资产减去非流动负债','全部资产减去全部负债'],a:[3],e:'所有者权益 = 资产总额 − 负债总额，即净资产。这是会计恒等式的移项结果。'},
{id:'a8',cat:'acct',type:'single',ch:2,q:'以银行存款偿还短期借款，这笔业务会使（　）。',o:['资产一增一减','资产与负债同时增加','资产与负债同时减少','负债一增一减'],a:[2],e:'银行存款（资产）减少，短期借款（负债）减少，两边同减同额，会计等式仍平衡。'},
{id:'a9',cat:'acct',type:'single',ch:3,q:'售后回租在会计上不确认销售收入，体现的信息质量要求是（　）。',o:['可靠性','实质重于形式','谨慎性','重要性'],a:[1],e:'法律形式是「卖」，但经济实质是「融资」（风险与报酬未转移），因此按融资处理。这是实质重于形式的经典案例。'},
{id:'a10',cat:'acct',type:'single',ch:3,q:'存货期末按成本与可变现净值孰低计量，体现的是（　）。',o:['可比性','重要性','谨慎性','及时性'],a:[2],e:'不高估资产、不低估负债和费用，是谨慎性的要求。存货跌价准备正是这一原则的落地。'},
{id:'a11',cat:'acct',type:'single',ch:4,q:'会计账户与会计科目的根本区别是（　）。',o:['名称不同','反映的经济内容不同','有无格式','有无结构'],a:[3],e:'科目只是名称与分类项目，没有结构；账户有格式和结构，能记录增减变动及余额。两者反映的经济内容相同。'},
{id:'a12',cat:'acct',type:'single',ch:5,q:'资产类账户的增加额应登记在（　）。',o:['借方','贷方','任意一方','余额方向'],a:[0],e:'资产、成本、费用类账户增加记借方；负债、所有者权益、收入类账户增加记贷方。'},
{id:'a13',cat:'acct',type:'single',ch:5,q:'下列错误中，能够通过试算平衡发现的是（　）。',o:['一笔业务被漏记','借贷方向正确但科目用错','借方发生额合计比贷方多 100 元','同一笔业务被重复过账'],a:[2],e:'试算平衡只能发现借贷金额不等。漏记、重记、串户、方向颠倒等错误，借贷仍然相等，无法通过试算平衡发现。'},
{id:'a14',cat:'acct',type:'single',ch:6,q:'从银行提取现金，应编制的记账凭证是（　）。',o:['现金收款凭证','银行存款付款凭证','转账凭证','现金付款凭证'],a:[1],e:'现金与银行存款之间相互划转，只编制付款凭证，不编制收款凭证，以避免同一笔业务重复记账。'},
{id:'a15',cat:'acct',type:'single',ch:7,q:'期末编制调整分录的主要目的是（　）。',o:['更正记账错误','简化账簿登记','贯彻权责发生制，正确划分收入费用的归属期间','调整现金流量'],a:[2],e:'调整分录处理应计、预计、估计三类跨期项目，使收入费用落在正确的会计期间，是权责发生制的落地手段。'},
{id:'a16',cat:'acct',type:'single',ch:8,q:'企业接受投资者投入的机器设备，应贷记（　）。',o:['固定资产','实收资本','银行存款','盈余公积'],a:[1],e:'借：固定资产；贷：实收资本（股本）。若投入额超过注册资本份额，差额计入资本公积—资本溢价。'},
{id:'a17',cat:'acct',type:'single',ch:9,q:'一般纳税人购入材料支付的增值税进项税额，应（　）。',o:['计入材料采购成本','计入管理费用','记入「应交税费—应交增值税（进项税额）」借方','计入营业外支出'],a:[2],e:'一般纳税人进项税额可以抵扣，不计入存货成本，单独记入应交税费借方。小规模纳税人则计入成本。'},
{id:'a18',cat:'acct',type:'single',ch:9,q:'购入设备价款 50 000 元，另付安装费 3 000 元，增值税 6 500 元（可抵扣）。该设备入账价值为（　）。',o:['50 000 元','53 000 元','56 500 元','59 500 元'],a:[1],e:'入账价值 = 买价 50 000 + 安装费 3 000 = 53 000 元。可抵扣的增值税不计入固定资产成本。'},
{id:'a19',cat:'acct',type:'single',ch:10,q:'车间管理人员的工资应计入（　）。',o:['生产成本','制造费用','管理费用','销售费用'],a:[1],e:'生产工人工资计入生产成本；车间管理人员工资属于间接费用，先归集到制造费用，期末再分配计入产品成本。'},
{id:'a20',cat:'acct',type:'single',ch:10,q:'完工产品验收入库，正确的会计分录是（　）。',o:['借：生产成本　贷：库存商品','借：库存商品　贷：生产成本','借：主营业务成本　贷：库存商品','借：库存商品　贷：主营业务成本'],a:[1],e:'完工入库使库存商品增加、生产成本减少：借库存商品，贷生产成本。销售时才结转主营业务成本。'},
{id:'a21',cat:'acct',type:'single',ch:11,q:'销售商品收取的增值税销项税额，在会计处理上应（　）。',o:['计入主营业务收入','计入其他业务收入','冲减销售费用','不计入收入，确认为负债'],a:[3],e:'增值税是价外税，代收代付，不计入收入也不计入成本，贷记「应交税费—应交增值税（销项税额）」。'},
{id:'a22',cat:'acct',type:'single',ch:11,q:'下列不属于期间费用的是（　）。',o:['制造费用','管理费用','销售费用','财务费用'],a:[0],e:'制造费用属于成本类，期末分配计入产品成本；管理费用、销售费用、财务费用直接计入当期损益。'},
{id:'a23',cat:'acct',type:'single',ch:13,q:'现金流量表的编制基础是（　）。',o:['权责发生制','收付实现制','历史成本','公允价值'],a:[1],e:'现金流量表是唯一按收付实现制编制的报表，反映现金及现金等价物的实际流入流出。'},
{id:'a24',cat:'acct',type:'tf',ch:0,q:'判断：会计主体都应是法律主体。',o:['正确','错误'],a:[1],e:'错误。会计主体不一定是法律主体，分公司、企业集团都是反例。'},
{id:'a25',cat:'acct',type:'tf',ch:5,q:'判断：通过试算平衡表检查，如果借贷平衡，就说明记账没有错误。',o:['正确','错误'],a:[1],e:'错误。借贷平衡只能说明金额相等，无法发现漏记、重记、串户、方向颠倒等错误。'},
{id:'a26',cat:'acct',type:'tf',ch:9,q:'判断：制造费用属于期间费用，应直接计入当期损益。',o:['正确','错误'],a:[1],e:'错误。制造费用是成本类科目，期末分配计入产品成本，不属于期间费用。'},
{id:'a27',cat:'acct',type:'multi',ch:2,q:'下列会计要素中，反映企业财务状况的有（　）。',o:['资产','负债','收入','所有者权益','费用'],a:[0,1,3],e:'资产、负债、所有者权益反映财务状况，是资产负债表的要素；收入、费用、利润反映经营成果，是利润表的要素。'},
{id:'a28',cat:'acct',type:'multi',ch:5,q:'下列各项中，应在账户借方登记的有（　）。',o:['资产增加','成本费用增加','收入增加','负债减少','所有者权益减少'],a:[0,1,3,4],e:'借方登记资产增加、成本费用增加、负债与所有者权益减少；收入增加记贷方，所以 C 不选。'},

/* ---------- 财管 ---------- */
{id:'f1',cat:'fin',type:'single',ch:15,q:'下列财务管理目标中，最能体现资金时间价值与风险因素的是（　）。',o:['利润最大化','每股收益最大化','股东财富最大化','销售收入最大化'],a:[2],e:'股东财富最大化以股票市价衡量，既考虑当前收益，也考虑时间价值与风险；利润最大化忽视这两点。'},
{id:'f2',cat:'fin',type:'single',ch:16,q:'本金 10 000 元，年利率 10%，按复利计息 3 年后的终值最接近（　）。',o:['13 000 元','13 100 元','13 310 元','14 641 元'],a:[2],e:'FV = 10 000 × (1+10%)³ = 10 000 × 1.331 = 13 310 元。A 是单利算法，D 是 4 年的结果。'},
{id:'f3',cat:'fin',type:'single',ch:16,q:'每年年末支付 1 000 元，年利率 8%，永续年金的现值为（　）。',o:['8 000 元','12 500 元','10 000 元','无限大'],a:[1],e:'永续年金现值 = A ÷ r = 1 000 ÷ 8% = 12 500 元。虽然支付无限期，但折现后收敛于有限值。'},
{id:'f4',cat:'fin',type:'single',ch:16,q:'预付年金现值与普通年金现值的关系是（　）。',o:['二者相等','预付年金现值 = 普通年金现值 × (1+r)','预付年金现值 = 普通年金现值 ÷ (1+r)','预付年金现值 = 普通年金终值'],a:[1],e:'预付年金每期期初收付，比普通年金早一期，因此多计一期利息，乘以 (1+r)。'},
{id:'f5',cat:'fin',type:'single',ch:17,q:'某股票 β = 0.6，说明（　）。',o:['该股票没有风险','其系统性风险低于市场平均水平','其总风险一定低于市场','其收益率必然高于市场'],a:[1],e:'β 衡量系统性风险，β=0.6 表示波动幅度约为市场的 0.6 倍，属防御型；但非系统性风险仍然存在。'},
{id:'f6',cat:'fin',type:'single',ch:17,q:'无风险报酬率 4%，市场平均报酬率 9%，某股票 β = 1.2，其必要报酬率为（　）。',o:['8.0%','9.0%','10.0%','14.8%'],a:[2],e:'E(R) = 4% + 1.2 × (9%−4%) = 4% + 6% = 10%。'},
{id:'f7',cat:'fin',type:'single',ch:17,q:'衡量单项资产风险大小的绝对指标是（　）。',o:['标准差','变异系数','β 系数','期望收益率'],a:[0],e:'标准差是绝对风险指标；变异系数（标准差÷期望值）用于比较不同规模项目的相对风险；β 衡量系统性风险。'},
{id:'f8',cat:'fin',type:'single',ch:18,q:'某项目净现值恰好等于 0，说明（　）。',o:['项目亏损','项目收益率正好等于必要报酬率','项目现金流为 0','应拒绝该项目'],a:[1],e:'NPV=0 表示项目创造的回报刚好覆盖资本成本，处于盈亏平衡点，理论上可接受也可拒绝。'},
{id:'f9',cat:'fin',type:'single',ch:18,q:'两个互斥项目寿命期相同，决策应选择（　）。',o:['内含报酬率较高者','回收期较短者','净现值较大者','投资规模较小者'],a:[2],e:'寿命相同的互斥项目以 NPV 为准，因为 NPV 直接衡量股东财富的增量。IRR 在规模不同时可能误导。'},
{id:'f10',cat:'fin',type:'single',ch:18,q:'计算投资项目初始现金流量时，不应包括（　）。',o:['固定资产投资','营运资本垫支','设备安装费','项目决策前已发生的市场调研费'],a:[3],e:'决策前已发生的支出属于沉没成本，与当前决策无关，不计入增量现金流。'},
{id:'f11',cat:'fin',type:'single',ch:19,q:'债券票面利率 8%，筹资费率 0.5%，所得税率 25%，其资本成本最接近（　）。',o:['8.00%','7.50%','6.03%','5.75%'],a:[2],e:'Kd = 8% × (1−25%) ÷ (1−0.5%) = 6% ÷ 0.995 ≈ 6.03%。'},
{id:'f12',cat:'fin',type:'single',ch:19,q:'计算 WACC 时，权重最准确的口径是（　）。',o:['账面价值','市场价值','历史成本','目标结构下的账面价值'],a:[1],e:'市场价值最能反映当前真实的资本成本与融资比例；账面价值可能严重偏离实际。'},
{id:'f13',cat:'fin',type:'single',ch:19,q:'有税 MM 理论认为负债能提高企业价值，主要原因是（　）。',o:['债务成本永远最低','利息可税前扣除，产生税盾','债权人参与经营','负债没有风险'],a:[1],e:'利息在税前扣除，相当于政府承担了部分利息成本，形成税盾，从而提升企业价值。'},
{id:'f14',cat:'fin',type:'single',ch:19,q:'边际贡献 720 万元，息税前利润 370 万元，营业杠杆系数为（　）。',o:['1.21','1.95','2.36','0.51'],a:[1],e:'DOL = 边际贡献 ÷ EBIT = 720 ÷ 370 ≈ 1.95。'},
{id:'f15',cat:'fin',type:'single',ch:19,q:'EBIT 370 万元，利息 64.8 万元，财务杠杆系数为（　）。',o:['1.21','1.95','2.36','0.83'],a:[0],e:'DFL = EBIT ÷ (EBIT − I) = 370 ÷ 305.2 ≈ 1.21。'},
{id:'f16',cat:'fin',type:'single',ch:20,q:'经济订货批量（EOQ）模型的核心目标是（　）。',o:['存货数量最少','订货成本与储存成本之和最低','采购单价最低','缺货成本最低'],a:[1],e:'EOQ 使订货成本与储存成本之和最小，此时两者恰好相等。'},
{id:'f17',cat:'fin',type:'single',ch:20,q:'信用条件「2/10，n/30」的含义是（　）。',o:['10 天内付款享 2 元折扣，30 天付款','10 天内付款享 2% 折扣，30 天内全额付清','2 天内付款享 10% 折扣','30 天内付款享 2% 折扣'],a:[1],e:'2/10 表示 10 天内付款可享 2% 现金折扣；n/30 表示信用期 30 天，到期全额付款。'},
{id:'f18',cat:'fin',type:'single',ch:21,q:'杜邦分析把 ROE 分解为（　）。',o:['毛利率 × 周转率 × 负债率','净利率 × 周转率 × 权益乘数','净利率 × 毛利率 × 权益乘数','ROA × 资产负债率'],a:[1],e:'ROE = 销售净利率 × 总资产周转率 × 权益乘数，分别对应盈利能力、营运效率、财务杠杆三条路径。'},
{id:'f19',cat:'fin',type:'single',ch:21,q:'市盈率为 12 倍，意味着（　）。',o:['股价是每股净资产的 12 倍','市场愿为每 1 元利润支付 12 元','公司 12 年不分红','股息率为 12%'],a:[1],e:'PE = 每股市价 ÷ 每股收益，12 倍表示市场愿为每 1 元利润付 12 元，可理解为按当前盈利水平 12 年回本。'},
{id:'f20',cat:'fin',type:'single',ch:22,q:'可转换债券面值 1 000 元，转换价格 25 元/股，转换比率为（　）。',o:['25 股','40 股','0.025 股','1 000 股'],a:[1],e:'转换比率 = 债券面值 ÷ 转换价格 = 1 000 ÷ 25 = 40 股。'},
{id:'f21',cat:'fin',type:'single',ch:22,q:'净利润 1 000 万元，投资预算 800 万元，目标权益比重 60%，剩余股利政策下可分配股利为（　）。',o:['1 000 万元','800 万元','520 万元','480 万元'],a:[2],e:'所需权益资金 = 800 × 60% = 480 万元；可分配 = 1 000 − 480 = 520 万元。'},
{id:'f22',cat:'fin',type:'tf',ch:19,q:'判断：计算普通股资本成本时，也应像债券一样乘以 (1−所得税率)。',o:['正确','错误'],a:[1],e:'错误。股利在税后支付，不能抵税，因此普通股成本不乘 (1−T)；债券利息可税前扣除，才需要乘。'},
{id:'f23',cat:'fin',type:'tf',ch:18,q:'判断：对同一项目，IRR 与 NPV 的决策结论在任何情况下都一致。',o:['正确','错误'],a:[1],e:'错误。单一项目通常一致；但互斥项目在投资规模、寿命期或现金流时间分布不同时，两种方法可能给出相反结论，此时以 NPV 为准。'},
{id:'f24',cat:'fin',type:'tf',ch:22,q:'判断：发放股票股利会减少所有者权益总额。',o:['正确','错误'],a:[1],e:'错误。股票股利只是把未分配利润转为股本与资本公积，所有者权益总额不变，股数增加、每股收益下降。'},
{id:'f25',cat:'fin',type:'multi',ch:22,q:'下列属于普通股融资优点的有（　）。',o:['无固定股利负担','无到期日，不需偿还本金','增强公司信誉与举债能力','稀释原有股东控制权','资本成本较低'],a:[0,1,2],e:'前三项是优点；稀释控制权与资本成本高是缺点。普通股成本高于债务成本，因为股利不能抵税且股东要求风险溢价。'},
{id:'f26',cat:'fin',type:'multi',ch:19,q:'下列因素中，会影响加权平均资本成本的有（　）。',o:['债务资本成本','权益资本成本','资本结构（负债与权益比重）','所得税税率','固定资产折旧方法'],a:[0,1,2,3],e:'WACC = ΣWjKj，权重、各项资本成本、税率（通过税后债务成本）都会影响它；折旧方法影响会计利润，不直接进入 WACC。'},
{id:'a29',cat:'acct',type:'single',ch:14,q:'企业采购原材料，货款已付但货物尚在运输途中，应借记（　）。',
o:['原材料','在途物资','库存商品','主营业务成本'],a:[1],
e:'钱付了、货未到，所有权已归企业但实物未入库，先记「在途物资」；验收入库后再转入「原材料」。'},
{id:'a30',cat:'acct',type:'single',ch:14,q:'生产车间管理人员的工资应计入（　）。',
o:['生产成本','制造费用','管理费用','销售费用'],a:[1],
e:'车间管理人员不直接生产产品，其薪酬属于间接费用，先归集到「制造费用」，期末再分配计入生产成本。厂部行政人员才计入管理费用。'}
];

/* ---------- 组织行为学题库：由 chapters/ob.js 提供，追加到同一题库 ---------- */
if(window.__OB_BANK && window.__OB_BANK.length){
  BANK = BANK.concat(window.__OB_BANK);
}

/* ---------- 状态：只保存在当前页面内存中，刷新即清空 ---------- */
var BS = { filter:'all', ans:{}, wrong:[] };
function bsave(){ /* 不写入浏览器存储：做题痕迹不留存 */ }
/* 清除旧版本遗留在本机的做题记录 */
try{
  ['kj_bank_ans','kj_bank_wrong','kj_master','kj_read','kj_last'].forEach(function(k){ localStorage.removeItem(k); });
}catch(e){}
function sameSet(a,b){
  if(!a || a.length!==b.length) return false;
  var x=a.slice().sort().join(','), y=b.slice().sort().join(',');
  return x===y;
}
function typeName(t){ return t==='single'?'单选':(t==='multi'?'多选':'判断'); }
function chName(c){
  /* 组织行为学是 26 起的新章节，章号要按本科目内部重新计数 */
  var v = c >= 26 ? (c - 25) : (c + 1);
  return '第 ' + (v<10?'0':'')+v + ' 章';
}

function qCard(q, idx){
  var ans = BS.ans[q.id];
  var answered = !!ans;
  var ok = answered && sameSet(ans, q.a);
  var opts = q.o.map(function(t,i){
    var cls='qopt';
    if(answered){
      if(q.a.indexOf(i)>-1) cls+=' ok';
      else if(ans.indexOf(i)>-1) cls+=' no';
    }else if(q.type==='multi' && (q._sel||[]).indexOf(i)>-1){ cls+=' sel'; }
    return '<button type="button" class="'+cls+'" data-i="'+i+'"'+(answered?' disabled':'')+'>'
      +'<span class="oi">'+String.fromCharCode(65+i)+'</span><span>'+t+'</span></button>';
  }).join('');
  var act='';
  if(!answered && q.type==='multi'){
    act='<div class="qact"><button type="button" class="btn qsubmit" data-qid="'+q.id+'">提 交</button><span class="note">可多选，少选不得分</span></div>';
  }
  if(answered){
    act='<div class="qact"><button type="button" class="btn ghost qagain" data-qid="'+q.id+'">重 做</button><span class="note">'+(ok?'已答对':'已加入错题')+'</span></div>';
  }
  var exp='';
  if(answered){
    exp='<div class="qexp show'+(ok?'':' bad')+'"><b>'+(ok?'正 确':'错 误')+'</b>　正确答案：'+q.a.map(function(i){return String.fromCharCode(65+i);}).join('')+'<br>'+q.e+'</div>';
  }
  return '<div class="qcard" data-qid="'+q.id+'">'
    +'<div class="qmeta"><span class="qnum">'+(idx+1)+'</span><span class="tag'+(q.cat==='fin'?' fin':'')+(q.cat==='ob'?' ob':'')+'">'+(q.cat==='fin'?'财管':(q.cat==='ob'?'组织':'会计'))+'</span><span>'+chName(q.ch)+'</span><span>'+typeName(q.type)+'</span></div>'
    +'<div class="qstem">'+q.q+'</div>'
    +'<div class="qopts">'+opts+'</div>'
    +act+exp+'</div>';
}

/* ============================================================
   科目：会计与财务管理基础（0–25） / 组织行为学（26–36）
   ============================================================ */
var SUBR = { acct:[0,25], ob:[26,36] };
var SUBNAME = { acct:'会计与财务管理基础', ob:'组织行为学' };
var QUIZ_CH = 24;          /* 两个科目共用同一个题库章，靠 SUB 过滤 */
var SUB = null;            /* null = 还没选科目 */

function subOfCh(ch){ return ch >= 26 ? 'ob' : 'acct'; }
function inSub(ch){ return !SUB || subOfCh(ch) === SUB; }

function filtered(){
  return BANK.filter(function(q){
    if(!inSub(q.ch)) return false;
    if(BS.filter==='all') return true;
    if(BS.filter==='acct'||BS.filter==='fin'||BS.filter==='ob') return q.cat===BS.filter;
    if(BS.filter==='single'||BS.filter==='multi'||BS.filter==='tf') return q.type===BS.filter;
    if(BS.filter==='wrong') return BS.wrong.indexOf(q.id)>-1;
    return true;
  });
}
function bankStats(){
  var pool = BANK.filter(function(q){ return inSub(q.ch); });
  var done=0,right=0;
  pool.forEach(function(q){
    if(BS.ans[q.id]){
      done++;
      if(sameSet(BS.ans[q.id],q.a)) right++;
    }
  });
  var rate = done ? Math.round(right/done*100)+'%' : '—';
  var el=function(id){return document.getElementById(id);};
  if(el('bDone')) el('bDone').textContent=done;
  if(el('bTotal')) el('bTotal').textContent=pool.length;
  if(el('bRight')) el('bRight').textContent=right;
  if(el('bRate')) el('bRate').textContent=rate;
  if(el('cAll')) el('cAll').textContent=pool.length;
  if(el('cAcct')) el('cAcct').textContent=pool.filter(function(q){return q.cat==='acct';}).length;
  if(el('cFin')) el('cFin').textContent=pool.filter(function(q){return q.cat==='fin';}).length;
  if(el('cWrong')) el('cWrong').textContent=BS.wrong.length;
  if(el('bFoot')) el('bFoot').textContent=pool.length;
  var jn=el('quizJumpN'); if(jn) jn.textContent = pool.length ? pool.length+' 题' : '—';
}
function renderBank(){
  var list=document.getElementById('bankList'); if(!list) return;
  var arr=filtered();
  if(!arr.length){
    list.innerHTML='<div class="bank-empty">这个筛选下还没有题目。做错的题会自动出现在「错题」里。</div>';
  }else{
    /* 编号按当前筛选重新计数，避免切科目后从 57 起跳 */
    list.innerHTML=arr.map(function(q,i){ return qCard(q, i); }).join('');
  }
  bankStats();
}
function answerQ(qid, arr){
  var q=BANK.filter(function(x){return x.id===qid;})[0]; if(!q) return;
  var ok=sameSet(arr,q.a);
  BS.ans[qid]=arr.slice().sort();
  var wi=BS.wrong.indexOf(qid);
  if(!ok && wi<0) BS.wrong.push(qid);
  if(ok && wi>-1) BS.wrong.splice(wi,1);
  bsave();
  var old=document.querySelector('.qcard[data-qid="'+qid+'"]');
  if(old){
    var i=BANK.indexOf(q);
    old.outerHTML=qCard(q,i);
  }
  bankStats();
  toast(ok?'答对了':'已记入错题');
}
document.addEventListener('click', function(e){
  var opt=e.target.closest('.qopt');
  if(opt && !opt.disabled){
    var card=opt.closest('.qcard'); if(!card) return;
    var qid=card.getAttribute('data-qid');
    var q=BANK.filter(function(x){return x.id===qid;})[0]; if(!q) return;
    var i=+opt.getAttribute('data-i');
    if(q.type==='multi'){
      q._sel=q._sel||[];
      var p=q._sel.indexOf(i);
      if(p>-1) q._sel.splice(p,1); else q._sel.push(i);
      opt.classList.toggle('sel');
    }else{
      answerQ(qid,[i]);
    }
  }
  var sub=e.target.closest('.qsubmit');
  if(sub){
    var qid2=sub.getAttribute('data-qid');
    var q2=BANK.filter(function(x){return x.id===qid2;})[0];
    if(q2 && q2._sel && q2._sel.length) answerQ(qid2,q2._sel);
    else toast('请先选择答案');
  }
  var again=e.target.closest('.qagain');
  if(again){
    var qid3=again.getAttribute('data-qid');
    delete BS.ans[qid3];
    var q3=BANK.filter(function(x){return x.id===qid3;})[0];
    if(q3) q3._sel=[];
    bsave();
    var old3=document.querySelector('.qcard[data-qid="'+qid3+'"]');
    if(old3) old3.outerHTML=qCard(q3, BANK.indexOf(q3));
    bankStats();
  }
});
document.addEventListener('click', function(e){
  var chip=e.target.closest('#bankChips .chip');
  if(!chip) return;
  document.querySelectorAll('#bankChips .chip').forEach(function(c){c.classList.remove('active');});
  chip.classList.add('active');
  BS.filter=chip.getAttribute('data-f');
  renderBank();
});
document.addEventListener('click', function(e){
  if(e.target.id==='resetBank'){
    // 题库作答与错题
    BS.ans={}; BS.wrong=[]; BS.filter='all';
    BANK.forEach(function(q){ delete q._sel; });
    document.querySelectorAll('#bankChips .chip').forEach(function(c){c.classList.toggle('active', c.getAttribute('data-f')==='all');});
    renderBank();
    // 随堂小测
    document.querySelectorAll('.quiz').forEach(function(q){
      delete q.dataset.answered;
      q.querySelectorAll('.opt').forEach(function(o){ o.classList.remove('ok','no'); o.style.pointerEvents=''; });
      var fb=q.querySelector('.qfb'); if(fb){ fb.className='qfb'; fb.innerHTML=''; }
      var foot=q.querySelector('.quiz-foot'); if(foot) foot.remove();
    });
    // 简答背诵勾选
    if(typeof MASTER!=='undefined') MASTER.length=0;
    document.querySelectorAll('[data-master]').forEach(function(cb){ cb.checked=false; });
    toast('已清空本次做题痕迹');
  }
});



/* ====================== */


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
  /* 组织行为学按本科目内部重新编号，避免顶栏出现「第 27 章」 */
  var shown = (SUB==='ob' && i>=26) ? (i-25) : (i+1);
  if(cn) cn.textContent = pad2(shown);
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
/* ============================================================
   科目选择：入口分流（刷题 / 知识点复习）
   ============================================================ */
function applySubject(sub){
  SUB = sub;
  var cl = document.body.className.replace(/\bsub-(acct|ob)\b/g,'').replace(/\s+/g,' ').trim();
  document.body.className = cl + (sub ? ' sub-' + sub : '');

  /* 导航按科目过滤 */
  var items = document.querySelectorAll('.nav-item');
  Array.prototype.forEach.call(items, function(it){
    it.style.display = (subOfCh(+it.getAttribute('data-ch')) === sub) ? '' : 'none';
  });
  var groups = document.querySelectorAll('.nav-group');
  Array.prototype.forEach.call(groups, function(g){
    var n = g.nextElementSibling, any = false;
    while(n && !n.classList.contains('nav-group')){
      if(n.classList.contains('nav-item') && n.style.display !== 'none') any = true;
      n = n.nextElementSibling;
    }
    g.style.display = any ? '' : 'none';
  });

  /* 题库章文案跟着科目走 */
  var qc = document.querySelector('.chapter[data-ch="24"] .desc');
  if(qc) qc.textContent = sub === 'ob'
    ? '组织行为学 · 逐章自测 · 即时判分 · 自动收集错题'
    : '会计 + 财管交叉自测 · 即时判分 · 解析 · 自动收集错题';

  /* 侧栏标题 */
  var t = document.getElementById('sbSubject');
  if(t) t.textContent = sub === 'ob' ? '马工程教材 · 学习台' : '会计与财务管理基础 · 学习台';
  var h = document.querySelector('.sb-head h1');
  if(h) h.textContent = sub === 'ob' ? '组织行为学' : '基础会计学';

  /* 题库筛选回到「全部」，并按新科目重算 */
  BS.filter = 'all';
  var chips = document.querySelectorAll('#bankChips .chip');
  Array.prototype.forEach.call(chips, function(c){ c.classList.toggle('active', c.getAttribute('data-f')==='all'); });
  renderBank();
  buildIndex();
}

function showPicker(){
  var el = document.getElementById('subjPick');
  if(!el) return;
  el.style.display = 'flex';
  el.classList.remove('is-gone');
}

function pickSubject(sub, mode){
  applySubject(sub);
  var el = document.getElementById('subjPick');
  if(el){
    el.classList.add('is-gone');
    setTimeout(function(){ el.style.display = 'none'; }, 340);
  }
  if(mode === 'quiz') go(QUIZ_CH, {noScroll:true});
  else go(SUBR[sub][0], {noScroll:true});
  window.scrollTo(0,0);
}

document.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('[data-subj]') : null;
  if(btn){
    pickSubject(btn.getAttribute('data-subj'), btn.getAttribute('data-mode'));
    return;
  }
  var sw = e.target.closest ? e.target.closest('#subjSwitch') : null;
  if(sw){ showPicker(); return; }
  var qj = e.target.closest ? e.target.closest('#quizJump') : null;
  if(qj){ if(!SUB) applySubject('acct'); go(QUIZ_CH, {noScroll:true}); }
});

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
(function init(){
  wrapChartCanvas();
  var secs = document.querySelectorAll('.chapter');
  TOTAL = secs.length;
  TITLES = Array.prototype.map.call(secs, function(s){
    var h=s.querySelector('h2'); return h?h.textContent.trim():'';
  });
  buildIndex();
  renderFx('');
  renderBank();

  var start = 0, hasHash = false;
  var m = (location.hash||'').match(/ch-(\d+)/);
  if(m){ start = parseInt(m[1],10)-1; hasHash = true; applySubject(subOfCh(start)); }
  else start = 0;
  if(!(start>=0 && start<TOTAL)) start=0;
  go(start, {noScroll:true});
  window.scrollTo(0,0);
  /* 没有指定章节时先让用户选科目与学法 */
  if(!hasHash) showPicker();
  document.body.setAttribute('data-booted','1');
})();



/* ====================== */


/* ============================================================
   知识点网络：95 个知识点 · 五卷聚类 · 可缩放/筛选/跳章
   ============================================================ */
(function(){
  var GROUPS = [
    {name:'卷一 · 总论', color:'#336f92'},
    {name:'卷二 · 核算方法', color:'#4f8aab'},
    {name:'卷三 · 业务核算', color:'#3a7076'},
    {name:'卷四 · 财务报告', color:'#8d7a4c'},
    {name:'卷五 · 财务管理', color:'#5f6f9a'}
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
    {id:'risk', n:'风险与收益', g:4, ch:17, d:'高风险要求高回报，风险分系统性与非系统性。'},
    {id:'beta', n:'β系数', g:4, ch:17, en:'Beta Coefficient', d:'贝塔系数：衡量系统性风险，市场组合 β = 1。'},
    {id:'capm', n:'CAPM', g:4, ch:17, en:'Capital Asset Pricing Model', d:'资本资产定价模型：E(R) = Rf + β(Rm − Rf)，给风险定价。'},
    {id:'budget', n:'资本预算', g:4, ch:18, d:'用 NPV、IRR、回收期评价长期投资项目。'},
    {id:'npv', n:'NPV', g:4, ch:18, en:'Net Present Value', d:'净现值：未来现金流现值减初始投资，大于 0 才创造价值。'},
    {id:'irr', n:'IRR', g:4, ch:18, en:'Internal Rate of Return', d:'内含报酬率：使 NPV 为零的折现率，高于资本成本可行。'},
    {id:'sunk', n:'沉没成本', g:4, ch:18, d:'已发生且不可收回，不进入决策的增量现金流。'},
    {id:'costcap', n:'资本成本', g:4, ch:19, d:'投资者要求的最低报酬率，也是项目的折现率。'},
    {id:'wacc', n:'WACC', g:4, ch:19, en:'Weighted Average Cost of Capital', d:'加权平均资本成本：各类资本成本按权重加权，是投资门槛。'},
    {id:'mm', n:'MM理论', g:4, ch:19, en:'Modigliani-Miller Theorem', d:'MM 定理：有税时负债的税盾提升企业价值。'},
    {id:'dol', n:'经营杠杆', g:4, ch:19, d:'边际贡献 ÷ EBIT，衡量经营风险。'},
    {id:'dfl', n:'财务杠杆', g:4, ch:19, d:'EBIT ÷ (EBIT − I)，衡量财务风险。'},
    {id:'wc', n:'营运资本', g:4, ch:20, d:'流动资产减流动负债，反映短期偿债与周转。'},
    {id:'eoq', n:'EOQ', g:4, ch:20, en:'Economic Order Quantity', d:'经济订货批量：使订货成本与储存成本之和最低的订货批量。'},
    {id:'credit', n:'信用政策', g:4, ch:20, d:'信用标准、信用条件与收账政策的组合。'},
    {id:'ratio', n:'财务比率', g:4, ch:21, d:'偿债、营运、盈利、市价四类比率。'},
    {id:'dupont', n:'杜邦分析', g:4, ch:21, d:'ROE = 净利率 × 总资产周转率 × 权益乘数。'},
    {id:'common', n:'普通股', g:4, ch:22, d:'永久资本，无固定股利，会稀释控制权。'},
    {id:'bond', n:'债券', g:4, ch:22, d:'有期限、固定利息，利息可抵税。'},
    {id:'convert', n:'可转换债券', g:4, ch:22, d:'纯债 + 看涨期权，票面利率低，转股稀释股权。'},
    {id:'lease', n:'融资租赁', g:4, ch:22, d:'融资与融物结合，租金含设备价款、利息与手续费。'},
    {id:'dividend', n:'股利政策', g:4, ch:22, d:'剩余股利、固定股利、固定支付率、低正常加额外。'},
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
        +'<div class="kg-dsec">五卷分布</div><div class="kg-legend">'+legend+'</div>';
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



/* ====================== */


/* ============================================================
   3D 知识图谱：透视投影 + 自动旋转 + 轨道/节点拖拽
   ============================================================ */
(function(){
  var cv, ctx, overlay, stage, built=false, active=false, raf=0;
  var nodes=[], edges=[], groups=[], byId={};
  var cam={yaw:0.55, pitch:-0.22, zoom:2.9};
  var auto=true, resumeAt=0, hover=null, sel=null;
  var orbit=null, ndrag=null, moved=false, suppress=false, target=null;
  var vel={yaw:0,pitch:0}, STARS=null;
  var R=350, CW=0, CH=0, DPR=1, CAMB=null;

  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }

  function layout3(){
    // 五簇分居立体空间，节点在椭球体积内散开（非球面）
    var C=[[-320,110,-130],[300,150,-150],[0,-50,60],[330,-110,190],[-300,-130,170]];
    var RX=455, RY=320, RZ=365;
    nodes.forEach(function(n){
      var c=C[n.g];
      var vx=c[0]+gauss()*112, vy=c[1]+gauss()*98, vz=c[2]+gauss()*112;
      var q=Math.sqrt((vx*vx)/(RX*RX)+(vy*vy)/(RY*RY)+(vz*vz)/(RZ*RZ));
      if(q>1){ vx/=q; vy/=q; vz/=q; }
      n.x3=vx; n.y3=vy; n.z3=vz;
    });
  }

  function gauss(){
    var u=0,v=0;
    while(u===0) u=Math.random();
    while(v===0) v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  function resize(){
    if(!cv) return;
    DPR=Math.min(window.devicePixelRatio||1,2);
    CW=stage.clientWidth; CH=stage.clientHeight;
    cv.width=Math.round(CW*DPR); cv.height=Math.round(CH*DPR);
  }

  function project(){
    var cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw);
    var cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
    var fov=760, dist=1040, zoom=cam.zoom;
    var cx=CW/2, cy0=CH/2;
    CAMB={cy:cy, sy:sy, cp:cp, sp:sp, fov:fov, dist:dist, zoom:zoom, cx:cx, cy0:cy0};
    var arr=[];
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i];
      var x1=n.x3*cy - n.z3*sy;
      var z1=n.x3*sy + n.z3*cy;
      var y1=n.y3*cp - z1*sp;
      var z2=n.y3*sp + z1*cp;
      var p=fov/(fov+dist+z2)*zoom;
      n._sx=cx + x1*p;
      n._sy=cy0 - y1*p;
      n._p=p;
      n._z=z2;
      arr.push(n);
    }
    arr.sort(function(a,b){ return a._p-b._p; });  // 远的先画（p 小则远）
    return arr;
  }

  function state(){
    var K=window.__KG;
    return K && K.state ? K.state() : {filter:null,query:'',sel:null};
  }

  function focusSet(id){
    if(!id) return null;
    var set={}, q=[id], depth={};
    depth[id]=0; set[id]=1;
    while(q.length){
      var cur=q.shift(), d=depth[cur];
      if(d>=2) continue;
      var rel=(byId[cur]&&byId[cur].rel)||[];
      for(var i=0;i<rel.length;i++){
        if(!set[rel[i]]){ set[rel[i]]=1; depth[rel[i]]=d+1; q.push(rel[i]); }
      }
    }
    return set;
  }

  function projPoint(x,y,z){
    var c=CAMB;
    var x1=x*c.cy - z*c.sy;
    var z1=x*c.sy + z*c.cy;
    var y1=y*c.cp - z1*c.sp;
    var z2=y*c.sp + z1*c.cp;
    var p=c.fov/(c.fov+c.dist+z2)*c.zoom;
    return {x:c.cx + x1*p, y:c.cy0 - y1*p, p:p, z:z2};
  }

  function makeStars(){
    STARS=[];
    for(var i=0;i<230;i++){
      var u=Math.random()*2-1, th=Math.random()*Math.PI*2, r=620+Math.random()*560;
      var sq=Math.sqrt(1-u*u);
      STARS.push({x:r*sq*Math.cos(th), y:r*u, z:r*sq*Math.sin(th), r:0.7+Math.random()*1.3});
    }
  }

  function drawRing(plane, rad, alpha){
    ctx.beginPath();
    for(var i=0;i<=72;i++){
      var a=i/72*Math.PI*2, x=0,y=0,z=0;
      if(plane==='xz'){ x=Math.cos(a)*rad; z=Math.sin(a)*rad; }
      else { x=Math.cos(a)*rad; y=Math.sin(a)*rad; }
      var p=projPoint(x,y,z);
      if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
    }
    ctx.strokeStyle='rgba(51,111,146,'+alpha+')';
    ctx.lineWidth=1; ctx.stroke();
  }

  function draw(){
    if(!active) return;
    if(cv.clientWidth!==CW || cv.clientHeight!==CH) resize();
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,CW,CH);
    var vg=ctx.createRadialGradient(CW/2,CH/2,60,CW/2,CH/2,Math.max(CW,CH)*0.62);
    vg.addColorStop(0,'rgba(255,255,255,0)');
    vg.addColorStop(1,'rgba(51,111,146,0.06)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,CW,CH);

    var st=state();
    var fs=focusSet(st.sel);
    var list=project();
    var i, n, e, a, b;

    if(!STARS) makeStars();
    for(i=0;i<STARS.length;i++){
      var sp=projPoint(STARS[i].x, STARS[i].y, STARS[i].z);
      var sa=clamp((sp.p-0.5)*0.55,0.05,0.55);
      ctx.fillStyle='rgba(51,111,146,'+sa.toFixed(3)+')';
      ctx.beginPath(); ctx.arc(sp.x,sp.y,STARS[i].r*sp.p,0,6.2832); ctx.fill();
    }
    drawRing('xz', 470, 0.09);
    drawRing('xy', 440, 0.055);

    // 边
    for(i=0;i<edges.length;i++){
      e=edges[i]; a=byId[e[0]]; b=byId[e[1]];
      if(!a||!b) continue;
      var dimEdge=false;
      if(fs && !(fs[e[0]]&&fs[e[1]])) dimEdge=true;
      if(st.filter!==null && (a.g!==st.filter || b.g!==st.filter)) dimEdge=true;
      var isOn = st.sel && (e[0]===st.sel || e[1]===st.sel);
      var alpha=0.09+0.22*clamp((a._p+b._p)/2-0.6,0,1);
      if(dimEdge) alpha*=0.25;
      if(isOn) alpha=0.62;
      var cross = a.g!==b.g;
      if(cross && !isOn) alpha*=0.45;
      ctx.strokeStyle = isOn ? 'rgba(176,74,51,'+alpha+')' : 'rgba(51,111,146,'+alpha+')';
      ctx.lineWidth = isOn ? 1.5 : (cross ? 0.65 : 1.0);
      ctx.beginPath(); ctx.moveTo(a._sx,a._sy); ctx.lineTo(b._sx,b._sy); ctx.stroke();
    }

    // 节点
    var placed=[];
    for(i=0;i<list.length;i++){
      n=list[i];
      if(st.filter!==null && n.g!==st.filter && n.id!==st.sel) continue;
      var r=(5.4+Math.min(n.deg,8)*0.72)*Math.pow(n._p,1.2)*0.92;
      if(r<1.4) r=1.4;
      var dim=false;
      if(fs && !fs[n.id]) dim=true;
      if(st.query){
        var q=st.query.toLowerCase();
        if((n.n+' '+n.d).toLowerCase().indexOf(q)<0) dim=true;
      }
      var alphaN=clamp(0.10+(n._p-0.7)*1.35,0.10,1);
      if(dim) alphaN*=0.18;
      if(n._z>110) alphaN*=0.55;
      var isSel = n.id===st.sel;
      var isHover = n.id===hover;
      var col=groups[n.g].color;

      ctx.globalAlpha=alphaN;
      ctx.beginPath(); ctx.arc(n._sx,n._sy,r,0,6.2832);
      ctx.fillStyle = isSel ? '#b04a33' : '#fbfdff';
      ctx.fill();
      ctx.lineWidth = (isSel||isHover) ? 2 : 1.25;
      ctx.strokeStyle = (isSel||isHover) ? '#b04a33' : col;
      ctx.stroke();

      // 标签
      var showLabel = (isSel || isHover || (fs && fs[n.id]) || (n.deg>=4 && n._p>0.9));
      if(showLabel && !dim && n._p>0.62){
        var fsz=clamp(10.5*n._p,8,14);
        ctx.font='600 '+fsz.toFixed(1)+'px "Songti SC",SimSun,serif';
        var tw=ctx.measureText(n.n).width;
        var lx=n._sx, ly=n._sy+r+fsz+2;
        var box={x:lx-tw/2-2,y:ly-fsz,w:tw+4,h:fsz+3};
        var hit=false;
        for(var k=0;k<placed.length;k++){
          var pb=placed[k];
          if(!(box.x+box.w<pb.x||box.x>pb.x+pb.w||box.y+box.h<pb.y||box.y>pb.y+pb.h)){ hit=true; break; }
        }
        if(!hit || isSel || isHover){
          placed.push(box);
          ctx.lineWidth=3.2; ctx.strokeStyle='rgba(244,240,230,0.95)';
          ctx.strokeText(n.n, lx, ly);
          ctx.fillStyle = isSel ? '#b04a33' : '#41545f';
          ctx.fillText(n.n, lx, ly);
        }
      }
      ctx.globalAlpha=1;
    }

    // 悬浮环
    if(hover && byId[hover]){
      var hn=byId[hover];
      ctx.beginPath(); ctx.arc(hn._sx,hn._sy,(5.4+Math.min(hn.deg,8)*0.72)*hn._p+4,0,6.2832);
      ctx.strokeStyle='rgba(176,74,51,.5)'; ctx.lineWidth=1; ctx.stroke();
    }
  }

  function loop(t){
    if(!active) return;
    if(!orbit && !ndrag){
      cam.yaw += vel.yaw;
      cam.pitch = clamp(cam.pitch + vel.pitch, -1.45, 1.45);
      vel.yaw *= 0.94; vel.pitch *= 0.94;
      if(Math.abs(vel.yaw)<0.0002) vel.yaw=0;
      if(Math.abs(vel.pitch)<0.0002) vel.pitch=0;
    }
    if(target){
      cam.yaw += (target.yaw-cam.yaw)*0.14;
      cam.pitch += (target.pitch-cam.pitch)*0.14;
      if(Math.abs(target.yaw-cam.yaw)<0.004 && Math.abs(target.pitch-cam.pitch)<0.004){
        cam.yaw=target.yaw; cam.pitch=target.pitch; target=null;
      }
    } else if(auto && !orbit && !ndrag && t>resumeAt && Math.abs(vel.yaw)<0.002){
      cam.yaw += 0.0028;
    }
    draw();
    raf=requestAnimationFrame(loop);
  }

  function focusNode(id){
    var n=byId[id]; if(!n) return;
    var ty=Math.atan2(n.x3, n.z3);
    var tp=Math.atan2(n.y3, Math.sqrt(n.x3*n.x3+n.z3*n.z3));
    while(ty-cam.yaw>Math.PI) ty-=Math.PI*2;
    while(ty-cam.yaw<-Math.PI) ty+=Math.PI*2;
    target={yaw:ty, pitch:clamp(tp,-0.9,0.9)};
    resumeAt=performance.now()+2500;
  }

  function pick(mx,my){
    var best=null, bestP=-1;
    nodes.forEach(function(n){
      if(n._sx===undefined) return;
      var r=(5.4+Math.min(n.deg,8)*0.72)*n._p*0.95+5;
      var dx=n._sx-mx, dy=n._sy-my;
      if(dx*dx+dy*dy<=r*r && n._p>bestP){ best=n; bestP=n._p; }
    });
    return best;
  }

  function local(e){
    var r=cv.getBoundingClientRect();
    return {x:e.clientX-r.left, y:e.clientY-r.top};
  }

  function nodeDelta(dx,dy,p){
    var cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw);
    var cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
    // 屏幕右方向 / 上方向在世界坐标中的基向量
    var rx=cy, rz=-sy;
    var ux=-sp*sy, uy=cp, uz=-sp*cy;
    var s=1/Math.max(0.15,p);
    return {
      x:(rx*dx + ux*(-dy))*s,
      y:(uy*(-dy))*s,
      z:(rz*dx + uz*(-dy))*s
    };
  }

  function bind(){
    cv.addEventListener('pointerdown', function(e){
      var pt=local(e), n=pick(pt.x,pt.y);
      resumeAt=1e15;
      if(n){
        ndrag={id:n.id, x:n.x3, y:n.y3, z:n.z3, lx:pt.x, ly:pt.y, p:n._p};
        moved=false;
        cv.setPointerCapture(e.pointerId);
      }else{
        orbit={x:pt.x, y:pt.y, vx:0, vy:0};
        vel.yaw=0; vel.pitch=0;
        cv.setPointerCapture(e.pointerId);
      }
    });
    cv.addEventListener('pointermove', function(e){
      var pt=local(e);
      if(ndrag){
        var n2=byId[ndrag.id];
        var d=nodeDelta(pt.x-ndrag.lx, pt.y-ndrag.ly, ndrag.p);
        n2.x3+=d.x; n2.y3+=d.y; n2.z3+=d.z;
        ndrag.lx=pt.x; ndrag.ly=pt.y; ndrag.p=n2._p;
        moved=true;
        return;
      }
      if(orbit){
        var dx=pt.x-orbit.x, dy=pt.y-orbit.y;
        cam.yaw += dx*0.0062;
        cam.pitch = clamp(cam.pitch + dy*0.0062, -1.45, 1.45);
        orbit.vx=dx; orbit.vy=dy;
        orbit.x=pt.x; orbit.y=pt.y;
        return;
      }
      var h=pick(pt.x,pt.y);
      hover=h?h.id:null;
      cv.style.cursor = h?'pointer':'grab';
    });
    function end(e){
      if(ndrag){
        if(moved && window.__KG){ suppress=true; window.__KG.select(ndrag.id); }
        ndrag=null;
      }
      if(orbit){ vel.yaw=clamp(orbit.vx*0.0013,-0.09,0.09); vel.pitch=clamp(orbit.vy*0.0013,-0.07,0.07); orbit=null; }
      resumeAt=performance.now()+3500;
    }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', function(e){
      e.preventDefault();
      cam.zoom=clamp(cam.zoom*(e.deltaY<0?1.1:0.91),0.9,5);
    }, {passive:false});
    cv.addEventListener('click', function(e){
      if(suppress){ suppress=false; return; }
      var pt=local(e), n=pick(pt.x,pt.y);
      if(window.__KG) window.__KG.select(n?n.id:null);
    });
    document.querySelectorAll('[data-k3]').forEach(function(b){
      b.addEventListener('click', function(){
        var z=b.getAttribute('data-k3');
        if(z==='rot'){ auto=!auto; b.textContent=auto?'⏸':'▶'; b.title=auto?'暂停旋转':'继续旋转'; return; }
        if(z==='in'){ cam.zoom=clamp(cam.zoom*1.15,0.9,5); return; }
        if(z==='out'){ cam.zoom=clamp(cam.zoom*0.87,0.9,5); return; }
        if(z==='reset'){ cam.yaw=0.55; cam.pitch=-0.22; cam.zoom=2.9; return; }
        if(z==='relayout'){ layout3(); return; }
      });
    });
  }

  function activate(){
    overlay=document.getElementById('kgOverlay');
    stage=document.getElementById('kgStage');
    cv=document.getElementById('kg3d');
    ctx=cv.getContext('2d');
    if(!built){
      var K=window.__KG;
      nodes=K.NODES; edges=K.EDGES; groups=K.GROUPS; byId=K.MAP;
      layout3(); bind(); built=true;
    }
    active=true;
    resize();
    if(!raf) raf=requestAnimationFrame(loop);
  }
  function deactivate(){
    active=false;
    if(raf){ cancelAnimationFrame(raf); raf=0; }
  }

  var modeBtn=document.getElementById('kgMode');
  function setMode(m){
    var ov=document.getElementById('kgOverlay');
    ov.classList.toggle('mode3', m==='3d');
    var sub=ov.querySelector('.kg-sub');
    if(sub) sub.textContent = (m==='3d')
      ? '95 个知识点 · 3D 立体图谱 · 拖拽旋转 / 点击查看'
      : '95 个知识点 · 圆形知识地图 · 点击节点查看关系';
    if(modeBtn) modeBtn.textContent = (m==='3d') ? '2D 图谱' : '3D 图谱';
    if(m==='3d'){ activate(); }
    else {
      deactivate();
      if(window.__KG && window.__KG.refit) window.__KG.refit();
    }
  }
  if(modeBtn) modeBtn.addEventListener('click', function(){
    setMode(document.getElementById('kgOverlay').classList.contains('mode3') ? '2d' : '3d');
  });

  if(window.__KG && window.__KG.select){
    var _sel=window.__KG.select;
    window.__KG.select=function(id){
      _sel(id);
      if(id && active) focusNode(id);
    };
  }

  window.__KG3D={
    setMode:setMode,
    activate:activate,
    deactivate:deactivate,
    relayout:function(){ if(built) layout3(); },
    reset:function(){ cam.yaw=0.55; cam.pitch=-0.22; cam.zoom=2.9; },
    zoom:function(f){ cam.zoom=clamp(cam.zoom*f,0.9,5); },
    active:function(){ return active; }
  };
})();

