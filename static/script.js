// 页脚年份：同时兼容首页 #year 与文章页 .yr
(function () {
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if (el) el.textContent = y;
  document.querySelectorAll('.yr').forEach(function (n) { n.textContent = y; });
})();
