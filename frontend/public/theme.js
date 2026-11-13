(function () {
  var t = 'night';
  try { var s = localStorage.getItem('tolie-theme'); if (s === 'day' || s === 'night') t = s; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
})();
