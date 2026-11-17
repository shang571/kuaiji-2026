/* ============================================================
 知识图谱（3D）：透视投影 + 自动旋转 + 拖拽
   依赖：与 kg2d 共用节点数据（各自持有副本）
   ============================================================ */

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
