import { cities, models } from './data.js';
import {
  STARTS, createGame, rub, city, distance, marketValue, estimateVehicleMarketValue,
  advance, refreshMarket, examine, diagnoseVehicle, inspectDocuments, negotiate, buy,
  repairFault, repairQuote, knownFaults, visibleHistory, driveVehicle, listForSale,
  buyers, sell, netWorth, inventoryValue, dealCost, updateAsk, tripQuote,
  travelToListing, restoreGame, vehicleById, vehicleForListing, inventoryVehicles
} from './domain.js';

const root = document.querySelector('#app');
let game = load();
let filter = { city: 'all', brand: 'all', max: 5000000, sort: 'value' };
let notice = '';
let pendingConfirm = null;

function load() { try { return restoreGame(JSON.parse(localStorage.getItem('autodelo.current'))); } catch { return null; } }
function readSlots() { try { const raw = JSON.parse(localStorage.getItem('autodelo.slots') || '[]'); return Array.from({ length: 3 }, (_, i) => restoreGame(raw[i])); } catch { return [null, null, null]; } }
function save() { try { localStorage.setItem('autodelo.current', JSON.stringify(game)); } catch { notice = 'Браузер не смог сохранить игру. Освободите место в хранилище и сохраните слот.'; } render(); }
const fmtTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const dateText = () => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(2026, 0, 1 + game.day));
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const modelFor = vehicle => models.find(model => model.id === vehicle?.modelId);
const message = text => { notice = text; render(); };
const listingVehicle = listing => vehicleForListing(game, listing);

function confirmation() {
  if (!pendingConfirm) return '';
  const trip = pendingConfirm.type === 'trip';
  const text = trip ? 'Расходы на поездку будут списаны, а время в игре продвинется до осмотра. Продолжить?' : `Подтвердить продажу по предложению ${rub(pendingConfirm.price)}?`;
  return `<div class="modal-backdrop"><section class="modal-card compact" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="modal-heading"><div><small>ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ</small><h2 id="confirm-title">${trip ? 'Поездка к продавцу' : 'Продажа автомобиля'}</h2></div><button class="icon-button" data-action="cancel-confirm" aria-label="Отмена">×</button></div><p class="modal-copy">${safe(text)}</p><div class="actions"><button class="button quiet" data-action="cancel-confirm">Отмена</button><button class="button primary" data-action="confirm-action">${trip ? 'Ехать' : 'Продать'}</button></div></section></div>`;
}

function act(command) { const result = command(); notice = result?.error || ''; save(); return result; }
function start(cash) { game = createGame(cash); save(); }

function header() {
  return `<header class="topbar"><div class="brand"><span class="brand-mark">А</span><span>АВТОДЕЛО<small>частный автомобильный бизнес</small></span></div>${game ? `<div class="clock"><span>${dateText()}</span><b>${fmtTime(game.minute)}</b></div><div class="wallet"><small>Чистый капитал</small><strong>${rub(netWorth(game))}</strong></div><button class="icon-button" data-action="save-slot" title="Сохранения">▤</button>` : ''}</header>`;
}

function sidebar() {
  const pages = [['market', 'Рынок', '◈'], ['garage', 'Мой гараж', '▱'], ['map', 'География', '⌖'], ['ledger', 'Финансы', '₽']];
  const count = inventoryVehicles(game).filter(vehicle => vehicle.status !== 'sold').length;
  return `<aside class="sidebar"><div class="nav-label">УПРАВЛЕНИЕ</div>${pages.map(([id, label, icon]) => `<button class="nav-item ${game.phase === id ? 'active' : ''}" data-page="${id}"><span>${icon}</span>${label}${id === 'garage' ? `<i>${count}</i>` : ''}</button>`).join('')}<div class="side-bottom"><div class="home-chip"><span class="dot"></span><div><small>Ваш город</small><b>${safe(city(game.player.home)?.name)}</b></div><button data-action="change-home" title="Сменить город">↗</button></div><div class="side-help">Цель — чистый капитал<br><b>1 000 000 000 ₽</b><div class="progress"><span style="width:${Math.min(100, netWorth(game) / 1000000000 * 100)}%"></span></div></div></div></aside>`;
}

