function showTime() {
	document.getElementById('currentTime').innerHTML = new Date().toUTCString();
}
showTime();
setInterval(function () {
	showTime();
}, 1000);
function scrollLeft() {
  const row = document.getElementById('iconRow');
  console.log('scrollLeft before:', row.scrollLeft);
  row.scrollBy({ left: -100, behavior: 'smooth' });
}

function scrollRight() {
  const row = document.getElementById('iconRow');
  console.log('scrollLeft before:', row.scrollLeft);
  row.scrollBy({ left: 100, behavior: 'smooth' });
}

