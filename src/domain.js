import { cities, models, names } from './data.js';

export const STARTS = [300000, 500000, 1000000, 3000000, 10000000];
export const DIAGNOSTIC_METHODS = Object.freeze({
  visual: { label: 'Визуальный осмотр', cost: 0, minutes: 30, target: 'visual', chance: .74 },
  obd: { label: 'Сканер OBD', cost: 8500, minutes: 45, target: 'obd', chance: .76 },
  service: { label: 'Комплексная диагностика', cost: 24000, minutes: 120, target: 'service', chance: .88 },
  mileage: { label: 'Проверка истории пробега', cost: 12000, minutes: 60, target: 'mileage', chance: .92 },
  compression: { label: 'Компрессометрия', available: false, target: 'engine' },
  lift: { label: 'Осмотр на подъёмнике', available: false, target: 'chassis' },
  endoscope: { label: 'Эндоскоп', available: false, target: 'engine' },
  multimeter: { label: 'Мультиметр', available: false, target: 'electrical' },
  professionalScanner: { label: 'Профессиональный сканер', available: false, target: 'obd' }
});

export const FAULT_CATALOG = Object.freeze([
  { key: 'oilLeak', name: 'Течь масла двигателя', system: 'engine', symptom: 'Следы масла под двигателем', cause: 'Уплотнение потеряло герметичность', detectableBy: ['visual', 'service'], baseCost: 26000, minutes: 180, effect: 'oilLeak' },
  { key: 'oilBurn', name: 'Повышенный расход масла', system: 'engine', symptom: 'Сизый дым после запуска', cause: 'Износ маслосъёмных колец или колпачков', detectableBy: ['obd', 'service', 'drive'], baseCost: 68000, minutes: 360, effect: 'oilBurn' },
  { key: 'timingChain', name: 'Износ цепи ГРМ', system: 'engine', symptom: 'Краткий металлический шум при запуске', cause: 'Растяжение цепи и износ натяжителя', detectableBy: ['obd', 'service'], baseCost: 74000, minutes: 420, effect: 'timingChain' },
  { key: 'misfire', name: 'Пропуски зажигания', system: 'engine', symptom: 'Двигатель работает неровно', cause: 'Неисправность катушки или свечи', detectableBy: ['obd', 'service', 'drive'], baseCost: 22000, minutes: 120, effect: 'misfire' },
  { key: 'coolingLeak', name: 'Утечка охлаждающей жидкости', system: 'cooling', symptom: 'Следы антифриза и запах после поездки', cause: 'Негерметичный шланг или соединение', detectableBy: ['visual', 'service', 'drive'], baseCost: 18000, minutes: 150, effect: 'coolingLeak' },
  { key: 'thermostat', name: 'Неисправность термостата', system: 'cooling', symptom: 'Температура двигателя колеблется', cause: 'Термостат заедает в промежуточном положении', detectableBy: ['obd', 'service', 'drive'], baseCost: 24000, minutes: 150, effect: 'thermostat' },
  { key: 'sensor', name: 'Неисправность датчика двигателя', system: 'electrical', symptom: 'Нестабильные показания и ошибка ЭБУ', cause: 'Датчик или его проводка работает с перебоями', detectableBy: ['obd', 'service'], baseCost: 16000, minutes: 100, effect: 'sensor' },
  { key: 'catalyst', name: 'Низкая эффективность катализатора', system: 'exhaust', symptom: 'Ошибка по эффективности нейтрализатора', cause: 'Катализатор выработал ресурс', detectableBy: ['obd', 'service'], baseCost: 52000, minutes: 240, effect: 'catalyst' },
  { key: 'clutch', name: 'Износ сцепления', system: 'clutch', symptom: 'Обороты растут быстрее скорости', cause: 'Изношен фрикционный диск', detectableBy: ['service', 'drive'], baseCost: 58000, minutes: 360, effect: 'clutch' },
  { key: 'gearbox', name: 'Износ коробки передач', system: 'transmission', symptom: 'Задержка или толчок при переключении', cause: 'Износ фрикционов или подшипников', detectableBy: ['obd', 'service', 'drive'], baseCost: 92000, minutes: 600, effect: 'gearbox' },
  { key: 'suspension', name: 'Люфт подвески', system: 'suspension', symptom: 'Стук на неровностях', cause: 'Износ шарнира или втулки', detectableBy: ['service', 'drive'], baseCost: 32000, minutes: 210, effect: 'suspension' },
  { key: 'steering', name: 'Люфт рулевого управления', system: 'steering', symptom: 'Свободный ход руля выше обычного', cause: 'Износ тяги или рулевого механизма', detectableBy: ['service', 'drive'], baseCost: 36000, minutes: 240, effect: 'steering' },
  { key: 'brakes', name: 'Износ тормозных дисков', system: 'brakes', symptom: 'Вибрация при торможении', cause: 'Диски и колодки выработали ресурс', detectableBy: ['visual', 'service', 'drive'], baseCost: 30000, minutes: 180, effect: 'brakes' },
  { key: 'corrosion', name: 'Коррозия кузовных элементов', system: 'body', symptom: 'Коррозия на кромках и нижних панелях', cause: 'Защитное покрытие повреждено влагой и реагентами', detectableBy: ['visual', 'service'], baseCost: 46000, minutes: 480, effect: 'corrosion' },
  { key: 'bodyRepair', name: 'Следы прежнего кузовного ремонта', system: 'body', symptom: 'Толщина покрытия различается по панелям', cause: 'Элемент окрашивали или ремонтировали', detectableBy: ['visual', 'service'], baseCost: 38000, minutes: 360, effect: 'bodyRepair' },
  { key: 'weakBattery', name: 'Слабый заряд аккумулятора', system: 'battery', symptom: 'Медленный запуск двигателя', cause: 'Аккумулятор потерял ёмкость', detectableBy: ['visual', 'obd', 'service', 'drive'], baseCost: 18000, minutes: 45, effect: 'weakBattery' },
  { key: 'tires', name: 'Износ или неравномерный износ шин', system: 'tires', symptom: 'Протектор изношен неравномерно', cause: 'Шины выработали ресурс или нарушены углы установки', detectableBy: ['visual', 'service', 'drive'], baseCost: 42000, minutes: 90, effect: 'tires' },
  { key: 'glassLight', name: 'Повреждение стекла или светотехники', system: 'glassLight', symptom: 'Скол стекла или неработающий световой элемент', cause: 'Механическое повреждение или отказ лампы', detectableBy: ['visual', 'service'], baseCost: 14000, minutes: 90, effect: 'glassLight' },
  { key: 'electrical', name: 'Сбой электрической цепи', system: 'electrical', symptom: 'Периодически появляется электрическая ошибка', cause: 'Контакт или проводка теряет соединение', detectableBy: ['obd', 'service', 'drive'], baseCost: 28000, minutes: 180, effect: 'electrical' },
  { key: 'exhaustLeak', name: 'Негерметичность выхлопа', system: 'exhaust', symptom: 'Шум выхлопа выше обычного', cause: 'Соединение или глушитель пропускает газы', detectableBy: ['visual', 'service', 'drive'], baseCost: 21000, minutes: 150, effect: 'exhaustLeak' }
]);

const PARTS = Object.freeze({
  oem: { label: 'Новая оригинальная деталь', multiplier: 1.55, quality: .98, life: 1.25, repeatRisk: .025 },
  aftermarket: { label: 'Новый аналог', multiplier: 1, quality: .83, life: .86, repeatRisk: .09 },
  used: { label: 'Деталь с разборки', multiplier: .58, quality: .65, life: .55, repeatRisk: .22 }
});