function market() {
  let listings = game.listings.filter(listing => {
    const vehicle = listingVehicle(listing);
    return vehicle && (filter.city === 'all' || vehicle.cityId === filter.city) && (filter.brand === 'all' || modelFor(vehicle).brand === filter.brand) && listing.ask <= Number(filter.max);
  });
  listings.sort((a, b) => filter.sort === 'value' ? a.ask - b.ask : b.ask - a.ask);
  const listing = listings.find(item => item.id === game.selected) || listings[0];
  if (listing && listing.id !== game.selected) game.selected = listing.id;
  return `<section class="page-head"><div><div class="eyebrow">ЧАСТНЫЕ ОБЪЯВЛЕНИЯ · ${game.listings.length} В РЫНКЕ</div><h1>Найти свою сделку</h1><p>Изучите предложение, оцените поездку и проверьте конкретный экземпляр.</p></div><button class="button quiet" data-action="refresh">Обновить рынок <span>↻</span></button></section><div class="market-layout"><section class="listing-pane"><div class="filters"><select id="f-city"><option value="all">Все города</option>${cities.map(item => `<option value="${item.id}" ${filter.city === item.id ? 'selected' : ''}>${safe(item.name)}</option>`).join('')}</select><select id="f-brand"><option value="all">Все марки</option>${[...new Set(models.map(item => item.brand))].sort().map(brand => `<option value="${safe(brand)}" ${filter.brand === brand ? 'selected' : ''}>${safe(brand)}</option>`).join('')}</select><select id="f-sort"><option value="value" ${filter.sort === 'value' ? 'selected' : ''}>Дешевле сначала</option><option value="expensive" ${filter.sort === 'expensive' ? 'selected' : ''}>Дороже сначала</option></select></div><div class="listing-scroll">${listings.map(listingCard).join('') || '<div class="empty">Объявлений по этим условиям нет.</div>'}</div></section><section class="detail-pane">${listing ? carDetail(listing) : '<div class="empty">Выберите автомобиль в списке.</div>'}</section></div>`;
}

function listingCard(listing) {
  const vehicle = listingVehicle(listing), model = modelFor(vehicle), region = city(vehicle.cityId);
  return `<button class="listing-card ${game.selected === listing.id ? 'chosen' : ''}" data-select="${safe(listing.id)}"><div class="car-thumb ${model.body === 'внедорожник' ? 'suv' : ''}"><span>${safe(model.brand)}</span><b>${safe(model.model)}</b><div class="car-shape"></div></div><div class="card-body"><div class="card-title"><b>${safe(model.brand)} ${safe(model.model)}</b><span class="badge">${vehicle.year}</span></div><div class="muted">${vehicle.odometer.toLocaleString('ru-RU')} км · ${safe(model.transmission)} · ${safe(model.body)}</div><div class="card-bottom"><strong>${rub(listing.ask)}</strong><span>⌖ ${safe(region.name)}</span></div></div></button>`;
}

function documentPanel(vehicle) {
  if (!vehicle.documents?.known) return `<div class="document-panel"><b>Документы и VIN</b><p>Сверьте номер кузова, регистрационные данные и доступные сервисные записи.</p><button class="button quiet" data-action="documents" data-vehicle-id="${safe(vehicle.id)}">Проверить документы · 15 минут</button></div>`;
  const record = vehicle.documents.serviceReadings?.at(-1);
  return `<div class="document-panel"><b>Документы автомобиля</b><div class="document-grid"><span>VIN</span><strong>${safe(vehicle.vin)}</strong><span>Регистрационный номер</span><strong>${safe(vehicle.documents.registrationNumber || 'не указан')}</strong><span>Год первой регистрации</span><strong>${vehicle.documents.firstRegistrationYear || 'нет записи'}</strong><span>Последняя запись пробега</span><strong>${record ? `${record.mileage.toLocaleString('ru-RU')} км · ${record.year} г.` : 'нет сервисных записей'}</strong></div>${vehicle.mileageTamperingSuspected ? '<p class="warning-note">Запись из документов выше показания на приборке. Реальный пробег не установлен.</p>' : ''}${vehicle.accidents?.length ? `<p class="warning-note">В документах найдена запись о ДТП (${vehicle.accidents.length}).</p>` : ''}</div>`;
}

