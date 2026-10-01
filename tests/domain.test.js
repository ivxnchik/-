import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, createVehicleInstance, vehicleForListing, vehicleById, inventoryVehicles,
  diagnoseVehicle, inspectDocuments, repairFault, repairQuote, estimateVehicleMarketValue,
  driveVehicle, travelToListing, negotiate, buy, listForSale, buyers, sell, dealCost,
  restoreGame, DIAGNOSTIC_METHODS, FAULT_CATALOG
} from '../src/domain.js';

test('vehicle ids and VINs are separate, unique within a market, and same-model state is independent', () => {
  const game = createGame(1000000, 12001);
  const vins = game.vehicles.map(vehicle => vehicle.vin);
  assert.equal(new Set(vins).size, vins.length);
  assert.ok(vins.every(vin => vin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin)));
  assert.ok(game.listings.every(listing => listing.id !== listing.vehicleId));
  const first = createVehicleInstance('m3', 99, 1);
  const second = createVehicleInstance('m3', 99, 2);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.vin, second.vin);
  second.systems.engine.oilLevelLitres += 1;
  assert.notEqual(first.systems.engine.oilLevelLitres, second.systems.engine.oilLevelLitres);
});

test('the fault library is compact and each generated vehicle has independent physical state', () => {
  assert.equal(FAULT_CATALOG.length, 20);
  const first = createVehicleInstance('m14', 500, 1);
  const second = createVehicleInstance('m14', 501, 1);
  assert.notDeepEqual(first.systems, second.systems);
  assert.ok(Object.keys(first.systems).length >= 12);
  assert.ok(first.faults.every(fault => fault.hidden && !fault.knowledge));
  assert.ok(first.history.every(event => ['id', 'date', 'type', 'description', 'mileage', 'region', 'source', 'visibility'].every(key => key in event)));
});

test('OBD and visual channels do not reveal faults outside their capability', () => {
  const game = createGame(1000000, 212);
  const vehicle = createVehicleInstance('m3', 212, 1, { faultKeys: ['suspension', 'corrosion'] });
  game.vehicles.push(vehicle);
  const suspension = vehicle.faults.find(fault => fault.key === 'suspension');
  const corrosion = vehicle.faults.find(fault => fault.key === 'corrosion');
  diagnoseVehicle(game, vehicle.id, 'obd');
  assert.equal(suspension.knowledge, null);
  assert.equal(corrosion.knowledge, null);
  assert.equal(vehicle.observations.some(item => item.text.includes(suspension.name)), false);
  diagnoseVehicle(game, vehicle.id, 'visual');
  assert.equal(suspension.knowledge, null);
  assert.ok(vehicle.observations.every(item => !item.text.includes(suspension.name)));
  assert.equal(DIAGNOSTIC_METHODS.lift.available, false);
});

test('documents and mileage investigation reveal a discrepancy without exposing actual mileage', () => {
  const game = createGame(1000000, 33);
  const vehicle = createVehicleInstance('m3', 33, 100, { actualMileage: 286000, odometer: 186000, mileageTampered: true });
  game.vehicles.push(vehicle);
  const actual = vehicle.actualMileage;
  assert.equal(vehicle.observations.length, 0);
  const documentResult = inspectDocuments(game, vehicle.id);
  assert.equal(documentResult.mismatch, true);
  assert.equal(documentResult.actualMileage, undefined);
  assert.ok(vehicle.observations.some(item => item.text.includes('выше показания')));
  const mileageResult = diagnoseVehicle(game, vehicle.id, 'mileage');
  assert.ok(mileageResult.findings.length);
  assert.equal(vehicle.actualMileage, actual);
  assert.equal(vehicle.odometer, 186000);
});

test('confirmed fault repair changes the affected physical system and records part, labor, quality, and risk', () => {
  const game = createGame(1000000, 44);
  const vehicle = createVehicleInstance('m3', 44, 100, { faultKeys: ['oilLeak'] });
  vehicle.status = 'garage'; game.vehicles.push(vehicle); game.inventory.push(vehicle.id);
  const fault = vehicle.faults[0];
  fault.knowledge = { level: 'confirmed', source: 'Комплексная диагностика', date: '2026-01-01', notes: [fault.symptom] };
  const beforeLeak = vehicle.systems.engine.oilLeakMlDay;
  const used = repairQuote(fault, 'used', 'service');
  const oem = repairQuote(fault, 'oem', 'service');
  assert.ok(used.cost < oem.cost);
  assert.ok(used.repeatRisk > oem.repeatRisk);
  const result = repairFault(game, vehicle.id, fault.id, 'oem', 'service');
  assert.equal(result.repair.result, 'устранено');
  assert.equal(fault.status, 'repaired');
  assert.equal(vehicle.systems.engine.oilLeakMlDay, 0);
  assert.ok(vehicle.systems.engine.oilLeakMlDay < beforeLeak);
  assert.ok(vehicle.history.some(event => event.type === 'repair' && event.mileage === vehicle.odometer));
  assert.equal(vehicle.vin.length, 17);
});