const pick = (items, random) => items[Math.floor(random() * items.length)];
const rng = seed => { let x = seed >>> 0; return () => ((x = (x + 0x6D2B79F5) | 0, Math.imul(x ^ x >>> 15, 1 | x), x ^= x + Math.imul(x ^ x >>> 7, 61 | x), ((x ^ x >>> 14) >>> 0) / 4294967296)); };
const hash = value => [...String(value)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
const base36 = (value, length) => (Math.abs(Math.trunc(value)).toString(36).toUpperCase().slice(-length).padStart(length, '0'));
const VIN_ALPHABET = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';
const vinPart = (value, length) => { let number = BigInt(Math.abs(Math.trunc(value))); let output = ''; do { output = VIN_ALPHABET[Number(number % 32n)] + output; number /= 32n; } while (number > 0n); return output.slice(-length).padStart(length, '0'); };
const vinFor = (seed, sequence) => `X9S${vinPart(seed >>> 0, 8)}${vinPart(sequence, 6)}`;
const dateForDay = day => new Date(Date.UTC(2026, 0, 1 + Math.max(0, day))).toISOString().slice(0, 10);
const roundKm = value => Math.round(value / 1000) * 1000;
const modelFor = id => models.find(model => model.id === id);
export const rub = amount => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
export const city = id => cities.find(item => item.id === id);
export const vehicleById = (state, id) => state.vehicles?.find(vehicle => vehicle.id === id) || null;
export const listingById = (state, id) => state.listings?.find(listing => listing.id === id) || null;
export const vehicleForListing = (state, listing) => listing ? vehicleById(state, listing.vehicleId) : null;
export const inventoryVehicles = state => (state.inventory || []).map(id => vehicleById(state, id)).filter(Boolean);

export function marketValue(model, year, km, condition, cityData, day) {
  const age = Math.max(0, 2026 - year);
  const ageFactor = Math.max(.52, 1 - age * .018);
  const kmFactor = Math.max(.7, 1 - Math.max(0, km - age * 9000) / 400000 * .16);
  const conditionFactor = .72 + condition * .28;
  const demandFactor = .7 + Math.max(.7, Math.min(1.3, cityData.demand)) * .3;
  const brandFactor = .94 + model.liquidity * .05;
  const season = 1 + Math.sin((day % 365) / 365 * Math.PI * 2) * .025;
  return Math.round(model.base * ageFactor * kmFactor * conditionFactor * cityData.market * demandFactor * brandFactor * season / 10000) * 10000;
}

const issueFaultKey = issue => {
  const text = String(issue).toLowerCase();
  if (/корроз|скол|кузов|днищ|арок|двер|капот|порог|рама|стекл/.test(text)) return /скол|ремонт|покрас/.test(text) ? 'bodyRepair' : 'corrosion';
  if (/сцеплен/.test(text)) return 'clutch';
  if (/рулев/.test(text)) return 'steering';
  if (/подвес|мост|раздат|шарнир|амортиз/.test(text)) return 'suspension';
  if (/короб|вариатор|акпп|мкпп|трансмисс/.test(text)) return 'gearbox';
  if (/катализ/.test(text)) return 'catalyst';
  if (/катуш|пропуск|зажиган/.test(text)) return 'misfire';
  if (/датчик|электр|дроссел|ошиб/.test(text)) return 'sensor';
  if (/термостат|охлажд|помпа|перегрев/.test(text)) return /теч|систем/.test(text) ? 'coolingLeak' : 'thermostat';
  if (/масложор|маслосъём|расход масла/.test(text)) return 'oilBurn';
  if (/течи масла|течь масла/.test(text)) return 'oilLeak';
  if (/грм|цепь/.test(text)) return 'timingChain';
  return null;
};

const createFault = (template, vehicleId, sequence, random, legacyCause = '') => ({
  id: `${vehicleId}-fault-${sequence}`,
  key: template.key,
  name: template.name,
  system: template.system,
  severity: 1 + Math.floor(random() * 3),
  symptom: template.symptom,
  cause: template.cause,
  detectableBy: [...template.detectableBy],
  repairCost: template.baseCost,
  repairTime: template.minutes,
  effect: template.effect,
  legacyCause,
  hidden: true,
  knowledge: null,
  status: 'active',
  repair: null
});

const newSystems = (random, mileage) => ({
  engine: { compressionKpa: Math.round(1080 - mileage / 1000 * .22 + random() * 110), oilLevelLitres: +(3.4 + random() * .7).toFixed(1), oilConsumptionMl1000: Math.round(30 + random() * 180), temperatureC: 88 + Math.round(random() * 5), misfiresPerMinute: 0, oilLeakMlDay: 0 },
  transmission: { oilLevelLitres: +(2.8 + random() * .6).toFixed(1), shiftDelayMs: Math.round(80 + random() * 180), abnormalNoiseDb: Math.round(34 + random() * 8), oilMileageKm: roundKm(mileage * .45) },
  clutch: { slipUnderLoad: false, engagementHeightMm: Math.round(35 + random() * 25), estimatedLifeKm: Math.max(5000, roundKm(110000 - mileage * .22)) },
  suspension: { playMm: +(0.3 + random() * 1.8).toFixed(1), knockEventsPer100Km: 0, estimatedLifeKm: Math.max(5000, roundKm(85000 - mileage * .16)) },
  steering: { freePlayDegrees: +(2 + random() * 4).toFixed(1), assistWorking: true },
  brakes: { frontDiscMm: +(20 - random() * 5).toFixed(1), rearDiscMm: +(10 - random() * 3).toFixed(1), vibration: false },
  body: { corrosionAreaCm2: Math.round(random() * 12), paintThicknessMicrons: Math.round(90 + random() * 65), repairedPanels: [], damagedPanels: [] },
  electrical: { storedCodes: [], intermittentCircuit: false },
  cooling: { coolantMl: Math.round(4300 + random() * 500), stableTemperatureC: 90 + Math.round(random() * 4), fanCyclesPerHour: Math.round(2 + random() * 4) },
  exhaust: { catalystCoPpm: Math.round(90 + random() * 180), leakNoiseDb: 0 },
  interior: { tornSeams: Math.floor(random() * 2), odor: 'обычный', seatWearMarks: Math.floor(random() * 3) },
  glassLight: { crackedGlass: 0, deadBulbs: 0 },
  tires: { treadMm: Array.from({ length: 4 }, () => +(3.5 + random() * 4).toFixed(1)), unevenWearMm: +(random() * 1.5).toFixed(1) },
  battery: { voltageV: +(12.25 + random() * .55).toFixed(2), capacityAh: Math.round(48 + random() * 18) }
});

const applyInitialFault = (systems, fault) => {
  switch (fault.effect) {
    case 'oilLeak': systems.engine.oilLeakMlDay = 20 + fault.severity * 35; systems.engine.oilLevelLitres -= .3 * fault.severity; break;
    case 'oilBurn': systems.engine.oilConsumptionMl1000 += 250 * fault.severity; break;
    case 'timingChain': systems.engine.compressionKpa -= 15 * fault.severity; break;
    case 'misfire': systems.engine.misfiresPerMinute = 2 + fault.severity * 2; break;
    case 'coolingLeak': systems.cooling.coolantMl -= 450 * fault.severity; break;
    case 'thermostat': systems.cooling.stableTemperatureC += 8 * fault.severity; break;
    case 'sensor': systems.electrical.storedCodes.push('P0xxx'); break;
    case 'catalyst': systems.exhaust.catalystCoPpm += 140 * fault.severity; break;
    case 'clutch': systems.clutch.slipUnderLoad = fault.severity > 1; break;
    case 'gearbox': systems.transmission.shiftDelayMs += 180 * fault.severity; break;
    case 'suspension': systems.suspension.playMm += .8 * fault.severity; systems.suspension.knockEventsPer100Km = fault.severity; break;
    case 'steering': systems.steering.freePlayDegrees += 2 * fault.severity; break;
    case 'brakes': systems.brakes.frontDiscMm -= 2.5 * fault.severity; systems.brakes.vibration = fault.severity > 1; break;
    case 'corrosion': systems.body.corrosionAreaCm2 += 180 * fault.severity; break;
    case 'bodyRepair': systems.body.repairedPanels.push('передняя панель'); systems.body.paintThicknessMicrons += 90; break;
    case 'weakBattery': systems.battery.voltageV -= .65 * fault.severity; break;
    case 'tires': systems.tires.treadMm = systems.tires.treadMm.map(value => Math.max(1.3, value - fault.severity * 1.2)); systems.tires.unevenWearMm += .9; break;
    case 'glassLight': systems.glassLight.crackedGlass = fault.severity > 1 ? 1 : 0; systems.glassLight.deadBulbs = 1; break;
    case 'electrical': systems.electrical.intermittentCircuit = true; break;
    case 'exhaustLeak': systems.exhaust.leakNoiseDb = 12 * fault.severity; break;
  }
};

const createEvent = (vehicle, day, type, description, options = {}) => ({
  id: `${vehicle.id}-event-${vehicle.history.length + 1}`,
  date: options.date || dateForDay(day),
  type,
  description,
  mileage: Number.isFinite(options.mileage) ? options.mileage : vehicle.odometer,
  region: options.region || vehicle.cityId,
  source: options.source || 'game',
  visibility: options.visibility || 'known'
});

export function createVehicleInstance(modelId, seed, sequence, options = {}) {
  const model = modelFor(modelId);
  if (!model) throw new Error(`Неизвестная модель автомобиля: ${modelId}`);
  const random = rng((seed >>> 0) + sequence * 7919 + hash(modelId));
  const year = options.year ?? Math.round(model.from + random() * (model.to - model.from));
  const baseMileage = options.actualMileage ?? roundKm(Math.max(8000, (2026 - year) * (6500 + random() * 9000)));
  const rollback = options.mileageTampered ?? (baseMileage > 100000 && random() < .11);
  const odometer = options.odometer ?? (rollback ? roundKm(baseMileage * (.56 + random() * .18)) : baseMileage);
  const vehicleId = options.id || `V${base36(seed >>> 0, 8)}${base36(sequence, 6)}`;
  const records = [...model.issues.split(', '), ...model.bodyIssues.split(', ')];
  const picked = options.faultKeys ? [] : records.filter(() => random() < .67);
  if (!options.faultKeys && !picked.length) picked.push(pick(records, random));
  const keys = options.faultKeys || picked.map(issueFaultKey).filter(Boolean);
  const distinctKeys = [...new Set(keys)];
  const bonus = FAULT_CATALOG.filter(fault => !distinctKeys.includes(fault.key));
  if (distinctKeys.length < 4 && random() < .34) distinctKeys.push(pick(bonus, random).key);
  const faults = distinctKeys.map((key, index) => {
    const template = FAULT_CATALOG.find(fault => fault.key === key);
    const cause = records.find(issue => issueFaultKey(issue) === key) || '';
    return createFault(template, vehicleId, index + 1, random, cause);
  });
  const condition = options.condition ?? +(0.69 + random() * .33).toFixed(2);
  const owners = options.owners ?? (1 + Math.floor(random() * 4));
  const accident = options.accident ?? random() < .09;
  const systems = newSystems(random, baseMileage);
  faults.forEach(fault => applyInitialFault(systems, fault));
  if (accident) { systems.body.damagedPanels.push('заднее крыло'); systems.body.paintThicknessMicrons += 75; }
  const registrationYear = Math.min(2025, year + 1 + Math.floor(random() * Math.max(1, 2026 - year - 1)));
  const documentMileage = roundKm(baseMileage * (rollback ? .81 : .55));
  const vehicle = {
    id: vehicleId,
    vin: options.vin || vinFor(seed, sequence),
    modelId,
    year,
    odometer,
    actualMileage: baseMileage,
    mileageTampered: !!rollback,
    lastKnownMileage: odometer,
    mileageHistory: [{ date: `${registrationYear}-06-01`, mileage: documentMileage, source: 'сервисная запись', visibility: 'checkable' }, { date: dateForDay(0), mileage: odometer, source: 'приборная панель', visibility: 'known' }],
    cityId: options.cityId || 'msk',
    originCityId: options.originCityId || options.cityId || 'msk',
    condition,
    systems,
    faults,
    history: [],
    owners,
    documents: { registrationNumber: `М${base36(seed + sequence * 31, 3)}${base36(sequence, 3)}77`, firstRegistrationYear: registrationYear, ownerCount: owners, serviceReadings: [{ year: registrationYear, mileage: documentMileage, source: 'заказ-наряд СТО' }], accidentRecord: accident, known: false, vinChecked: false },
    accidents: accident ? [{ severity: 1 + Math.floor(random() * 2), panels: ['заднее крыло'], repaired: true, hidden: true }] : [],
    repairs: [],
    expenses: { trip: 0, diagnostics: 0, purchase: 0, paperwork: 0, delivery: 0, repairs: 0, operating: 0 },
    observations: [],
    diagnosticRuns: 0,
    sourceListingId: options.sourceListingId || null,
    status: options.status || 'market',
    purchasePrice: options.purchasePrice || 0,
    delivery: options.delivery || 0,
    paperwork: options.paperwork || 0,
    repairsCost: options.repairsCost || 0,
    tripCost: options.tripCost || 0,
    diagnosticsCost: options.diagnosticsCost || 0,
    ask: options.ask || 0,
    fair: options.fair || 0,
    listedDay: options.listedDay ?? null,
    messages: options.messages || 0,
    buyerOffer: options.buyerOffer ?? null,
    buyerOfferBy: options.buyerOfferBy || null,
    buyerOfferDay: options.buyerOfferDay ?? null,
    salePrice: options.salePrice ?? null,
    profit: options.profit ?? null,
    seller: options.seller || null,
    description: options.description || '',
    trip: !!options.trip,
    listingStatus: options.listingStatus || 'active',
    marketDistance: options.marketDistance || 0
  };
  const productionYear = year;
  vehicle.history.push(createEvent(vehicle, 0, 'production', `Производство ${model.brand} ${model.model}`, { date: `${productionYear}-03-01`, mileage: 0, visibility: 'known', source: 'vehicle-record' }));
  vehicle.history.push(createEvent(vehicle, 0, 'registration', 'Первая регистрация', { date: `${registrationYear}-06-01`, mileage: documentMileage, visibility: 'checkable', source: 'registration-record' }));
  vehicle.history.push(createEvent(vehicle, 0, 'mileage', `Сервисная запись: ${documentMileage.toLocaleString('ru-RU')} км`, { date: `${registrationYear}-06-01`, mileage: documentMileage, visibility: 'checkable', source: 'service-record' }));
  if (accident) vehicle.history.push(createEvent(vehicle, 0, 'accident', 'Зафиксировано кузовное повреждение', { date: `${Math.min(2025, registrationYear + 2)}-04-12`, mileage: roundKm(baseMileage * .72), visibility: 'hidden', source: 'insurance-record' }));
  faults.forEach(fault => {
    const template = FAULT_CATALOG.find(item => item.key === fault.key);
    createEvent(vehicle, 0, 'fault', template.name, { visibility: 'hidden', source: 'inspection-record' });
  });
  return vehicle;
}

export function estimateVehicleMarketValue(vehicle, marketContext = city(vehicle.cityId), day = 0) {
  const model = modelFor(vehicle.modelId);
  if (!model || !marketContext) return 0;
  let value = marketValue(model, vehicle.year, vehicle.actualMileage ?? vehicle.odometer, vehicle.condition ?? .8, marketContext, day);
  const activeSeverity = (vehicle.faults || []).filter(fault => fault.status === 'active').reduce((sum, fault) => sum + fault.severity, 0);
  value *= Math.max(.58, 1 - activeSeverity * .045);
  const systems = vehicle.systems || {};
  const measuredPenalty = (systems.engine?.compressionKpa < 700 ? .08 : 0)
    + (systems.transmission?.shiftDelayMs > 420 ? .055 : 0)
    + (systems.brakes?.frontDiscMm < 7 ? .035 : 0)
    + (systems.body?.corrosionAreaCm2 > 300 ? .06 : 0)
    + (Math.min(...(systems.tires?.treadMm || [8])) < 2 ? .035 : 0)
    + (systems.battery?.voltageV < 11.7 ? .025 : 0)
    + (systems.cooling?.stableTemperatureC > 108 ? .07 : 0);
  value *= Math.max(.72, 1 - measuredPenalty);
  if (vehicle.accidents?.length) value *= .92;
  if (vehicle.mileageTampered) value *= .91;
  const repairRisk = (vehicle.repairs || []).reduce((sum, repair) => sum + (repair.repeatRisk || 0) * .08, 0);
  value *= Math.max(.85, 1 - repairRisk);
  if (vehicle.documents?.missing || vehicle.documents?.registrationNumber === '') value *= .78;
  return Math.max(10000, Math.round(value / 10000) * 10000);
}

export function createGame(cash, seed = Date.now()) {
  const state = { version: 2, seed: seed >>> 0, randomState: seed >>> 0, vehicleSequence: 0, marketCycle: 0, player: { name: 'Частный перекуп', home: 'msk', cash, account: 0 }, day: 0, minute: 480, phase: 'market', vehicles: [], listings: [], inventory: [], logs: [], offer: null, selected: null, slots: [], lastDeal: null };
  state.listings = generateListings(state, 12);
  return state;
}

export function generateListings(state, count = 9) {
  const cycle = state.marketCycle || 0;
  const random = rng((state.randomState || state.seed) + state.day * 1009 + cycle * 37);
  const origin = city(state.player.home);
  return Array.from({ length: count }, (_, index) => {
    const model = pick(models, random);
    const region = pick(cities.flatMap(item => Array.from({ length: Math.max(1, Math.round(item.demand * (item.popular.includes(model.brand) ? 1.3 : .8) * 10)) }, () => item)), random);
    const year = Math.round(model.from + random() * (Math.min(model.to, 2026) - model.from));
    const actualMileage = roundKm((2026 - year) * (6500 + random() * 9000));
    const sequence = ++state.vehicleSequence;
    const vehicle = createVehicleInstance(model.id, state.seed + cycle * 997 + index, sequence, { year, actualMileage, cityId: region.id });
    vehicle.fair = estimateVehicleMarketValue(vehicle, region, state.day);
    vehicle.ask = Math.round(vehicle.fair * (.91 + random() * .2) / 10000) * 10000;
    vehicle.seller = { urgency: random(), greed: random(), rapport: .2 + random() * .5, rounds: 0 };
    vehicle.description = pick(['Собственник, торг у капота.', 'На ходу, вложений по мелочи.', 'Обмен не интересует.', 'Цена обсуждается после осмотра.'], random);
    vehicle.marketDistance = distance(origin, region);
    const listing = { id: `L-${base36(state.seed, 8)}-${state.day}-${cycle}-${index}`, vehicleId: vehicle.id, ask: vehicle.ask, cityId: region.id, publishedDay: state.day, publishedMinute: state.minute, status: 'active', owner: pick(names, random), seller: vehicle.seller, description: vehicle.description, distance: vehicle.marketDistance, trip: false, tripCost: 0, offer: null, accepted: false };
    vehicle.sourceListingId = listing.id;
    state.vehicles.push(vehicle);
    return listing;
  });
}

export function refreshMarket(state, count = 9) {
  const retained = state.listings.filter(listing => listing.trip);
  const discardedIds = new Set(state.listings.filter(listing => !listing.trip).map(listing => listing.vehicleId));
  state.vehicles = state.vehicles.filter(vehicle => !discardedIds.has(vehicle.id) || state.inventory.includes(vehicle.id));
  state.marketCycle = (state.marketCycle || 0) + 1;
  state.listings = retained;
  state.listings.push(...generateListings(state, count));
  state.selected = null;
  return state.listings;
}

const distance = (a, b) => { const dx = (a.x - b.x) * 90; const dy = (a.y - b.y) * 90; return Math.round(Math.hypot(dx, dy)); };
export { distance };

export function advance(state, minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return false;
  state.minute += minutes;
  while (state.minute >= 1440) { state.minute -= 1440; state.day++; }
  return true;
}

export function spend(state, amount, description) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.player.cash) return false;
  state.player.cash -= amount;
  if (amount > 0) state.logs.unshift({ day: state.day, description, amount: -amount });
  return true;
}