function carDetail(listing) {
  const vehicle = listingVehicle(listing), model = modelFor(vehicle), region = city(vehicle.cityId), inspected = listing.trip;
  const documentation = inspected || vehicle.documents.known ? documentPanel(vehicle) : '';
  return `<div class="detail-hero"><div class="hero-kicker">${safe(region.name)} <span>·</span> ${listing.distance.toLocaleString('ru-RU')} км от вас</div><div class="car-thumb large ${model.body === 'внедорожник' ? 'suv' : ''}"><span>${safe(model.brand)}</span><b>${safe(model.model)}</b><div class="car-shape"></div><div class="hero-car-label">${vehicle.year} · ${safe(model.body)}</div></div><h2>${safe(model.brand)} ${safe(model.model)}</h2><div class="hero-sub">${safe(model.generation)} · ${safe(model.modification)} · ${safe(model.transmission)} · ${safe(model.drive)} привод</div><div class="price-line"><strong>${rub(listing.ask)}</strong><span>объявление</span></div><div class="spec-grid"><div><small>ПОКАЗАНИЕ ОДОМЕТРА</small><b>${vehicle.odometer.toLocaleString('ru-RU')} км</b></div><div><small>ВЛАДЕЛЬЦЕВ</small><b>${vehicle.owners}</b></div><div><small>ПРОДАВЕЦ</small><b>${safe(listing.owner)}</b></div><div><small>РАСХОД МОДЕЛИ</small><b>${model.consumption} л / 100 км</b></div></div><div class="seller-note"><span class="quote">“</span><span>${safe(listing.description)}</span></div><div class="logistics-box"><div><small>ПРЕДВАРИТЕЛЬНАЯ ЛОГИСТИКА · АВТОВОЗ</small><b>${rub(Math.max(5000, listing.distance * 72))}</b></div><span>${Math.max(5, Math.ceil(listing.distance / 650))} дн.</span></div>${documentation}<div class="hint-row"><span class="info-icon">i</span><span>В объявлении показан одометр. История пробега и скрытые неисправности открываются документами, осмотром и диагностикой.</span></div>${listing.trip ? `<button class="button primary full" data-action="inspect">Осмотр у продавца <span>→</span></button>` : `<button class="button primary full" data-action="trip">Рассчитать поездку и ехать <span>→</span></button>`}<div class="detail-foot">${safe(model.brand)} ${safe(model.model)} · ${safe(model.engine)} · ориентир модели ${rub(model.marketRange.min)}–${rub(model.marketRange.max)}</div></div>`;
}

function observationList(vehicle) {
  return vehicle.observations.length ? `<div class="finding-list">${vehicle.observations.slice(-12).reverse().map(item => `<div class="finding"><span>!</span><div><b>${safe(item.text)}</b><small>${safe(item.source)} · ${safe(item.date)}</small></div></div>`).join('')}</div>` : '<p class="muted">Пока нет записей проверки. Необнаруженные неисправности здесь не отображаются.</p>';
}

function inspectionPage() {
  const listing = game.listings.find(item => item.id === game.selected), vehicle = listingVehicle(listing), model = modelFor(vehicle);
  if (!listing || !vehicle) return market();
  return `${header()}<div class="shell">${sidebar()}<main class="main"><button class="back" data-page="market">← К объявлениям</button><section class="page-head"><div><div class="eyebrow">ОСМОТР · ${safe(city(vehicle.cityId).name).toUpperCase()}</div><h1>${safe(model.brand)} ${safe(model.model)}</h1><p>У автомобиля собственная история, пробег и неисправности. Скрытые данные не показываются без проверки.</p></div><span class="status">${fmtTime(game.minute)} · ДЕНЬ ${game.day + 1}</span></section><div class="inspection-grid"><div class="inspect-main"><div class="inspect-vehicle"><div class="car-thumb large"><span>${safe(model.brand)}</span><b>${safe(model.model)}</b><div class="car-shape"></div></div><div class="inspection-specs"><div><small>ОБЪЯВЛЕНИЕ</small><b>${rub(listing.ask)}</b></div><div><small>ПОКАЗАНИЕ ОДОМЕТРА</small><b>${vehicle.odometer.toLocaleString('ru-RU')} км</b></div><div><small>VIN</small><b>${vehicle.documents.vinChecked ? safe(vehicle.vin) : 'Сверьте по документам'}</b></div><div><small>ДВИГАТЕЛЬ / ГОД</small><b>${safe(model.engine)}, ${model.volume} л · ${vehicle.year}</b></div></div></div>${documentPanel(vehicle)}<div class="inspection-findings"><h3>Известные признаки и проверки</h3>${observationList(vehicle)}</div><div class="inspection-tools"><button class="tool-card" data-action="diagnose" data-method="visual"><span>◉</span><b>Визуальный осмотр</b><small>30 минут · бесплатно</small></button><button class="tool-card" data-action="diagnose" data-method="obd"><span>⌁</span><b>Сканер OBD</b><small>45 минут · 8 500 ₽</small></button><button class="tool-card" data-action="diagnose" data-method="service"><span>✣</span><b>Комплексная диагностика</b><small>2 часа · 24 000 ₽</small></button><button class="tool-card" data-action="diagnose" data-method="mileage"><span>↗</span><b>Проверка истории пробега</b><small>1 час · 12 000 ₽</small></button></div></div><aside class="seller-panel"><small>ПРОДАВЕЦ</small><h3>${safe(listing.owner)}</h3><p>${safe(listing.description)}</p><div class="seller-price"><span>Просит</span><b>${rub(listing.ask)}</b></div><label for="offer">Ваше предложение</label><input id="offer" type="number" min="1" value="${listing.offer || Math.round(listing.ask * .85 / 10000) * 10000}"><button class="button primary full" data-action="negotiate">Предложить цену <span>→</span></button>${listing.offer ? `<div class="counter-offer">${listing.accepted ? 'Цена, согласованная с продавцом' : 'Встречное предложение продавца'} <b>${rub(listing.offer)}</b></div>` : ''}<div class="hint-row"><span class="info-icon">i</span><span>Минимальная цена продавца скрыта. Условия зависят от предложения и состояния автомобиля.</span></div>${listing.offer && listing.offer <= listing.ask * 1.04 ? `<button class="button success full" data-action="buy">Купить за ${rub(listing.offer)}</button>` : ''}<button class="button text-button full" data-action="walk">Отказаться и вернуться</button></aside></div></main></div>${notice ? `<div class="toast">${safe(notice)}<button data-action="dismiss">×</button></div>` : ''}${confirmation()}`;
}