test('test drive advances mileage and time and applies fuel and system use', () => {
  const game = createGame(1000000, 55);
  const vehicle = createVehicleInstance('m3', 55, 100, { faultKeys: ['thermostat'] });
  vehicle.status = 'garage'; game.vehicles.push(vehicle); game.inventory.push(vehicle.id);
  const oldOdometer = vehicle.odometer, oldActualMileage = vehicle.actualMileage, oldDayMinute = game.day * 1440 + game.minute, oldCash = game.player.cash;
  const result = driveVehicle(game, vehicle.id, 100);
  assert.equal(vehicle.odometer, oldOdometer + 100);
  assert.equal(vehicle.actualMileage, oldActualMileage + 100);
  assert.ok(game.day * 1440 + game.minute > oldDayMinute);
  assert.ok(oldCash - game.player.cash === result.fuelCost);
  assert.ok(vehicle.history.some(event => event.type === 'mileage' && event.mileage === vehicle.odometer));
});

test('full domain deal preserves the same vehicle VIN and history through sale and save restore', () => {
  const game = createGame(3000000, 13579);
  const listing = game.listings.find(item => item.ask < 900000);
  const marketVehicle = vehicleForListing(game, listing);
  const vehicleId = marketVehicle.id, vin = marketVehicle.vin;
  travelToListing(game, listing.id);
  diagnoseVehicle(game, vehicleId, 'visual');
  diagnoseVehicle(game, vehicleId, 'obd');
  diagnoseVehicle(game, vehicleId, 'service');
  assert.ok(negotiate(game, listing.id, listing.ask).accepted);
  assert.ok(buy(game, listing.id, listing.ask).bought);
  const owned = vehicleById(game, vehicleId);
  assert.equal(game.inventory[0], vehicleId);
  assert.equal(owned.id, vehicleId);
  assert.equal(owned.vin, vin);
  const originalMileage = owned.odometer;
  const diagnosable = owned.faults.find(fault => fault.status === 'active' && fault.detectableBy.includes('service'));
  if (diagnosable) {
    for (let index = 0; index < 12 && diagnosable.knowledge?.level !== 'confirmed'; index++) diagnoseVehicle(game, vehicleId, 'service');
    if (diagnosable.knowledge?.level === 'confirmed') repairFault(game, vehicleId, diagnosable.id, 'aftermarket', 'service');
  }
  assert.equal(owned.vin, vin);
  assert.equal(owned.odometer, originalMileage);
  const cost = dealCost(owned);
  assert.ok(cost >= owned.purchasePrice + owned.delivery + owned.paperwork);
  assert.ok(listForSale(game, vehicleId, 10000).ok);
  let response;
  for (let index = 0; index < 100 && !Number.isFinite(owned.buyerOffer); index++) response = buyers(game, vehicleId);
  assert.ok(Number.isFinite(owned.buyerOffer), 'a real buyer response should eventually be generated');
  const price = owned.buyerOffer;
  const result = sell(game, vehicleId, price);
  assert.equal(result.profit, price - cost);
  assert.equal(owned.status, 'sold');
  assert.equal(owned.vin, vin);
  assert.ok(owned.history.some(event => event.type === 'sale'));
  const restored = restoreGame(JSON.parse(JSON.stringify(game)));
  assert.equal(vehicleById(restored, vehicleId).vin, vin);
  assert.equal(vehicleById(restored, vehicleId).history.at(-1).type, 'sale');
  assert.equal(vehicleById(restored, vehicleId).salePrice, price);
});

test('legacy version-one saves migrate listing ids into vehicle references without losing owned costs', () => {
  const legacy = { version: 1, seed: 456, player: { name: 'Тест', home: 'msk', cash: 400000, account: 0 }, day: 4, minute: 600, phase: 'market', selected: 'old-listing', listings: [{ id: 'old-listing', modelId: 'm3', cityId: 'rostov', year: 2014, km: 120000, condition: .9, ask: 300000, fair: 290000, hidden: ['коррозия порогов'], found: ['коррозия порогов'], owner: 'Продавец', trip: false, distance: 100 }], inventory: [{ id: 'old-owned', modelId: 'm3', cityId: 'msk', year: 2014, km: 121000, condition: .8, purchasePrice: 200000, delivery: 10000, paperwork: 9000, repairs: 5000, stage: 'garage', history: ['Старая запись'], hidden: [], found: [] }], logs: [] };
  const migrated = restoreGame(legacy);
  assert.equal(migrated.version, 2);
  assert.notEqual(migrated.listings[0].id, migrated.listings[0].vehicleId);
  const owned = inventoryVehicles(migrated)[0];
  assert.equal(owned.purchasePrice, 200000);
  assert.equal(owned.repairsCost, 5000);
  assert.equal(owned.history.at(-1).description, 'Старая запись');
  assert.equal(migrated.selected, 'old-listing');
});