function addObservation(vehicle, text, source, level, day) {
  const duplicate = vehicle.observations.find(item => item.text === text && item.source === source);
  if (!duplicate) vehicle.observations.push({ id: `${vehicle.id}-obs-${vehicle.observations.length + 1}`, text, source, level, date: dateForDay(day) });
}

export function knownFaults(vehicle) { return (vehicle.faults || []).filter(fault => fault.status === 'active' && fault.knowledge); }
export function visibleHistory(vehicle) { return (vehicle.history || []).filter(event => event.visibility === 'known'); }

export function inspectDocuments(state, vehicleId) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle) return { error: 'Автомобиль недоступен.' };
  if (vehicle.documents.known) return { ok: true, vin: vehicle.vin, registrationNumber: vehicle.documents.registrationNumber, readings: vehicle.documents.serviceReadings || [], mismatch: !!vehicle.mileageTamperingSuspected, accidents: vehicle.accidents.length };
  advance(state, 15);
  vehicle.documents.known = true;
  vehicle.documents.vinChecked = true;
  const readings = vehicle.documents.serviceReadings || [];
  for (const record of readings) {
    vehicle.lastKnownMileage = Math.max(vehicle.lastKnownMileage || 0, record.mileage);
    vehicle.mileageHistory.push({ date: `${record.year}-06-01`, mileage: record.mileage, source: record.source, visibility: 'known' });
    const event = vehicle.history.find(item => item.type === 'mileage' && item.mileage === record.mileage);
    if (event) event.visibility = 'known';
  }
  const mismatch = readings.some(record => record.mileage > vehicle.odometer + 15000);
  if (mismatch) {
    vehicle.mileageTamperingSuspected = true;
    addObservation(vehicle, 'В документах есть пробег выше показания на приборке', 'Документы', 'suspected', state.day);
  }
  if (vehicle.accidents?.length) {
    vehicle.accidents.forEach(accident => { accident.hidden = false; });
    vehicle.history.filter(event => event.type === 'accident').forEach(event => { event.visibility = 'known'; });
  }
  vehicle.history.push(createEvent(vehicle, state.day, 'document_check', 'Сверены регистрационные документы и сервисные записи', { mileage: vehicle.odometer, source: 'player-documents' }));
  return { ok: true, vin: vehicle.vin, registrationNumber: vehicle.documents.registrationNumber, readings, mismatch, accidents: vehicle.accidents.length };
}