function faultRepairCard(vehicle, fault) {
  const confirmed = fault.knowledge.level === 'confirmed';
  const initialQuote = repairQuote(fault, 'aftermarket', 'service');
  const heading = confirmed ? fault.name : fault.knowledge.level === 'suspected' ? 'Есть подозрение на неисправность' : 'Обнаружен признак';
  return `<div class="fault-repair" data-fault-id="${safe(fault.id)}"><div><b>${safe(heading)}</b><p>${safe(fault.knowledge.notes?.at(-1) || fault.symptom)}</p><small>${confirmed ? 'Подтверждено' : fault.knowledge.level === 'suspected' ? 'Требуется подтверждение' : 'Неисправность пока не установлена'} · ${safe(fault.knowledge.source)}</small></div><div class="repair-controls"><select class="repair-part" aria-label="Тип запчасти"><option value="aftermarket" selected>Новый аналог</option><option value="oem">Новая оригинальная</option><option value="used">Б/у с разборки</option></select><select class="repair-kind" aria-label="Где ремонтировать"><option value="service" selected>Сервис</option><option value="self">Самостоятельно</option></select><small class="repair-estimate">Детали ${rub(initialQuote.partsCost)} · работа ${rub(initialQuote.laborCost)} · ${Math.ceil(initialQuote.minutes / 60)} ч · ресурс около ${initialQuote.estimatedLifeKm.toLocaleString('ru-RU')} км · риск повторения ${Math.round(initialQuote.repeatRisk * 100)}%</small><button class="button quiet" data-action="repair-fault" data-vehicle-id="${safe(vehicle.id)}" data-fault-id="${safe(fault.id)}" ${confirmed ? '' : 'disabled'}>${confirmed ? `Ремонт · ${rub(initialQuote.cost)}` : 'Сначала подтвердите неисправность'}</button></div></div>`;
}

