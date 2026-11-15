const $ = (id) => document.getElementById(id);

// Buscador: consultas y direcciones web
$('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('query').value.trim();
  if (!q) return $('query').focus();
  const isUrl = /^(https?:\/\/|www\.)/i.test(q) || /^[\w-]+\.[a-z]{2,}(\/.*)?$/i.test(q);
  const engines = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    duck: 'https://duckduckgo.com/?q='
  };
  const url = isUrl
    ? (q.startsWith('http') ? q : 'https://' + q)
    : engines[$('engine').value] + encodeURIComponent(q);
  window.open(url, '_blank', 'noopener');
});

// Calendario mensual
let monthDate = new Date();
function drawCalendar() {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const now = new Date();
  $('month').textContent = new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric' }).format(monthDate);
  const grid = $('calGrid');
  grid.replaceChildren();
  ['D','L','M','M','J','V','S'].forEach(day => {
    const cell = document.createElement('span');
    cell.className = 'weekday'; cell.textContent = day; grid.append(cell);
  });
  for (let i = 0; i < first; i++) grid.append(document.createElement('span'));
  for (let d = 1; d <= days; d++) {
    const cell = document.createElement('span');
    cell.textContent = d;
    if (y === now.getFullYear() && m === now.getMonth() && d === now.getDate()) cell.className = 'today';
    grid.append(cell);
  }
  $('today').textContent = 'Hoy: ' + now.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
}
drawCalendar();
$('prev').addEventListener('click', () => { monthDate.setMonth(monthDate.getMonth() - 1); drawCalendar(); });
$('next').addEventListener('click', () => { monthDate.setMonth(monthDate.getMonth() + 1); drawCalendar(); });

// Clima actual de Cajamarca
async function weather() {
  $('weatherStatus').textContent = 'Actualizando...';
  try {
    const geo = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=Cajamarca&count=1&language=es&format=json');
    const places = await geo.json();
    if (!places.results || !places.results.length) throw new Error('Lugar no encontrado');
    const place = places.results[0];
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      timezone: 'auto'
    });
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current;
    const conditions = {
      0:['Despejado','☀'], 1:['Mayormente despejado','🌤'], 2:['Parcialmente nublado','⛅'],
      3:['Nublado','☁'], 45:['Niebla','🌫'], 51:['Llovizna','🌦'],
      61:['Lluvia ligera','🌦'], 63:['Lluvia','🌧'], 65:['Lluvia intensa','🌧'],
      80:['Chubascos','🌦'], 95:['Tormenta','⛈']
    };
    const condition = conditions[current.weather_code] || ['Variable','☁'];
    $('weatherIcon').textContent = condition[1];
    $('temp').textContent = Math.round(current.temperature_2m) + '°';
    $('weatherText').textContent = condition[0];
    $('humidity').textContent = current.relative_humidity_2m + '%';
    $('wind').textContent = Math.round(current.wind_speed_10m) + ' km/h';
    $('weatherStatus').textContent = 'Actualizado: ' + new Date(current.time).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }) + ' · Open-Meteo';
  } catch (error) {
    $('weatherText').textContent = 'No disponible';
    $('weatherStatus').textContent = 'No se pudo cargar. Comprueba tu conexión y vuelve a intentar.';
  }
}
$('refreshWeather').addEventListener('click', weather);
weather();

// Accesos rápidos personalizados
function addApp(name, url, persist = true) {
  const link = document.createElement('a');
  link.className = 'app'; link.href = url; link.target = '_blank'; link.rel = 'noopener';
  const icon = document.createElement('i'); icon.textContent = name.charAt(0).toUpperCase();
  link.append(icon, document.createTextNode(name));
  $('appsGrid').append(link);
  if (persist) {
    const apps = JSON.parse(localStorage.getItem('ironApps') || '[]');
    apps.push({ name, url });
    localStorage.setItem('ironApps', JSON.stringify(apps));
  }
}
try {
  JSON.parse(localStorage.getItem('ironApps') || '[]').forEach(app => addApp(app.name, app.url, false));
} catch (error) { localStorage.removeItem('ironApps'); }
$('addOpen').addEventListener('click', () => $('appDialog').showModal());
$('appForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('appName').value.trim();
  let url = $('appUrl').value.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try { url = new URL(url).href; } catch (error) { alert('Dirección web no válida'); return; }
  if (!name) return;
  addApp(name, url);
  $('appForm').reset();
  $('appDialog').close();
});

// Centro de configuración
$('settingsOpen').addEventListener('click', () => $('settingsDialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = $(button.dataset.close);
    if (dialog && dialog.open) dialog.close();
  });
});
function applySettings() {
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('ironSettings') || '{}'); } catch (error) {}
  $('motion').checked = settings.motion !== false;
  $('glow').checked = settings.glow !== false;
  $('background').value = settings.background || 'space';
  document.body.classList.toggle('no-motion', !$('motion').checked);
  document.body.classList.toggle('no-glow', !$('glow').checked);
  document.body.classList.remove('bg-plain', 'bg-grid');
  if (settings.background === 'plain') document.body.classList.add('bg-plain');
  if (settings.background === 'grid') document.body.classList.add('bg-grid');
}
function saveSettings() {
  localStorage.setItem('ironSettings', JSON.stringify({
    motion: $('motion').checked, glow: $('glow').checked, background: $('background').value
  }));
  applySettings();
}
['motion', 'glow', 'background'].forEach(id => $(id).addEventListener('change', saveSettings));
applySettings();

// IRON AI abre el asistente externo
function openAI() { window.open('https://chatgpt.com/', '_blank', 'noopener'); }
$('openAI').addEventListener('click', openAI);
$('sideAI').addEventListener('click', openAI);

// Navegación lateral: desplazamiento a secciones
document.querySelectorAll('.nav[data-go]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const target = document.getElementById(button.dataset.go);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