export function diagnoseVehicle(state, vehicleId, methodId) {
  const vehicle = vehicleById(state, vehicleId);
  const method = DIAGNOSTIC_METHODS[methodId];
  if (!vehicle || !method || method.available === false || method.cost === undefined) return { error: 'Метод диагностики недоступен.' };
  if (!spend(state, method.cost, `${method.label}: ${modelFor(vehicle.modelId).brand} ${modelFor(vehicle.modelId).model}`)) return { error: 'Недостаточно средств на диагностику.' };
  advance(state, method.minutes);
  vehicle.diagnosticRuns++;
  vehicle.expenses.diagnostics += method.cost;
  vehicle.diagnosticsCost += method.cost;
  if (methodId === 'mileage') {
    const readings = vehicle.documents.serviceReadings || [];
    const mismatch = vehicle.actualMileage - vehicle.odometer > 30000 || readings.some(record => record.mileage > vehicle.odometer + 15000);
    if (mismatch) {
      vehicle.mileageTamperingSuspected = true;
      addObservation(vehicle, 'Показание одометра не согласуется с историей пробега', method.label, 'confirmed', state.day);
    } else addObservation(vehicle, 'Доступные записи пробега согласуются с одометром', method.label, 'checked', state.day);
    vehicle.history.push(createEvent(vehicle, state.day, 'diagnostic', 'Проведена специализированная проверка пробега', { source: methodId }));
    return { findings: vehicle.observations.filter(item => item.source === method.label).map(item => item.text), cost: method.cost, minutes: method.minutes };
  }
  const random = rng((state.seed >>> 0) + hash(vehicle.id) + vehicle.diagnosticRuns * 1171 + hash(methodId));
  const findings = [];
  for (const fault of vehicle.faults.filter(item => item.status === 'active' && item.detectableBy.includes(method.target))) {
    if (random() > method.chance) continue;
    const level = methodId === 'visual' ? 'symptom' : methodId === 'obd' ? (random() < .48 ? 'confirmed' : 'suspected') : (random() < .72 ? 'confirmed' : 'suspected');
    const note = pick([fault.symptom, ...vehicleFaultAdditionalSymptoms(fault)], random);
    fault.knowledge = { level, source: method.label, date: dateForDay(state.day), notes: [...(fault.knowledge?.notes || []), note] };
    fault.hidden = false;
    if (level === 'confirmed') fault.knowledge.name = fault.key;
    addObservation(vehicle, `${level === 'confirmed' ? 'Подтверждено' : level === 'suspected' ? 'Есть подозрение' : 'Обнаружено'}: ${note}`, method.label, level, state.day);
    findings.push(`${level === 'confirmed' ? 'Подтверждено' : level === 'suspected' ? 'Есть подозрение' : 'Обнаружено'}: ${note}`);
  }
  if (methodId === 'visual' || methodId === 'service') {
    for (const accident of vehicle.accidents.filter(item => item.hidden)) {
      if (random() > (methodId === 'visual' ? .58 : .78)) continue;
      accident.hidden = false;
      const note = methodId === 'visual' ? 'Неодинаковые зазоры и оттенок краски на соседних панелях' : 'Следы кузовного ремонта подтверждены толщиномером';
      addObservation(vehicle, `${methodId === 'visual' ? 'Обнаружено' : 'Подтверждено'}: ${note}`, method.label, methodId === 'visual' ? 'symptom' : 'confirmed', state.day);
      vehicle.history.filter(event => event.type === 'accident').forEach(event => { event.visibility = 'known'; });
      findings.push(`${methodId === 'visual' ? 'Обнаружено' : 'Подтверждено'}: ${note}`);
    }
  }
  vehicle.history.push(createEvent(vehicle, state.day, 'diagnostic', `${method.label}: ${findings.length ? `обнаружено признаков ${findings.length}` : 'явных признаков не найдено'}`, { source: methodId }));
  return { findings, cost: method.cost, minutes: method.minutes };
}