function garageCard(vehicle) {
  const model = modelFor(vehicle), listed = vehicle.status === 'listed';
  const buyerOfferCurrent = Number.isFinite(vehicle.buyerOffer) && game.day - (vehicle.buyerOfferDay ?? game.day) <= 3;
  const faults = knownFaults(vehicle);
  const repairs = vehicle.repairs.length ? `<details class="history"><summary>Ремонтная история · ${vehicle.repairs.length}</summary>${vehicle.repairs.map(record => `<p>${safe(record.date)} · ${safe(record.faultName)} · ${safe(record.partName)} · ${rub(record.cost)} · ${safe(record.service)} · ${safe(record.result)}</p>`).join('')}</details>` : '';
  const history = visibleHistory(vehicle);
  const marketValueNow = estimateVehicleMarketValue(vehicle, city(game.player.home), game.day);
  return `<article class="garage-card"><div class="car-thumb ${model.body === 'внедорожник' ? 'suv' : ''}"><span>${safe(model.brand)}</span><b>${safe(model.model)}</b><div class="car-shape"></div></div><div class="garage-info"><div class="garage-title"><div><h3>${safe(model.brand)} ${safe(model.model)}</h3><span>${vehicle.year} · ${vehicle.odometer.toLocaleString('ru-RU')} км на одометре · ${safe(city(vehicle.cityId).name)}</span></div><span class="status ${listed ? 'listed' : ''}">${listed ? 'НА ПРОДАЖЕ' : 'В ГАРАЖЕ'}</span></div><div class="vehicle-meta"><span>VIN</span><b>${safe(vehicle.vin)}</b><span>Документы</span><b>${vehicle.documents.known ? 'Сверены' : 'Есть несверенные записи'}</b><span>Известные проблемы</span><b>${faults.length ? faults.length : 'Не выявлены'}</b></div>${documentPanel(vehicle)}<div class="investment"><span>Полная себестоимость</span><b>${rub(dealCost(vehicle))}</b></div><div class="investment"><span>Оценка с учётом состояния</span><b>${rub(marketValueNow)}</b></div><section class="vehicle-knowledge"><h4>Выявленные признаки и неисправности</h4>${observationList(vehicle)}</section>${listed ? `<div class="asking-price">Цена объявления <b>${rub(vehicle.ask)}</b></div><div class="sale-form"><input id="edit-ask-${safe(vehicle.id)}" type="number" min="10000" step="10000" value="${vehicle.ask}" aria-label="Новая цена объявления"><button class="button quiet" data-action="update-ask" data-id="${safe(vehicle.id)}">Обновить цену</button></div><div class="actions">${buyerOfferCurrent ? `<button class="button success" data-action="sell-buyer" data-id="${safe(vehicle.id)}">Принять ${rub(vehicle.buyerOffer)} · ${safe(vehicle.buyerOfferBy || 'покупатель')}</button>` : `<span class="muted">${Number.isFinite(vehicle.buyerOffer) ? 'Предложение истекло' : 'Пока нет предложений покупателя'}</span>`}<button class="button quiet" data-action="buyer" data-id="${safe(vehicle.id)}">Ждать покупателей · 1 день</button></div>` : `<div class="fault-repairs"><h4>Ремонт известных неисправностей</h4>${faults.length ? faults.map(fault => faultRepairCard(vehicle, fault)).join('') : '<p class="muted">Нет выявленной проблемы для ремонта. Неизвестное состояние не отображается.</p>'}</div><div class="actions"><button class="button quiet" data-action="drive" data-id="${safe(vehicle.id)}">Пробная поездка · 30 км</button><button class="button quiet" data-action="diagnose-owned" data-id="${safe(vehicle.id)}" data-method="service">Диагностика в сервисе · 24 000 ₽</button></div><div class="sale-form"><input id="ask-${safe(vehicle.id)}" type="number" min="10000" step="10000" value="${Math.max(10000, marketValueNow)}" aria-label="Цена объявления"><button class="button primary" data-action="list" data-id="${safe(vehicle.id)}">Разместить объявление</button></div>`}</div>${repairs}${history.length ? `<details class="history"><summary>История автомобиля · ${history.length} событий</summary>${history.slice().reverse().map(event => `<p>${safe(event.date)} · ${safe(event.description)} · ${event.mileage ? `${event.mileage.toLocaleString('ru-RU')} км` : '—'} · ${safe(city(event.region)?.name || event.region)}</p>`).join('')}</details>` : ''}</article>`;
}

function garage() {
  const cars = inventoryVehicles(game).filter(vehicle => vehicle.status !== 'sold');
  return `<section class="page-head"><div><div class="eyebrow">ВАШИ АВТОМОБИЛИ · ${cars.length} В НАЛИЧИИ</div><h1>Мой гараж</h1><p>Сверяйте историю конкретного автомобиля, проверяйте его в поездке и ремонтируйте найденные неисправности.</p></div></section>${cars.length ? `<div class="garage-grid">${cars.map(garageCard).join('')}</div>` : `<div class="empty-card"><div class="empty-icon">▱</div><h3>Пока гараж пуст</h3><p>Купленные машины появятся здесь после доставки.</p><button class="button primary" data-page="market">Перейти на рынок</button></div>`}`;
}

function mapPage() {
  const home = city(game.player.home);
  return `<section class="page-head"><div><div class="eyebrow">РОССИЯ · ${cities.length} РЫНКОВ</div><h1>География рынка</h1><p>Сравнивайте регионы и учитывайте разницу цен, спроса и расходов на дорогу.</p></div></section><div class="map-layout"><div class="map-card"><div class="map-grid"></div><svg class="route-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${cities.filter(item => item.id !== game.player.home).map(item => `<line x1="${home.x}" y1="${home.y}" x2="${item.x}" y2="${item.y}" />`).join('')}</svg>${cities.map(item => `<button class="map-dot ${item.id === game.player.home ? 'home' : ''}" style="left:${item.x}%;top:${item.y}%" data-city="${item.id}" title="${safe(item.name)}"><i></i><span>${safe(item.name)}</span></button>`).join('')}<div class="map-caption">УСЛОВНАЯ КАРТА РЫНКА</div></div><div class="region-list"><h3>Города и рынки</h3>${cities.map(item => `<button class="region-row" data-city="${item.id}"><span><b>${safe(item.name)}</b><small>${safe(item.population)} жителей</small></span><span class="market-level">${item.id === game.player.home ? 'ВАШ ГОРОД' : `рынок ${Math.round(item.market * 100)}%`}</span></button>`).join('')}</div></div>`;
}

