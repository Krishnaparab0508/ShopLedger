'use strict';

const test = require('node:test');
const assert = require('node:assert');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
}

function customerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [{
      id: 7,
      name: 'Asha',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200,
      balance: 1232.01
    }]
  };
}

test('FIXED BEHAVIOUR: orders.list defaults to newest real date first', function () {
  const result = orders.list(orderDb());
  assert.deepStrictEqual(result.map(function (order) { return order.id; }), [1, 2, 3]);
});

test('FIXED BEHAVIOUR: orders.list from YYYY-MM-DD filters dates chronologically', function () {
  const result = orders.list(orderDb(), { from: '2022-03-01' });
  assert.deepStrictEqual(result.map(function (order) { return order.id; }), [1]);
});

test('FIXED BEHAVIOUR: orders.list to YYYY-MM-DD includes dates through the boundary', function () {
  const result = orders.list(orderDb(), { to: '2022-02-01' });
  assert.deepStrictEqual(result.map(function (order) { return order.id; }), [2, 3]);
});

test('FIXED BEHAVIOUR: orders.list applies inclusive chronological date bounds', function () {
  const result = orders.list(orderDb(), { from: '2022-01-01', to: '2022-03-31' });
  assert.deepStrictEqual(result.map(function (order) { return order.id; }), [1, 2]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts picker format and otherwise returns trimmed input', function () {
  assert.strictEqual(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement adds a numeric amount and recalculates balance', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 7, 500, 'cash', 'counter');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(db.customers[0].totalSettled, 1700);
  assert.strictEqual(db.customers[0].balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
  assert.strictEqual(db.settlements.length, 1);
});

test('FIXED BEHAVIOUR: ledger.recordSettlement adds a numeric string as a number', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 7, '500', 'cash', 'counter');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(db.customers[0].totalSettled, 1700);
  assert.strictEqual(db.customers[0].balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects zero without changing customer or settlements', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 7, 0);

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects a negative amount without changing customer or settlements', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 7, -25);

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.settlements.length, 0);
});

test('FIXED BEHAVIOUR: ledger.recordSettlement rejects non-numeric text without changing totals', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 7, 'abc');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.customers[0].balance, 1232.01);
  assert.strictEqual(db.settlements.length, 0);
});

test('FIXED BEHAVIOUR: order dates sort and filter chronologically and settlement strings are validated as numbers', function () {
  const db = orderDb();
  assert.deepStrictEqual(
    orders.list(db).map(function (order) { return order.id; }),
    [1, 2, 3]
  );
  assert.deepStrictEqual(
    orders.list(db, { from: '2022-03-01' }).map(function (order) { return order.id; }),
    [1]
  );
  assert.deepStrictEqual(
    orders.list(db, { to: '2022-02-01' }).map(function (order) { return order.id; }),
    [2, 3]
  );
  assert.deepStrictEqual(
    orders.list(db, { from: '2022-01-01', to: '2022-01-31' }).map(function (order) { return order.id; }),
    [2]
  );
  assert.strictEqual(dates.toSortableDateKey('15/03/2022'), '2022-03-15');

  const settlementDb = customerDb();
  const settlement = ledger.recordSettlement(settlementDb, 7, '500', 'cash', 'counter');
  assert.strictEqual(settlement.ok, true);
  assert.strictEqual(settlementDb.customers[0].totalSettled, 1700);
  assert.strictEqual(settlementDb.customers[0].balance, 732.01);
  assert.strictEqual(settlement.settlement.amount, 500);

  [0, -25, 'abc'].forEach(function (amount) {
    const invalidDb = customerDb();
    const result = ledger.recordSettlement(invalidDb, 7, amount);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(invalidDb.customers[0].totalSettled, 1200);
    assert.strictEqual(invalidDb.customers[0].balance, 1232.01);
    assert.strictEqual(invalidDb.settlements.length, 0);
  });
});