function vehicleFaultAdditionalSymptoms(fault) {
  const extras = {
    oilLeak: ['Масляная плёнка на нижней части двигателя'], oilBurn: ['Уровень масла ниже сервисной отметки'], timingChain: ['Шум со стороны привода ГРМ'], misfire: ['Неровный холостой ход'], coolingLeak: ['Следы высохшего антифриза'], thermostat: ['Температура медленно выходит на рабочий режим'], sensor: ['В памяти блока есть код неисправности'], catalyst: ['Показания датчиков выхлопа расходятся'], clutch: ['Точка схватывания находится высоко'], gearbox: ['Переключение сопровождается толчком'], suspension: ['Неравномерный износ передних шин'], steering: ['Рулю требуется корректировка на прямой'], brakes: ['На диске видна выработка'], corrosion: ['На кромке панели вздулась краска'], bodyRepair: ['Зазор соседних панелей отличается'], weakBattery: ['Напряжение после стоянки снижено'], tires: ['На одной оси различается глубина протектора'], glassLight: ['Один из световых элементов не работает'], electrical: ['Ошибка возникает периодически'], exhaustLeak: ['Слышен металлический призвук выхлопа']
  };
  return extras[fault.effect] || [];
}

export function examine(state, listingIdOrVehicleId, methodId) {
  const listing = listingById(state, listingIdOrVehicleId);
  const vehicle = listing ? vehicleForListing(state, listing) : vehicleById(state, listingIdOrVehicleId);
  if (!vehicle || (listing && !listing.trip)) return { error: 'Сначала нужно приехать к продавцу.' };
  const result = diagnoseVehicle(state, vehicle.id, methodId);
  if (!result.error && listing) listing.diag = methodId;
  return result;
}

const sellerFloor = (listing, vehicle) => {
  const seller = listing.seller || { urgency: .35, greed: .5, rapport: .35 };
  return Math.min(listing.ask, Math.max(vehicle.fair * .65, vehicle.fair * (.77 + .16 * seller.greed - .12 * seller.urgency - .035 * seller.rapport + (1 - vehicle.condition) * .05)));
};

export function negotiate(state, listingId, offer) {
  const listing = listingById(state, listingId), vehicle = vehicleForListing(state, listing);
  if (!listing || !vehicle || !listing.trip) return { error: 'Нужно находиться у продавца.' };
  if (!Number.isFinite(offer) || offer < 0) return { error: 'Укажите корректную сумму.' };
  advance(state, 10);
  const seller = listing.seller || (listing.seller = { urgency: .35, greed: .5, rapport: .35, rounds: 0 });
  const floor = sellerFloor(listing, vehicle);
  seller.rounds++;
  if (offer >= floor) { listing.offer = offer; listing.accepted = true; return { accepted: true, price: offer }; }
  const gap = Math.max(0, listing.ask - offer);
  const concession = .22 + seller.urgency * .28 + seller.rapport * .16 + (1 - seller.greed) * .12;
  listing.offer = Math.min(listing.ask, Math.ceil(Math.max(floor, offer + gap * concession) / 10000) * 10000);
  seller.rapport = Math.min(1, seller.rapport + .035);
  listing.accepted = false;
  return { accepted: false, counter: listing.offer };
}

export function tripQuote(distanceKm) { const km = Math.max(0, distanceKm); return { cost: 1000 + Math.round(km * 1.7) + Math.round(km / 650) * 4200, minutes: Math.max(180, Math.ceil(km / 65) * 60), hours: Math.max(3, Math.ceil(km / 70)) }; }

export function travelToListing(state, listingId) {
  const listing = listingById(state, listingId), vehicle = vehicleForListing(state, listing);
  if (!listing || !vehicle || listing.status === 'sold') return { error: 'Объявление больше недоступно.' };
  if (listing.trip) return { error: 'Вы уже находитесь у продавца.' };
  const quote = tripQuote(listing.distance);
  if (!spend(state, quote.cost, `Поездка к продавцу в ${city(vehicle.cityId).name}`)) return { error: `Для поездки нужно ${rub(quote.cost)}.` };
  advance(state, quote.minutes);
  listing.trip = true; listing.status = 'viewing'; listing.tripCost = quote.cost;
  vehicle.tripCost += quote.cost; vehicle.expenses.trip += quote.cost; vehicle.status = 'viewing';
  vehicle.history.push(createEvent(vehicle, state.day, 'inspection_visit', 'Игрок осмотрел автомобиль у продавца', { source: 'player' }));
  return { quote, listing, vehicle };
}

export function buy(state, listingId, price) {
  const listing = listingById(state, listingId), vehicle = vehicleForListing(state, listing), model = vehicle && modelFor(vehicle.modelId);
  if (!listing || !vehicle || !listing.trip || !model) return { error: 'Сделка недоступна.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Цена покупки должна быть больше нуля.' };
  if (listing.offer !== price) return { error: 'Сначала согласуйте цену с продавцом.' };
  const paperwork = Math.round(price * .012) + 6500, shipping = Math.max(5000, Math.round(listing.distance * 72)), total = price + paperwork + shipping;
  if (!spend(state, total, `Покупка, оформление и доставка ${model.brand} ${model.model}`)) return { error: `Нужно ${rub(total)} с учётом доставки и оформления.` };
  advance(state, Math.round(listing.distance / 50 * 60) + 240);
  vehicle.purchasePrice = price; vehicle.expenses.purchase += price; vehicle.paperwork = paperwork; vehicle.delivery = shipping; vehicle.expenses.paperwork += paperwork; vehicle.expenses.delivery += shipping;
  vehicle.cityId = state.player.home; vehicle.owners++; vehicle.status = 'garage'; vehicle.documents.known = true; vehicle.documents.vinChecked = true; vehicle.documents.ownerCount = vehicle.owners;
  vehicle.history.push(createEvent(vehicle, state.day, 'ownership_change', `Покупка у ${listing.owner}; оформление и доставка в ${city(state.player.home).name}`, { source: 'player', region: state.player.home }));
  state.inventory.push(vehicle.id); state.listings = state.listings.filter(item => item.id !== listingId); state.selected = vehicle.id; state.phase = 'garage';
  return { bought: vehicle, total };
}

export function repairCost(home, kind) { const area = city(home); return Math.round((kind === 'service' ? 42000 : 12000) * area.service); }

export function repairQuote(fault, partType = 'aftermarket', kind = 'service') {
  const part = PARTS[partType];
  if (!part) return null;
  const partsCost = Math.round(fault.repairCost * .62 * part.multiplier);
  const laborCost = Math.round(fault.repairCost * .38 * (kind === 'service' ? 1 : .62));
  const quality = +(part.quality * (kind === 'service' ? 1 : .88)).toFixed(2);
  return { partType, partName: part.label, partsCost, laborCost, cost: partsCost + laborCost, minutes: Math.ceil(fault.repairTime * (kind === 'service' ? 1 : 1.55)), quality, estimatedLifeKm: Math.round(18000 * part.life * quality), repeatRisk: +(part.repeatRisk + (kind === 'self' ? .04 : 0)).toFixed(3) };
}