function finance() {
  const spent = game.logs.filter(item => item.amount < 0).reduce((sum, item) => sum - item.amount, 0);
  const earned = game.logs.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  return `<section class="page-head"><div><div class="eyebrow">ДЕНЕЖНЫЙ ПОТОК · ${game.logs.length} ОПЕРАЦИЙ</div><h1>Финансы</h1><p>Чистый капитал учитывает деньги и оценочную стоимость непроданных машин.</p></div></section><div class="finance-grid"><div class="metric-card"><small>НАЛИЧНЫЕ</small><b>${rub(game.player.cash)}</b></div><div class="metric-card"><small>НА СЧЁТЕ</small><b>${rub(game.player.account)}</b></div><div class="metric-card"><small>АВТОМОБИЛИ · ОЦЕНКА</small><b>${rub(inventoryValue(game))}</b></div><div class="metric-card highlight"><small>ЧИСТЫЙ КАПИТАЛ</small><b>${rub(netWorth(game))}</b></div></div><div class="ledger-card"><div class="ledger-head"><h3>Последние операции</h3><span>Расходы ${rub(spent)} · Поступления ${rub(earned)}</span></div>${game.logs.length ? game.logs.slice(0, 30).map(item => `<div class="ledger-row"><span><small>ДЕНЬ ${item.day + 1}</small><b>${safe(item.description)}</b></span><strong class="${item.amount < 0 ? 'negative' : 'positive'}">${item.amount < 0 ? '−' : '+'}${rub(Math.abs(item.amount))}</strong></div>`).join('') : '<div class="empty">Операций пока нет.</div>'}</div>${game.lastDeal ? `<div class="deal-result"><span>ПОСЛЕДНЯЯ СДЕЛКА · ${safe(game.lastDeal.name)}</span><b class="${game.lastDeal.profit >= 0 ? 'positive' : 'negative'}">${game.lastDeal.profit >= 0 ? '+' : ''}${rub(game.lastDeal.profit)}</b><small>Выручка ${rub(game.lastDeal.revenue)} · полные затраты ${rub(game.lastDeal.cost)}</small></div>` : ''}`;
}

function render() {
  if (!game) {
    root.innerHTML = `<div class="welcome"><div class="welcome-panel"><div class="welcome-brand">АВТОДЕЛО <span>СИМУЛЯТОР РЫНКА</span></div><div class="eyebrow">ВАШ ПЕРВЫЙ АВТОМОБИЛЬНЫЙ БИЗНЕС</div><h1>Начните с одной<br>хорошей сделки.</h1><p>Исследуйте рынок, проверьте конкретный автомобиль и решите, оправдывает ли маржа поездку, диагностику и ремонт.</p><div class="capital-picker"><label>Стартовый капитал</label><div class="capital-options">${STARTS.map((amount, index) => `<button class="capital-option ${index === 1 ? 'selected' : ''}" data-capital="${amount}">${rub(amount)}</button>`).join('')}</div></div><button class="button primary begin" data-action="begin">Начать игру <span>→</span></button><small class="offline-note">Локальная игра · сохранение в браузере · без регистрации</small></div><div class="welcome-art"><div class="sun"></div><div class="road"></div><div class="welcome-car"><div class="window"></div><i></i><b></b></div><div class="art-label">ПОНЕДЕЛЬНИК · МОСКВА · 2026</div></div></div>`;
    return;
  }
  const content = { market, garage, map: mapPage, ledger: finance }[game.phase] || market;
  root.innerHTML = `${header()}<div class="shell">${sidebar()}<main class="main">${content()}${notice ? `<div class="toast">${safe(notice)}<button data-action="dismiss">×</button></div>` : ''}</main></div>${confirmation()}`;
}

function goInspection() {
  try { localStorage.setItem('autodelo.current', JSON.stringify(game)); } catch { notice = 'Браузер не смог сохранить игру. Освободите место перед следующим сохранением.'; }
  root.innerHTML = inspectionPage();
}

