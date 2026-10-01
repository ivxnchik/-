import {cities,models} from './data.js';
import {STARTS,createGame,rub,city,distance,marketValue,advance,generateListings,examine,negotiate,buy,repair,listForSale,buyers,sell,netWorth,inventoryValue,dealCost,repairCost,updateAsk,tripQuote,travelToListing,restoreGame} from './domain.js';
const root=document.querySelector('#app');let game=load();let filter={city:'all',brand:'all',max:5000000,sort:'value'};let notice='';let pendingConfirm=null;
function load(){try{return restoreGame(JSON.parse(localStorage.getItem('autodelo.current')))}catch{return null}}
function readSlots(){try{const raw=JSON.parse(localStorage.getItem('autodelo.slots')||'[]');return Array.from({length:3},(_,i)=>restoreGame(raw[i]))}catch{return [null,null,null]}}
function save(){try{localStorage.setItem('autodelo.current',JSON.stringify(game))}catch{notice='Браузер не смог сохранить игру. Освободите место в хранилище и сохраните слот.'}render()}
const fmtTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const dateText=()=>new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(2026,0,1+game.day));
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modelFor=car=>models.find(m=>m.id===car.modelId);
const message=(s)=>{notice=s;render()};
function confirmation(){if(!pendingConfirm)return '';const text=pendingConfirm.type==='trip'?'Расходы на поездку будут списаны, время в игре продвинется до осмотра. Продолжить?':`Подтвердить продажу по предложению ${rub(pendingConfirm.price)}?`;return `<div class="modal-backdrop"><section class="modal-card compact" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="modal-heading"><div><small>ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ</small><h2 id="confirm-title">${pendingConfirm.type==='trip'?'Поездка к продавцу':'Продажа автомобиля'}</h2></div><button class="icon-button" data-action="cancel-confirm" aria-label="Отмена">×</button></div><p class="modal-copy">${safe(text)}</p><div class="actions"><button class="button quiet" data-action="cancel-confirm">Отмена</button><button class="button primary" data-action="confirm-action">${pendingConfirm.type==='trip'?'Ехать':'Продать'}</button></div></section></div>`}
function act(fn){const out=fn();if(out?.error)notice=out.error;else notice='';save();return out}
function start(cash){game=createGame(cash);save()}
function header(){return `<header class="topbar"><div class="brand"><span class="brand-mark">А</span><span>АВТОДЕЛО<small>частный автомобильный бизнес</small></span></div>${game?`<div class="clock"><span>${dateText()}</span><b>${fmtTime(game.minute)}</b></div><div class="wallet"><small>Чистый капитал</small><strong>${rub(netWorth(game))}</strong></div><button class="icon-button" data-action="save-slot" title="Сохранения">▤</button>`:''}</header>`}
function sidebar(){const pages=[['market','Рынок','◈'],['garage','Мой гараж','▱'],['map','География','⌖'],['ledger','Финансы','₽']];return `<aside class="sidebar"><div class="nav-label">УПРАВЛЕНИЕ</div>${pages.map(([id,label,icon])=>`<button class="nav-item ${game.phase===id?'active':''}" data-page="${id}"><span>${icon}</span>${label}${id==='garage'?`<i>${game.inventory.filter(c=>c.stage!=='sold').length}</i>`:''}</button>`).join('')}<div class="side-bottom"><div class="home-chip"><span class="dot"></span><div><small>Ваш город</small><b>${city(game.player.home).name}</b></div><button data-action="change-home" title="Сменить город">↗</button></div><div class="side-help">Цель — чистый капитал<br><b>1 000 000 000 ₽</b><div class="progress"><span style="width:${Math.min(100,netWorth(game)/1000000000*100)}%"></span></div></div></div></aside>`}
function market(){let items=game.listings.filter(c=>(filter.city==='all'||c.cityId===filter.city)&&(filter.brand==='all'||modelFor(c).brand===filter.brand)&&c.ask<=Number(filter.max));items.sort((a,b)=>filter.sort==='value'?a.ask-b.ask:b.ask-a.ask);const car=items.find(c=>c.id===game.selected)||items[0];if(car&&car.id!==game.selected)game.selected=car.id;return `<section class="page-head"><div><div class="eyebrow">ЧАСТНЫЕ ОБЪЯВЛЕНИЯ · ${game.listings.length} В РЫНКЕ</div><h1>Найти свою сделку</h1><p>Изучите предложение, оцените расстояние и решите, стоит ли ехать смотреть.</p></div><button class="button quiet" data-action="refresh">Обновить рынок <span>↻</span></button></section><div class="market-layout"><section class="listing-pane"><div class="filters"><select id="f-city"><option value="all">Все города</option>${cities.map(c=>`<option value="${c.id}" ${filter.city===c.id?'selected':''}>${c.name}</option>`).join('')}</select><select id="f-brand"><option value="all">Все марки</option>${[...new Set(models.map(m=>m.brand))].sort().map(b=>`<option ${filter.brand===b?'selected':''}>${b}</option>`).join('')}</select><select id="f-sort"><option value="value">Дешевле сначала</option><option value="expensive" ${filter.sort==='expensive'?'selected':''}>Дороже сначала</option></select></div><div class="listing-scroll">${items.map(c=>listingCard(c)).join('')||'<div class="empty">Объявлений по этим условиям нет.</div>'}</div></section><section class="detail-pane">${car?carDetail(car):'<div class="empty">Выберите автомобиль в списке.</div>'}</section></div>`}
function listingCard(c){const m=modelFor(c),ct=city(c.cityId);return `<button class="listing-card ${game.selected===c.id?'chosen':''}" data-select="${c.id}"><div class="car-thumb ${m.body==='внедорожник'?'suv':''}"><span>${safe(m.brand)}</span><b>${safe(m.model)}</b><div class="car-shape"></div></div><div class="card-body"><div class="card-title"><b>${safe(m.brand)} ${safe(m.model)}</b><span class="badge">${c.year}</span></div><div class="muted">${c.km.toLocaleString('ru-RU')} км · ${m.transmission} · ${m.body}</div><div class="card-bottom"><strong>${rub(c.ask)}</strong><span>⌖ ${safe(ct.name)}</span></div></div></button>`}
function carDetail(c){const m=modelFor(c),ct=city(c.cityId);return `<div class="detail-hero"><div class="hero-kicker">${safe(ct.name)} <span>·</span> ${c.distance.toLocaleString('ru-RU')} км от вас</div><div class="car-thumb large ${m.body==='внедорожник'?'suv':''}"><span>${safe(m.brand)}</span><b>${safe(m.model)}</b><div class="car-shape"></div><div class="hero-car-label">${c.year} · ${m.body}</div></div><h2>${safe(m.brand)} ${safe(m.model)}</h2><div class="hero-sub">${m.volume} л · ${m.fuel} · ${m.transmission} · ${m.drive} привод</div><div class="price-line"><strong>${rub(c.ask)}</strong><span>объявление</span></div><div class="spec-grid"><div><small>ПРОБЕГ</small><b>${c.km.toLocaleString('ru-RU')} км</b></div><div><small>ВЛАДЕЛЬЦЕВ</small><b>${c.owners}</b></div><div><small>ПРОДАВЕЦ</small><b>${safe(c.owner)}</b></div><div><small>РАСХОД</small><b>${m.consumption} л / 100 км</b></div></div><div class="seller-note"><span class="quote">“</span><span>${safe(c.description)}</span></div><div class="logistics-box"><div><small>ПРЕДВАРИТЕЛЬНАЯ ЛОГИСТИКА · АВТОВОЗ</small><b>${rub(Math.max(5000,c.distance*72))}</b></div><span>${Math.max(5,Math.ceil(c.distance/650))} дн.</span></div><div class="hint-row"><span class="info-icon">i</span><span>Состояние и реальный пробег выясняются при осмотре. Рыночная оценка ${rub(c.fair)}.</span></div>${c.trip?`<button class="button primary full" data-action="inspect">Осмотр у продавца <span>→</span></button>`:`<button class="button primary full" data-action="trip">Рассчитать поездку и ехать <span>→</span></button>`}<div class="detail-foot">Оценка рынка учитывает год, пробег, состояние и город продавца.</div></div>`}
function garage(){const cars=game.inventory.filter(c=>c.stage!=='sold');return `<section class="page-head"><div><div class="eyebrow">ВАШИ АВТОМОБИЛИ · ${cars.length} В НАЛИЧИИ</div><h1>Мой гараж</h1><p>Следите за вложениями, выполните ремонт и подготовьте автомобиль к продаже.</p></div></section>${cars.length?`<div class="garage-grid">${cars.map(c=>garageCard(c)).join('')}</div>`:`<div class="empty-card"><div class="empty-icon">▱</div><h3>Пока гараж пуст</h3><p>Купленные машины появятся здесь после доставки.</p><button class="button primary" data-page="market">Перейти на рынок</button></div>`}`}
function garageCard(c){const m=modelFor(c),listed=c.stage==='listed',hasBuyerOffer=Number.isFinite(c.buyerOffer)&&game.day-(c.buyerOfferDay??game.day)<=3;return `<article class="garage-card"><div class="car-thumb ${m.body==='внедорожник'?'suv':''}"><span>${safe(m.brand)}</span><b>${safe(m.model)}</b><div class="car-shape"></div></div><div class="garage-info"><div class="garage-title"><div><h3>${safe(m.brand)} ${safe(m.model)}</h3><span>${c.year} · ${c.km.toLocaleString('ru-RU')} км · ${city(c.cityId).name}</span></div><span class="status ${listed?'listed':''}">${listed?'НА ПРОДАЖЕ':'В ГАРАЖЕ'}</span></div><div class="condition-row"><span>Текущее состояние</span><span>${c.condition>.94?'Хорошее':'Требует внимания'}</span></div><div class="condition-bar"><i style="width:${Math.max(8,Math.min(100,c.condition*85))}%"></i></div><div class="investment"><span>Покупка и вложения</span><b>${rub(dealCost(c))}</b></div>${listed?`<div class="asking-price">Цена объявления <b>${rub(c.ask)}</b></div><div class="sale-form"><input id="edit-ask-${c.id}" type="number" min="1" step="10000" value="${c.ask}" aria-label="Новая цена объявления"><button class="button quiet" data-action="update-ask" data-id="${c.id}">Обновить цену</button></div><div class="actions">${hasBuyerOffer?`<button class="button success" data-action="sell-buyer" data-id="${c.id}">Принять ${rub(c.buyerOffer)} · ${safe(c.buyerOfferBy||'покупатель')}</button>`:`<span class="muted">${Number.isFinite(c.buyerOffer)?'Предложение истекло':'Пока нет предложений покупателя'}</span>`}<button class="button quiet" data-action="buyer" data-id="${c.id}">Ждать покупателей · 1 день</button></div>`:`<div class="actions"><button class="button quiet" data-action="repair" data-id="${c.id}">Ремонт своими силами · ${rub(repairCost(game.player.home,'self'))}</button><button class="button quiet" data-action="service" data-id="${c.id}">Ремонт в сервисе · ${rub(repairCost(game.player.home,'service'))}</button></div><div class="sale-form"><input id="ask-${c.id}" type="number" min="1" value="${Math.round(marketValue(m,c.year,c.km,c.condition,city(game.player.home),game.day)/10000)*10000}" aria-label="Цена объявления"><button class="button primary" data-action="list" data-id="${c.id}">Разместить объявление</button></div>`}</div><details class="history"><summary>История автомобиля</summary>${c.history.map(h=>`<p>${safe(h)}</p>`).join('')}</details></article>`}
function mapPage(){return `<section class="page-head"><div><div class="eyebrow">РОССИЯ · ${cities.length} РЫНКОВ</div><h1>География рынка</h1><p>Сравнивайте регионы и учитывайте разницу цен, спроса и расходов на дорогу.</p></div></section><div class="map-layout"><div class="map-card"><div class="map-grid"></div><svg class="route-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${cities.filter(c=>c.id!==game.player.home).map(c=>`<line x1="${city(game.player.home).x}" y1="${city(game.player.home).y}" x2="${c.x}" y2="${c.y}" />`).join('')}</svg>${cities.map(c=>`<button class="map-dot ${c.id===game.player.home?'home':''}" style="left:${c.x}%;top:${c.y}%" data-city="${c.id}" title="${c.name}"><i></i><span>${c.name}</span></button>`).join('')}<div class="map-caption">УСЛОВНАЯ КАРТА РЫНКА</div></div><div class="region-list"><h3>Города и рынки</h3>${cities.map(c=>`<button class="region-row" data-city="${c.id}"><span><b>${c.name}</b><small>${c.population} жителей</small></span><span class="market-level">${c.id===game.player.home?'ВАШ ГОРОД':`рынок ${Math.round(c.market*100)}%`}</span></button>`).join('')}</div></div>`}
function finance(){const spent=game.logs.filter(x=>x.amount<0).reduce((a,x)=>a-x.amount,0),earned=game.logs.filter(x=>x.amount>0).reduce((a,x)=>a+x.amount,0),assets=inventoryValue(game);return `<section class="page-head"><div><div class="eyebrow">ДЕНЕЖНЫЙ ПОТОК · ${game.logs.length} ОПЕРАЦИЙ</div><h1>Финансы</h1><p>Чистый капитал учитывает деньги и рыночную стоимость автомобилей.</p></div></section><div class="finance-grid"><div class="metric-card"><small>НАЛИЧНЫЕ</small><b>${rub(game.player.cash)}</b></div><div class="metric-card"><small>НА СЧЁТЕ</small><b>${rub(game.player.account)}</b></div><div class="metric-card"><small>АВТОМОБИЛИ · РЫНОЧНАЯ ОЦЕНКА</small><b>${rub(assets)}</b></div><div class="metric-card highlight"><small>ЧИСТЫЙ КАПИТАЛ</small><b>${rub(netWorth(game))}</b></div></div><div class="ledger-card"><div class="ledger-head"><h3>Последние операции</h3><span>Расходы ${rub(spent)} · Поступления ${rub(earned)}</span></div>${game.logs.length?game.logs.slice(0,30).map(l=>`<div class="ledger-row"><span><small>ДЕНЬ ${l.day+1}</small><b>${safe(l.description)}</b></span><strong class="${l.amount<0?'negative':'positive'}">${l.amount<0?'−':'+'}${rub(Math.abs(l.amount))}</strong></div>`).join(''):'<div class="empty">Операций пока нет.</div>'}</div>${game.lastDeal?`<div class="deal-result"><span>ПОСЛЕДНЯЯ СДЕЛКА · ${safe(game.lastDeal.name)}</span><b class="${game.lastDeal.profit>=0?'positive':'negative'}">${game.lastDeal.profit>=0?'+':''}${rub(game.lastDeal.profit)}</b><small>Выручка ${rub(game.lastDeal.revenue)} · полные затраты ${rub(game.lastDeal.cost)}</small></div>`:''}`}
function render(){if(!game){root.innerHTML=`<div class="welcome"><div class="welcome-panel"><div class="welcome-brand">АВТОДЕЛО <span>СИМУЛЯТОР РЫНКА</span></div><div class="eyebrow">ВАШ ПЕРВЫЙ АВТОМОБИЛЬНЫЙ БИЗНЕС</div><h1>Начните с одной<br>хорошей сделки.</h1><p>Исследуйте рынок, проверьте автомобиль и решите, оправдывает ли маржа поездку, диагностику и ремонт.</p><div class="capital-picker"><label>Стартовый капитал</label><div class="capital-options">${STARTS.map((n,i)=>`<button class="capital-option ${i===1?'selected':''}" data-capital="${n}">${rub(n)}</button>`).join('')}</div></div><button class="button primary begin" data-action="begin">Начать игру <span>→</span></button><small class="offline-note">Локальная игра · сохранение в браузере · без регистрации</small></div><div class="welcome-art"><div class="sun"></div><div class="road"></div><div class="welcome-car"><div class="window"></div><i></i><b></b></div><div class="art-label">ПОНЕДЕЛЬНИК · МОСКВА · 2026</div></div></div>`;return;}const content={market,garage,map:mapPage,ledger:finance}[game.phase]||market;root.innerHTML=`${header()}<div class="shell">${sidebar()}<main class="main">${content()}${notice?`<div class="toast">${safe(notice)}<button data-action="dismiss">×</button></div>`:''}</main></div>${confirmation()}`;}
function goInspection(){try{localStorage.setItem('autodelo.current',JSON.stringify(game))}catch{notice='Браузер не смог сохранить игру. Продолжайте и освободите место перед следующим сохранением.'}const c=game.listings.find(x=>x.id===game.selected);if(!c)return;const model=modelFor(c);root.innerHTML=`${header()}<div class="shell">${sidebar()}<main class="main"><button class="back" data-page="market">← К объявлениям</button><section class="page-head"><div><div class="eyebrow">ОСМОТР · ${safe(city(c.cityId).name).toUpperCase()}</div><h1>${safe(model.brand)} ${safe(model.model)}</h1><p>Вы на месте. Проверки занимают игровое время и могут выявить часть проблем.</p></div><span class="status">${fmtTime(game.minute)} · ДЕНЬ ${game.day+1}</span></section><div class="inspection-grid"><div class="inspect-main"><div class="inspect-vehicle"><div class="car-thumb large"><span>${safe(model.brand)}</span><b>${safe(model.model)}</b><div class="car-shape"></div></div><div class="inspection-specs"><div><small>ОБЪЯВЛЕНИЕ</small><b>${rub(c.ask)}</b></div><div><small>ПРОБЕГ НА ОДОМЕТРЕ</small><b>${c.km.toLocaleString('ru-RU')} км</b></div><div><small>ДВИГАТЕЛЬ</small><b>${model.engine}, ${model.volume} л</b></div><div><small>КОРОБКА</small><b>${model.transmission}</b></div></div></div><div class="inspection-findings"><h3>Результаты осмотра</h3>${c.diag?`<div class="finding-list">${c.found?.map(x=>`<div class="finding"><span>!</span><div><b>${safe(x)}</b><small>Обнаружено при проверке</small></div></div>`).join('')||'<p class="muted">Явных замечаний не обнаружено.</p>'}</div>`:'<p class="muted">Пока ничего не проверено. Состояние компонентов неизвестно.</p>'}</div><div class="inspection-tools"><button class="tool-card" data-action="visual"><span>◉</span><b>Визуальный осмотр</b><small>30 минут · бесплатно</small></button><button class="tool-card" data-action="obd"><span>⌁</span><b>Сканер OBD</b><small>45 минут · 8 500 ₽</small></button><button class="tool-card" data-action="service-check"><span>✣</span><b>Диагностика сервиса</b><small>2 часа · 24 000 ₽</small></button></div></div><aside class="seller-panel"><small>ПРОДАВЕЦ</small><h3>${safe(c.owner)}</h3><p>${safe(c.description)}</p><div class="seller-price"><span>Просит</span><b>${rub(c.ask)}</b></div><label for="offer">Ваше предложение</label><input id="offer" type="number" value="${c.offer||Math.round(c.ask*.85/10000)*10000}"><button class="button primary full" data-action="negotiate">Предложить цену <span>→</span></button>${c.offer?`<div class="counter-offer">${c.accepted?'Цена, согласованная с продавцом':'Встречное предложение продавца'} <b>${rub(c.offer)}</b></div>`:''}<div class="hint-row"><span class="info-icon">i</span><span>У продавца своя минимальная цена. Результат зависит от вашего предложения и состояния автомобиля.</span></div>${c.offer&&c.offer<=c.ask*1.04?`<button class="button success full" data-action="buy">Купить за ${rub(c.offer)}</button>`:''}<button class="button text-button full" data-action="walk">Отказаться и вернуться</button></aside></div></main></div>${notice?`<div class="toast">${safe(notice)}<button data-action="dismiss">×</button></div>`:''}${confirmation()}`;}
document.addEventListener('click', event => {
  const target = event.target;
  if (target.classList?.contains('modal-backdrop')) { target.remove(); pendingConfirm=null; return; }
  const button = target.closest('button');
  if (!button) return;

  if (button.dataset.capital) {
    document.querySelectorAll('.capital-option').forEach(option => option.classList.toggle('selected', option === button));
    return;
  }
  if (button.dataset.page) {
    game.phase = button.dataset.page;
    notice = '';
    render();
    return;
  }
  if (button.dataset.select) {
    game.selected = button.dataset.select;
    notice = '';
    render();
    return;
  }
  if (button.dataset.city) {
    const selectedCity = city(button.dataset.city);
    message(`${selectedCity.name}: размер рынка ${Math.round(selectedCity.market * 100)}%, спрос ${Math.round(selectedCity.demand * 100)}%, бензин ${rub(selectedCity.fuel)} за литр. До вашего города ${distance(city(game.player.home), selectedCity)} км.`);
    return;
  }

  const action = button.dataset.action;
  if (action === 'begin') {
    start(Number(document.querySelector('.capital-option.selected')?.dataset.capital || 500000));
  } else if (action === 'refresh') {
    advance(game, 15);
    game.marketCycle = (game.marketCycle || 0) + 1;
    game.listings = generateListings(game, 9);
    game.selected = null;
    message('Рынок обновлён. Прошло 15 минут.');
    save();
  } else if (action === 'save-slot') openSaves();
  else if (action === 'save-slot-to') saveSlot(Number(button.dataset.slot));
  else if (action === 'load-slot-from') loadSlot(Number(button.dataset.slot));
  else if (action === 'close-modal') { document.querySelector('.modal-backdrop')?.remove(); pendingConfirm=null; }
  else if (action === 'cancel-confirm') { pendingConfirm=null; render(); }
  else if (action === 'confirm-action') { const pending=pendingConfirm; pendingConfirm=null; if(pending?.type==='trip'){const result=act(()=>travelToListing(game,pending.id));if(result.car)goInspection()}else if(pending?.type==='sell'){const result=act(()=>sell(game,pending.id,pending.price));if(result.profit!==undefined)message(`Продажа завершена. Финансовый результат: ${rub(result.profit)}.`)} }
  else if (action === 'home-submit') {
    const selectedCity = cities.find(item => item.id === document.querySelector('#home-choice')?.value);
    if (selectedCity) {
      game.player.home = selectedCity.id;
      game.listings.forEach(listing => { listing.distance = distance(selectedCity, city(listing.cityId)); });
      document.querySelector('.modal-backdrop')?.remove();
      message(`Базовый город изменён: ${selectedCity.name}.`);
      save();
    }
  } else if (action === 'change-home') openHome();
  else if (action === 'dismiss') { notice = ''; render(); }
  else if (action === 'trip') {
    const car = game.listings.find(item => item.id === game.selected);
    if (!car) { message('Сначала выберите автомобиль.'); return; }
    const quote=tripQuote(car.distance);pendingConfirm={type:'trip',id:car.id};notice=`${quote.hours} часов в пути · ${rub(quote.cost)} расходов`;render();
  } else if (action === 'inspect') goInspection();
  else if (['visual', 'obd', 'service-check'].includes(action)) {
    const kind = { visual: 'visual', obd: 'obd', 'service-check': 'service' }[action];
    const car = game.listings.find(item => item.id === game.selected);
    const result = act(() => examine(game, car.id, kind));
    if (result.findings) {
      message(result.findings.length ? `Проверка завершена. Обнаружено замечаний: ${result.findings.length}.` : 'Проверка завершена. Явных замечаний не обнаружено.');
    }
    goInspection();
  } else if (action === 'negotiate') {
    const price = Number(document.querySelector('#offer').value);
    const car = game.listings.find(item => item.id === game.selected);
    const result = act(() => negotiate(game, car.id, price));
    if (result.counter) {
      car.accepted = false;
      notice = 'Продавец предлагает встречную цену.';
    } else if (result.accepted) {
      car.accepted = true;
      notice = 'Продавец согласен.';
    }
    goInspection();
  } else if (action === 'buy') {
    const car = game.listings.find(item => item.id === game.selected);
    const result = act(() => buy(game, car.id, car.offer));
    if (result.bought) message(`Покупка завершена. Автомобиль доставлен в ваш город за ${rub(result.total)} с оформлением.`);
    else if (result.error) goInspection();
  } else if (action === 'walk') {
    advance(game, 30);
    game.selected = null;
    game.phase = 'market';
    message('Вы отказались от покупки. Прошло 30 минут.');
    save();
  } else if (action === 'repair' || action === 'service') {
    const result = act(() => repair(game, button.dataset.id, action === 'service' ? 'service' : 'self'));
    if (result.cost) message(`Ремонт завершён. Потрачено ${rub(result.cost)}.`);
  } else if (action === 'list') {
    const price = Number(document.querySelector(`#ask-${CSS.escape(button.dataset.id)}`).value);
    const result = act(() => listForSale(game, button.dataset.id, price));
    if (result.ok) message('Объявление опубликовано.');
  } else if (action === 'update-ask') {
    const price = Number(document.querySelector(`#edit-ask-${CSS.escape(button.dataset.id)}`).value);
    const result = act(() => updateAsk(game, button.dataset.id, price));
    if (result.ok) message(result.changed ? `Цена обновлена: ${rub(result.previous)} → ${rub(result.price)}.${result.offerCleared ? ' Предложение покупателя сброшено.' : ''}` : 'Цена не изменилась.');
  } else if (action === 'buyer') {
    const result = act(() => buyers(game, button.dataset.id));
    if (result.interested) message(`${result.buyer} готов посмотреть автомобиль и предлагает ${rub(result.price)}.`);
    else message('За день серьёзных предложений не поступило. Попробуйте позже или пересмотрите цену.');
  } else if (action === 'sell-buyer') {
    const car = game.inventory.find(item => item.id === button.dataset.id);
    pendingConfirm={type:'sell',id:car.id,price:car.buyerOffer};notice='';render();
  }
});
document.addEventListener('change',e=>{if(e.target.id==='f-city')filter.city=e.target.value;if(e.target.id==='f-brand')filter.brand=e.target.value;if(e.target.id==='f-sort')filter.sort=e.target.value;if(e.target.id?.startsWith('f-'))render()});
function openSaves(){const slots=readSlots();root.insertAdjacentHTML('beforeend',`<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><small>УПРАВЛЕНИЕ ИГРОЙ</small><h2 id="modal-title">Сохранения</h2></div><button class="icon-button" data-action="close-modal" aria-label="Закрыть">×</button></div><p class="modal-copy">Выберите слот, чтобы сохранить текущую игру или загрузить предыдущую.</p>${[0,1,2].map(i=>{const slot=slots[i];return `<div class="slot-row"><div><b>Слот ${i+1}</b><small>${slot?`${safe(slot.player?.name||'Частный перекуп')} · день ${slot.day+1}`:'Пустой слот'}</small></div><div class="slot-actions"><button class="button quiet" data-action="save-slot-to" data-slot="${i}">Сохранить</button>${slot?`<button class="button primary" data-action="load-slot-from" data-slot="${i}">Загрузить</button>`:''}</div></div>`}).join('')}</section></div>`)}
function saveSlot(i){const slots=readSlots();slots[i]=JSON.parse(JSON.stringify(game));try{localStorage.setItem('autodelo.slots',JSON.stringify(slots))}catch{notice='Не удалось сохранить слот: в браузере недостаточно места.';render();return}document.querySelector('.modal-backdrop')?.remove();message(`Игра сохранена в слот ${i+1}.`);save()}
function loadSlot(i){const slots=readSlots();if(!slots[i]){message('Этот слот пуст.');return}game=slots[i];document.querySelector('.modal-backdrop')?.remove();message('Сохранение загружено.');save()}

function openHome(){root.insertAdjacentHTML('beforeend',`<div class="modal-backdrop"><section class="modal-card compact" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><small>ГЕОГРАФИЯ БИЗНЕСА</small><h2 id="modal-title">Базовый город</h2></div><button class="icon-button" data-action="close-modal" aria-label="Закрыть">×</button></div><label class="modal-label" for="home-choice">Где находится ваша база?</label><select id="home-choice">${cities.map(c=>`<option value="${c.id}" ${c.id===game.player.home?'selected':''}>${safe(c.name)}</option>`).join('')}</select><button class="button primary full" data-action="home-submit">Сменить город</button></section></div>`)}

render();