function applyRepairEffect(vehicle, fault) {
  const systems = vehicle.systems;
  switch (fault.effect) {
    case 'oilLeak': systems.engine.oilLeakMlDay = 0; systems.engine.oilLevelLitres = Math.max(3.6, systems.engine.oilLevelLitres); break;
    case 'oilBurn': systems.engine.oilConsumptionMl1000 = Math.min(120, systems.engine.oilConsumptionMl1000); break;
    case 'timingChain': systems.engine.compressionKpa += 35; break;
    case 'misfire': systems.engine.misfiresPerMinute = 0; break;
    case 'coolingLeak': systems.cooling.coolantMl = Math.max(4300, systems.cooling.coolantMl); break;
    case 'thermostat': systems.cooling.stableTemperatureC = Math.min(96, systems.cooling.stableTemperatureC); break;
    case 'sensor': systems.electrical.storedCodes = []; break;
    case 'catalyst': systems.exhaust.catalystCoPpm = Math.min(220, systems.exhaust.catalystCoPpm); break;
    case 'clutch': systems.clutch.slipUnderLoad = false; systems.clutch.estimatedLifeKm = 100000; break;
    case 'gearbox': systems.transmission.shiftDelayMs = Math.min(160, systems.transmission.shiftDelayMs); break;
    case 'suspension': systems.suspension.playMm = Math.max(.4, systems.suspension.playMm - 1.5 * fault.severity); systems.suspension.knockEventsPer100Km = 0; break;
    case 'steering': systems.steering.freePlayDegrees = Math.max(2, systems.steering.freePlayDegrees - 3 * fault.severity); break;
    case 'brakes': systems.brakes.frontDiscMm = Math.max(18, systems.brakes.frontDiscMm); systems.brakes.vibration = false; break;
    case 'corrosion': systems.body.corrosionAreaCm2 = Math.max(0, systems.body.corrosionAreaCm2 - 120 * fault.severity); break;
    case 'bodyRepair': systems.body.repairedPanels.push('передняя панель'); break;
    case 'weakBattery': systems.battery.voltageV = Math.max(12.55, systems.battery.voltageV); break;
    case 'tires': systems.tires.treadMm = systems.tires.treadMm.map(value => Math.max(6, value)); systems.tires.unevenWearMm = Math.min(1, systems.tires.unevenWearMm); break;
    case 'glassLight': systems.glassLight.crackedGlass = 0; systems.glassLight.deadBulbs = 0; break;
    case 'electrical': systems.electrical.intermittentCircuit = false; break;
    case 'exhaustLeak': systems.exhaust.leakNoiseDb = 0; break;
  }
}

export function repairFault(state, vehicleId, faultId, partType = 'aftermarket', kind = 'service') {
  const vehicle = vehicleById(state, vehicleId);
  const fault = vehicle?.faults.find(item => item.id === faultId && item.status === 'active');
  if (!vehicle || !state.inventory.includes(vehicleId) || vehicle.status !== 'garage' || !fault) return { error: 'Неисправность недоступна для ремонта.' };
  if (fault.knowledge?.level !== 'confirmed') return { error: 'Сначала подтвердите неисправность диагностикой.' };
  const quote = repairQuote(fault, partType, kind);
  if (!quote) return { error: 'Неизвестный тип запчасти.' };
  if (!spend(state, quote.cost, `Ремонт: ${fault.name || fault.symptom} (${quote.partName})`)) return { error: 'Недостаточно средств на ремонт.' };
  advance(state, quote.minutes);
  applyRepairEffect(vehicle, fault);
  fault.status = 'repaired';
  const repairRecord = { id: `${fault.id}-repair-${vehicle.repairs.length + 1}`, date: dateForDay(state.day), faultId: fault.id, faultName: fault.name, partType, partName: quote.partName, partsCost: quote.partsCost, laborCost: quote.laborCost, cost: quote.cost, kind, quality: quote.quality, estimatedLifeKm: quote.estimatedLifeKm, repeatRisk: quote.repeatRisk, kmSinceRepair: 0, riskChecked: false, result: 'устранено', mileage: vehicle.odometer, service: kind === 'service' ? 'Сервис' : 'Самостоятельно' };
  fault.repair = repairRecord; vehicle.repairs.push(repairRecord); vehicle.repairsCost += quote.cost; vehicle.expenses.repairs += quote.cost;
  if (fault.system === 'body') vehicle.condition = Math.min(1.08, vehicle.condition + .035);
  vehicle.history.push(createEvent(vehicle, state.day, 'repair', `${fault.name}: ${quote.partName}, детали ${rub(quote.partsCost)}, работа ${rub(quote.laborCost)}, ${repairRecord.service}`, { mileage: vehicle.odometer, source: 'player-repair' }));
  return { cost: quote.cost, quote, repair: repairRecord, fault };
}

export function repair(state, vehicleId, kind = 'self') {
  const vehicle = vehicleById(state, vehicleId);
  const fault = vehicle && knownFaults(vehicle)[0];
  if (!fault) return { error: 'Сначала найдите неисправность, которую можно отремонтировать.' };
  return repairFault(state, vehicleId, fault.id, 'aftermarket', kind);
}

export function driveVehicle(state, vehicleId, distanceKm = 30) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle || !state.inventory.includes(vehicleId) || !['garage', 'listed'].includes(vehicle.status)) return { error: 'Автомобиль нельзя использовать в поездке.' };
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 1000) return { error: 'Укажите поездку от 1 до 1 000 км.' };
  const model = modelFor(vehicle.modelId), fuelCost = Math.round(model.consumption * distanceKm / 100 * city(state.player.home).fuel);
  if (!spend(state, fuelCost, `Топливо и поездка ${model.brand} ${model.model}`)) return { error: 'Недостаточно средств на топливо.' };
  const startMileage = vehicle.odometer;
  vehicle.odometer += Math.round(distanceKm); vehicle.actualMileage += Math.round(distanceKm); vehicle.lastKnownMileage = vehicle.odometer;
  vehicle.mileageHistory.push({ date: dateForDay(state.day), mileage: vehicle.odometer, source: 'поездка игрока', visibility: 'known' });
  vehicle.systems.engine.oilMileageKm += distanceKm;
  vehicle.systems.tires.treadMm = vehicle.systems.tires.treadMm.map(value => Math.max(1.6, +(value - distanceKm / 65000).toFixed(2)));
  vehicle.systems.brakes.frontDiscMm = Math.max(4, +(vehicle.systems.brakes.frontDiscMm - distanceKm / 70000).toFixed(2));
  vehicle.expenses.operating += fuelCost; advance(state, Math.max(20, Math.ceil(distanceKm / 60 * 60)));
  const random = rng((state.seed >>> 0) + hash(vehicle.id) + vehicle.odometer + state.day);
  const symptoms = [];
  for (const fault of vehicle.faults) {
    if (fault.status === 'active' && fault.detectableBy.includes('drive')) {
      if (fault.effect === 'thermostat' || fault.effect === 'coolingLeak') {
        vehicle.systems.cooling.stableTemperatureC += fault.severity * 4;
        if (fault.severity >= 2 && distanceKm >= 50) {
          vehicle.systems.engine.compressionKpa = Math.max(520, vehicle.systems.engine.compressionKpa - 18);
          vehicle.condition = Math.max(.45, vehicle.condition - .025);
        }
      }
      if (fault.effect === 'clutch') vehicle.systems.clutch.slipUnderLoad = true;
      if (fault.effect === 'suspension') vehicle.systems.suspension.knockEventsPer100Km += 1;
      if (fault.effect === 'brakes') vehicle.systems.brakes.vibration = true;
      const note = pick([fault.symptom, ...vehicleFaultAdditionalSymptoms(fault)], random);
      symptoms.push(note);
      if (!fault.knowledge) fault.knowledge = { level: 'symptom', source: 'Пробная поездка', date: dateForDay(state.day), notes: [note] };
      addObservation(vehicle, `В поездке: ${note}`, 'Пробная поездка', 'symptom', state.day);
    }
    const record = fault.repair;
    if (record && !record.riskChecked) {
      record.kmSinceRepair += distanceKm;
      if (record.kmSinceRepair >= record.estimatedLifeKm) {
        record.riskChecked = true;
        if (random() < record.repeatRisk) {
          fault.status = 'active'; fault.hidden = false; fault.knowledge = { level: 'suspected', source: 'Повторная неисправность после ремонта', date: dateForDay(state.day), notes: ['После пробега снова появился прежний симптом'] };
          record.result = 'неисправность вернулась';
          symptoms.push(`После ремонта вновь проявился дефект: ${fault.symptom.toLowerCase()}`);
        }
      }
    }
  }
  vehicle.history.push(createEvent(vehicle, state.day, 'mileage', `Пробная поездка ${Math.round(distanceKm)} км: ${startMileage.toLocaleString('ru-RU')} → ${vehicle.odometer.toLocaleString('ru-RU')} км`, { source: 'player-drive' }));
  if (vehicle.systems.cooling.stableTemperatureC > 112) {
    symptoms.push('Температура двигателя приблизилась к опасному диапазону');
    addObservation(vehicle, symptoms.at(-1), 'Пробная поездка', 'urgent', state.day);
  }
  return { distanceKm, fuelCost, minutes: Math.max(20, Math.ceil(distanceKm / 60 * 60)), odometer: vehicle.odometer, symptoms, warning: symptoms.some(item => /температур|торможен|сцеплен/i.test(item)) };
}