function openSaves() {
  const slots = readSlots();
  root.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><small>УПРАВЛЕНИЕ ИГРОЙ</small><h2 id="modal-title">Сохранения</h2></div><button class="icon-button" data-action="close-modal" aria-label="Закрыть">×</button></div><p class="modal-copy">Выберите слот, чтобы сохранить текущую игру или загрузить предыдущую.</p>${[0, 1, 2].map(index => { const slot = slots[index]; return `<div class="slot-row"><div><b>Слот ${index + 1}</b><small>${slot ? `${safe(slot.player?.name || 'Частный перекуп')} · день ${slot.day + 1}` : 'Пустой слот'}</small></div><div class="slot-actions"><button class="button quiet" data-action="save-slot-to" data-slot="${index}">Сохранить</button>${slot ? `<button class="button primary" data-action="load-slot-from" data-slot="${index}">Загрузить</button>` : ''}</div></div>`; }).join('')}</section></div>`);
}

function saveSlot(index) {
  const slots = readSlots(); slots[index] = JSON.parse(JSON.stringify(game));
  try { localStorage.setItem('autodelo.slots', JSON.stringify(slots)); } catch { notice = 'Не удалось сохранить слот: в браузере недостаточно места.'; render(); return; }
  document.querySelector('.modal-backdrop')?.remove(); message(`Игра сохранена в слот ${index + 1}.`); save();
}

function loadSlot(index) {
  const slots = readSlots();
  if (!slots[index]) { message('Этот слот пуст.'); return; }
  game = slots[index]; document.querySelector('.modal-backdrop')?.remove(); message('Сохранение загружено.'); save();
}

function openHome() {
  root.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><section class="modal-card compact" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><small>ГЕОГРАФИЯ БИЗНЕСА</small><h2 id="modal-title">Базовый город</h2></div><button class="icon-button" data-action="close-modal" aria-label="Закрыть">×</button></div><label class="modal-label" for="home-choice">Где находится ваша база?</label><select id="home-choice">${cities.map(item => `<option value="${item.id}" ${item.id === game.player.home ? 'selected' : ''}>${safe(item.name)}</option>`).join('')}</select><button class="button primary full" data-action="home-submit">Сменить город</button></section></div>`);
}

