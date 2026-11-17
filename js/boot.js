/* ============================================================
 启动：章节挂载完成后初始化一次
   必须最后加载（依赖 charts / bank / nav 里的函数）
   ============================================================ */

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

  var start = 0;
  var m = (location.hash||'').match(/ch-(\d+)/);
  if(m) start = parseInt(m[1],10)-1;
  else start = 0;
  if(!(start>=0 && start<TOTAL)) start=0;
  go(start, {noScroll:true});
  window.scrollTo(0,0);
  document.body.setAttribute('data-booted','1');
})();