export function listForSale(state, vehicleId, price) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle || vehicle.status !== 'garage') return { error: 'Автомобиль недоступен.' };
  if (!Number.isFinite(price) || price < 10000) return { error: 'Цена должна быть не меньше 10 000 ₽.' };
  vehicle.ask = Math.max(10000, Math.round(price / 10000) * 10000); vehicle.fair = estimateVehicleMarketValue(vehicle, city(state.player.home), state.day);
  vehicle.status = 'listed'; vehicle.listedDay = state.day; vehicle.messages = 0; vehicle.buyerOffer = null; vehicle.buyerOfferBy = null; vehicle.buyerOfferDay = null;
  vehicle.history.push(createEvent(vehicle, state.day, 'listing', `Объявление опубликовано за ${rub(vehicle.ask)}`, { source: 'player-listing' }));
  state.phase = 'garage'; advance(state, 5); return { ok: true };
}

export function updateAsk(state, vehicleId, price) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle || vehicle.status !== 'listed') return { error: 'Нет активного объявления.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Цена должна быть больше нуля.' };
  const next = Math.max(10000, Math.round(price / 10000) * 10000), previous = vehicle.ask;
  if (next === previous) return { ok: true, changed: false, price: next };
  const offerCleared = Number.isFinite(vehicle.buyerOffer);
  vehicle.ask = next; vehicle.fair = estimateVehicleMarketValue(vehicle, city(state.player.home), state.day); vehicle.buyerOffer = null; vehicle.buyerOfferBy = null; vehicle.buyerOfferDay = null;
  advance(state, 5); vehicle.history.push(createEvent(vehicle, state.day, 'listing_price', `Цена изменена с ${rub(previous)} на ${rub(next)}`, { source: 'player-listing' }));
  return { ok: true, changed: true, previous, price: next, offerCleared };
}

export function buyers(state, vehicleId) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle || vehicle.status !== 'listed') return { error: 'Сначала разместите объявление.' };
  const random = rng((state.seed >>> 0) + vehicle.listedDay * 773 + vehicle.messages * 101 + hash(vehicle.id));
  advance(state, 720 + Math.floor(random() * 720)); vehicle.messages++;
  const model = modelFor(vehicle.modelId), region = city(vehicle.cityId);
  const competing = state.listings.filter(listing => listing.cityId === vehicle.cityId && vehicleForListing(state, listing)?.modelId === vehicle.modelId).length + inventoryVehicles(state).filter(item => item.id !== vehicle.id && item.status === 'listed' && item.cityId === vehicle.cityId && item.modelId === vehicle.modelId).length;
  const currentValue = estimateVehicleMarketValue(vehicle, region, state.day);
  const priceInterest = Math.max(.12, Math.min(.88, .63 - (vehicle.ask - currentValue) / currentValue * .9));
  const brandDemand = region.popular.includes(model.brand) ? 1.12 : .9, supplyFactor = 1 / (1 + competing * .16);
  const interest = Math.max(.08, Math.min(.92, priceInterest * model.liquidity * region.demand * brandDemand * supplyFactor));
  const interested = random() < interest;
  let price = 0, buyer = null;
  if (interested) {
    buyer = pick(names, random);
    const repairTransparency = Math.max(.82, 1 - vehicle.repairs.reduce((sum, item) => sum + Math.max(0, .78 - item.quality) * .13, 0));
    price = Math.round(vehicle.ask * (.91 + random() * .07) * repairTransparency / 10000) * 10000;
    vehicle.buyerOffer = price; vehicle.buyerOfferBy = buyer; vehicle.buyerOfferDay = state.day;
    vehicle.history.push(createEvent(vehicle, state.day, 'buyer_inspection', 'Покупатель осмотрел автомобиль и сделал предложение', { source: 'market-buyer' }));
  }
  return { interested, price, interest, competing, days: Math.floor((state.day - vehicle.listedDay) / 1), buyer };
}

export function dealCost(vehicle) { return (vehicle.tripCost || 0) + (vehicle.diagnosticsCost || 0) + (vehicle.purchasePrice || 0) + (vehicle.delivery || 0) + (vehicle.paperwork || 0) + (vehicle.repairsCost || 0) + (vehicle.expenses?.operating || 0); }

export function sell(state, vehicleId, price) {
  const vehicle = vehicleById(state, vehicleId);
  if (!vehicle || vehicle.status !== 'listed') return { error: 'Нет активного объявления.' };
  if (!Number.isFinite(price) || !Number.isFinite(vehicle.buyerOffer) || price !== vehicle.buyerOffer) return { error: 'Продать можно только по действующему предложению покупателя.' };
  if (state.day - (vehicle.buyerOfferDay ?? state.day) > 3) { vehicle.buyerOffer = null; vehicle.buyerOfferBy = null; vehicle.buyerOfferDay = null; return { error: 'Предложение покупателя истекло. Подождите нового.' }; }
  advance(state, 30);
  const revenue = price, cost = dealCost(vehicle), profit = revenue - cost, model = modelFor(vehicle.modelId);
  state.player.cash += revenue; state.logs.unshift({ day: state.day, description: `Продажа ${model.brand} ${model.model}`, amount: revenue });
  vehicle.status = 'sold'; vehicle.listingStatus = 'sold'; vehicle.salePrice = revenue; vehicle.profit = profit; vehicle.owners++;
  vehicle.history.push(createEvent(vehicle, state.day, 'sale', `Продан ${vehicle.buyerOfferBy || 'покупателю'} за ${rub(revenue)}; результат сделки ${rub(profit)}`, { source: 'player-sale' }));
  state.lastDeal = { profit, revenue, cost, name: `${model.brand} ${model.model}`, vehicleId };
  state.phase = 'market'; state.selected = null;
  return { profit, vehicle };
}

export function inventoryValue(state) { return inventoryVehicles(state).filter(vehicle => vehicle.status !== 'sold').reduce((sum, vehicle) => sum + estimateVehicleMarketValue(vehicle, city(state.player.home), state.day), 0); }
export function netWorth(state) { return state.player.cash + state.player.account + inventoryValue(state); }