document.addEventListener('click', event => {
  const target = event.target;
  if (target.classList?.contains('modal-backdrop')) { target.remove(); pendingConfirm = null; return; }
  const button = target.closest('button');
  if (!button) return;
  if (button.dataset.capital) { document.querySelectorAll('.capital-option').forEach(option => option.classList.toggle('selected', option === button)); return; }
  if (button.dataset.page) { game.phase = button.dataset.page; notice = ''; render(); return; }
  if (button.dataset.select) { game.selected = button.dataset.select; notice = ''; render(); return; }
  if (button.dataset.city) { const selected = city(button.dataset.city); message(`${selected.name}: размер рынка ${Math.round(selected.market * 100)}%, спрос ${Math.round(selected.demand * 100)}%, бензин ${rub(selected.fuel)} за литр. До вашего города ${distance(city(game.player.home), selected)} км.`); return; }

  const action = button.dataset.action;
  if (action === 'begin') start(Number(document.querySelector('.capital-option.selected')?.dataset.capital || 500000));
  else if (action === 'refresh') { advance(game, 15); refreshMarket(game, 9); message('Рынок обновлён. Прошло 15 минут.'); save(); }
  else if (action === 'save-slot') openSaves();
  else if (action === 'save-slot-to') saveSlot(Number(button.dataset.slot));
  else if (action === 'load-slot-from') loadSlot(Number(button.dataset.slot));
  else if (action === 'close-modal') { document.querySelector('.modal-backdrop')?.remove(); pendingConfirm = null; }
  else if (action === 'cancel-confirm') { pendingConfirm = null; render(); }
  else if (action === 'confirm-action') {
    const pending = pendingConfirm; pendingConfirm = null;
    if (pending?.type === 'trip') { const result = act(() => travelToListing(game, pending.id)); if (result.vehicle) goInspection(); }
    else if (pending?.type === 'sell') { const result = act(() => sell(game, pending.id, pending.price)); if (result.profit !== undefined) message(`Продажа завершена. Финансовый результат: ${rub(result.profit)}.`); }
  } else if (action === 'home-submit') {
    const selected = cities.find(item => item.id === document.querySelector('#home-choice')?.value);
    if (selected) { game.player.home = selected.id; game.listings.forEach(listing => { listing.distance = distance(selected, city(listing.cityId)); vehicleForListing(game, listing).marketDistance = listing.distance; }); document.querySelector('.modal-backdrop')?.remove(); message(`Базовый город изменён: ${selected.name}.`); save(); }
  } else if (action === 'change-home') openHome();
  else if (action === 'dismiss') { notice = ''; render(); }
  else if (action === 'trip') { const listing = game.listings.find(item => item.id === game.selected); if (!listing) { message('Сначала выберите автомобиль.'); return; } const quote = tripQuote(listing.distance); pendingConfirm = { type: 'trip', id: listing.id }; notice = `${quote.hours} часов в пути · ${rub(quote.cost)} расходов`; render(); }
  else if (action === 'inspect') goInspection();
  else if (action === 'diagnose') {
    const result = act(() => examine(game, game.selected, button.dataset.method));
    if (!result.error) notice = result.findings.length ? `Проверка завершена. Новых признаков: ${result.findings.length}.` : 'Проверка завершена. Новых признаков не обнаружено.';
    goInspection();
  } else if (action === 'diagnose-owned') {
    const result = act(() => diagnoseVehicle(game, button.dataset.id, button.dataset.method));
    if (!result.error) notice = result.findings.length ? `Проверка завершена. Новых признаков: ${result.findings.length}.` : 'Проверка завершена. Новых признаков не обнаружено.';
    render();
  } else if (action === 'documents') {
    const isInspection = !!document.querySelector('.inspection-grid');
    const result = act(() => inspectDocuments(game, button.dataset.vehicleId));
    if (!result.error) notice = result.mismatch ? 'В документах обнаружено расхождение показаний. Реальный пробег не раскрывается.' : 'Документы и доступные записи пробега сверены.';
    if (isInspection) goInspection(); else render();
  } else if (action === 'negotiate') {
    const listing = game.listings.find(item => item.id === game.selected);
    const result = act(() => negotiate(game, listing.id, Number(document.querySelector('#offer').value)));
    if (result.counter) notice = 'Продавец предлагает встречную цену.';
    else if (result.accepted) notice = 'Продавец согласен.';
    goInspection();
  } else if (action === 'buy') {
    const listing = game.listings.find(item => item.id === game.selected);
    const result = act(() => buy(game, listing.id, listing.offer));
    if (result.bought) message(`Покупка завершена. ${result.bought.vin} — автомобиль доставлен в ваш город за ${rub(result.total)} с оформлением.`);
    else if (result.error) goInspection();
  } else if (action === 'walk') {
    advance(game, 30); const listing = game.listings.find(item => item.id === game.selected); if (listing) { listing.status = 'active'; listing.trip = false; const vehicle = vehicleForListing(game, listing); vehicle.status = 'market'; }
    game.selected = null; game.phase = 'market'; message('Вы отказались от покупки. Прошло 30 минут.'); save();
  } else if (action === 'repair-fault') {
    const card = button.closest('.fault-repair');
    const partType = card.querySelector('.repair-part').value, kind = card.querySelector('.repair-kind').value;
    const result = act(() => repairFault(game, button.dataset.vehicleId, button.dataset.faultId, partType, kind));
    if (result.repair) notice = `Неисправность устранена. Детали ${rub(result.repair.partsCost)}, работа ${rub(result.repair.laborCost)}, всего ${rub(result.cost)}.`;
    render();
  } else if (action === 'drive') {
    const result = act(() => driveVehicle(game, button.dataset.id, 30));
    if (!result.error) notice = result.symptoms.length ? `Пробная поездка: ${result.odometer.toLocaleString('ru-RU')} км. ${result.symptoms.join('; ')}` : `Пробная поездка завершена. Одометр: ${result.odometer.toLocaleString('ru-RU')} км.`;
    render();
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
    if (result.interested) message(`${result.buyer} осмотрел автомобиль и предлагает ${rub(result.price)}.`);
    else message('За день серьёзных предложений не поступило. Попробуйте позже или пересмотрите цену.');
  } else if (action === 'sell-buyer') {
    const vehicle = vehicleById(game, button.dataset.id);
    pendingConfirm = { type: 'sell', id: vehicle.id, price: vehicle.buyerOffer }; notice = ''; render();
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('.repair-part, .repair-kind')) {
    const card = event.target.closest('.fault-repair');
    const vehicle = vehicleById(game, card?.querySelector('[data-vehicle-id]')?.dataset.vehicleId || document.querySelector('[data-action="repair-fault"]')?.dataset.vehicleId);
    const fault = vehicle?.faults.find(item => item.id === card?.dataset.faultId);
    if (fault && card) {
      const quote = repairQuote(fault, card.querySelector('.repair-part').value, card.querySelector('.repair-kind').value);
      card.querySelector('.repair-estimate').textContent = `Детали ${rub(quote.partsCost)} · работа ${rub(quote.laborCost)} · ${Math.ceil(quote.minutes / 60)} ч · ресурс около ${quote.estimatedLifeKm.toLocaleString('ru-RU')} км · риск повторения ${Math.round(quote.repeatRisk * 100)}%`;
      const button = card.querySelector('[data-action="repair-fault"]');
      if (!button.disabled) button.textContent = `Ремонт · ${rub(quote.cost)}`;
    }
  }
  if (event.target.id === 'f-city') filter.city = event.target.value;
  if (event.target.id === 'f-brand') filter.brand = event.target.value;
  if (event.target.id === 'f-sort') filter.sort = event.target.value;
  if (event.target.id?.startsWith('f-')) render();
});

render();