function legacyVehicle(state, oldVehicle, listing, sequence) {
  const model = modelFor(oldVehicle.modelId);
  const options = {
    id: `V${base36(state.seed + sequence, 8)}${base36(sequence, 6)}`,
    vin: oldVehicle.vin || vinFor(state.seed, sequence), year: oldVehicle.year, actualMileage: oldVehicle.actualMileage ?? oldVehicle.km,
    odometer: oldVehicle.odometer ?? oldVehicle.km, cityId: oldVehicle.cityId || state.player.home,
    condition: oldVehicle.condition, owners: oldVehicle.owners, ask: oldVehicle.ask, fair: oldVehicle.fair,
    sourceListingId: listing?.id || oldVehicle.id, tripCost: oldVehicle.tripCost, diagnosticsCost: oldVehicle.diagnosticsCost,
    purchasePrice: oldVehicle.purchasePrice, delivery: oldVehicle.delivery, paperwork: oldVehicle.paperwork,
    repairsCost: oldVehicle.repairs ?? oldVehicle.repairsCost, status: listing ? (listing.trip ? 'viewing' : 'market') : oldVehicle.stage === 'sold' ? 'sold' : oldVehicle.stage === 'listed' ? 'listed' : 'garage',
    trip: listing?.trip, description: listing?.description || oldVehicle.description
  };
  const keys = [...new Set((oldVehicle.hidden || []).map(issueFaultKey).filter(Boolean))];
  if (keys.length) options.faultKeys = keys;
  const vehicle = createVehicleInstance(oldVehicle.modelId, state.seed, sequence, options);
  vehicle.id = options.id; vehicle.vin = options.vin; vehicle.sourceListingId = options.sourceListingId;
  vehicle.fair = oldVehicle.fair || estimateVehicleMarketValue(vehicle, city(vehicle.cityId), state.day);
  vehicle.ask = oldVehicle.ask || 0; vehicle.tripCost = oldVehicle.tripCost || 0; vehicle.diagnosticsCost = oldVehicle.diagnosticsCost || 0;
  vehicle.expenses.trip = vehicle.tripCost; vehicle.expenses.diagnostics = vehicle.diagnosticsCost; vehicle.purchasePrice = oldVehicle.purchasePrice || 0;
  vehicle.expenses.purchase = vehicle.purchasePrice; vehicle.delivery = oldVehicle.delivery || 0; vehicle.paperwork = oldVehicle.paperwork || 0;
  vehicle.repairsCost = oldVehicle.repairs ?? oldVehicle.repairsCost ?? 0; vehicle.expenses.repairs = vehicle.repairsCost;
  vehicle.cityId = oldVehicle.cityId || vehicle.cityId; vehicle.originCityId = vehicle.cityId; vehicle.owners = oldVehicle.owners || vehicle.owners;
  vehicle.seller = listing?.seller || oldVehicle.seller || null; vehicle.description = listing?.description || oldVehicle.description || '';
  vehicle.trip = !!listing?.trip; vehicle.marketDistance = listing?.distance || 0; vehicle.listedDay = oldVehicle.listedDay ?? null;
  vehicle.messages = oldVehicle.messages || 0; vehicle.buyerOffer = oldVehicle.buyerOffer ?? null; vehicle.buyerOfferBy = oldVehicle.buyerOfferBy || null; vehicle.buyerOfferDay = oldVehicle.buyerOfferDay ?? null;
  vehicle.salePrice = oldVehicle.salePrice ?? null; vehicle.profit = oldVehicle.profit ?? null;
  vehicle.documents.known = !listing; vehicle.documents.vinChecked = !listing;
  const oldHistory = Array.isArray(oldVehicle.history) ? oldVehicle.history : [];
  for (const text of oldHistory) vehicle.history.push(createEvent(vehicle, state.day, 'legacy', String(text), { source: 'legacy-save' }));
  const oldFindings = Array.isArray(oldVehicle.found) ? oldVehicle.found : [];
  for (const text of oldFindings) addObservation(vehicle, `Из прежней диагностики: ${text}`, 'Старое сохранение', 'known', state.day);
  if (oldFindings.length) vehicle.faults.slice(0, oldFindings.length).forEach((fault, index) => { fault.knowledge = { level: 'confirmed', source: 'Старое сохранение', date: dateForDay(state.day), notes: [oldFindings[index]] }; fault.hidden = false; });
  if (!model) return null;
  return vehicle;
}

export function restoreGame(candidate) {
  if (!candidate || ![1, 2].includes(candidate.version) || !candidate.player || !Number.isFinite(candidate.player.cash) || !Array.isArray(candidate.listings) || !Array.isArray(candidate.inventory) || !Array.isArray(candidate.logs)) return null;
  const cityIds = new Set(cities.map(item => item.id)), modelIds = new Set(models.map(item => item.id));
  const state = { ...candidate, version: 2, seed: Number.isFinite(candidate.seed) ? candidate.seed >>> 0 : 1, randomState: Number.isFinite(candidate.randomState) ? candidate.randomState >>> 0 : (candidate.seed >>> 0), vehicleSequence: candidate.vehicleSequence || 0, marketCycle: Number.isFinite(candidate.marketCycle) ? candidate.marketCycle : 0,
    day: Number.isFinite(candidate.day) ? Math.max(0, Math.floor(candidate.day)) : 0, minute: Number.isFinite(candidate.minute) ? Math.max(0, Math.min(1439, Math.floor(candidate.minute))) : 480,
    phase: ['market', 'garage', 'map', 'ledger'].includes(candidate.phase) ? candidate.phase : 'market', player: { ...candidate.player, name: typeof candidate.player.name === 'string' ? candidate.player.name : 'Частный перекуп', home: cityIds.has(candidate.player.home) ? candidate.player.home : 'msk', account: Number.isFinite(candidate.player.account) ? candidate.player.account : 0 },
    vehicles: [], listings: [], inventory: [], logs: candidate.logs.filter(log => log && Number.isFinite(log.amount) && typeof log.description === 'string'), selected: typeof candidate.selected === 'string' ? candidate.selected : null, slots: [] };
  if (candidate.version === 2 && Array.isArray(candidate.vehicles) && candidate.inventory.every(id => typeof id === 'string')) {
    state.vehicles = candidate.vehicles.filter(vehicle => vehicle && typeof vehicle.id === 'string' && modelIds.has(vehicle.modelId) && cityIds.has(vehicle.cityId)).map(vehicle => ({ ...vehicle, history: Array.isArray(vehicle.history) ? vehicle.history : [], mileageHistory: Array.isArray(vehicle.mileageHistory) ? vehicle.mileageHistory : [], faults: Array.isArray(vehicle.faults) ? vehicle.faults : [], observations: Array.isArray(vehicle.observations) ? vehicle.observations : [], repairs: Array.isArray(vehicle.repairs) ? vehicle.repairs : [], expenses: { trip: 0, diagnostics: 0, purchase: 0, paperwork: 0, delivery: 0, repairs: 0, operating: 0, ...vehicle.expenses }, documents: { serviceReadings: [], known: false, vinChecked: false, ...vehicle.documents }, diagnosticRuns: vehicle.diagnosticRuns || 0 }));
    const vehicleIds = new Set(state.vehicles.map(vehicle => vehicle.id));
    state.inventory = [...new Set(candidate.inventory.filter(id => vehicleIds.has(id)))];
    state.listings = candidate.listings.filter(listing => listing && typeof listing.id === 'string' && vehicleIds.has(listing.vehicleId)).map(listing => ({ ...listing, seller: listing.seller || { urgency: .35, greed: .5, rapport: .35, rounds: 0 } }));
  } else {
    const oldListingToNew = new Map();
    let sequence = 0;
    for (const oldListing of candidate.listings) {
      if (!oldListing || !modelIds.has(oldListing.modelId) || !cityIds.has(oldListing.cityId)) continue;
      const vehicle = legacyVehicle(state, oldListing, oldListing, ++sequence);
      if (!vehicle) continue;
      state.vehicles.push(vehicle); state.vehicleSequence = sequence; oldListingToNew.set(oldListing.id, vehicle.id);
      state.listings.push({ id: oldListing.id, vehicleId: vehicle.id, ask: oldListing.ask, cityId: oldListing.cityId, publishedDay: oldListing.publishedDay ?? state.day, publishedMinute: oldListing.publishedMinute ?? state.minute, status: oldListing.status || (oldListing.trip ? 'viewing' : 'active'), owner: oldListing.owner || 'Продавец', seller: oldListing.seller || { urgency: .35, greed: .5, rapport: .35, rounds: 0 }, description: oldListing.description || '', distance: oldListing.distance || 0, trip: !!oldListing.trip, tripCost: oldListing.tripCost || 0, offer: oldListing.offer ?? null, accepted: !!oldListing.accepted, diag: oldListing.diag || 0 });
    }
    for (const oldVehicle of candidate.inventory) {
      if (!oldVehicle || !modelIds.has(oldVehicle.modelId) || !cityIds.has(oldVehicle.cityId)) continue;
      const vehicle = legacyVehicle(state, oldVehicle, null, ++sequence);
      if (!vehicle) continue;
      vehicle.status = oldVehicle.stage === 'sold' ? 'sold' : oldVehicle.stage === 'listed' ? 'listed' : 'garage';
      state.vehicles.push(vehicle); state.inventory.push(vehicle.id); state.vehicleSequence = sequence;
    }
    if (state.selected && oldListingToNew.has(state.selected)) state.selected = candidate.selected;
  }
  return state;
}
