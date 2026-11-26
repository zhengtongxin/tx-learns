const assert = require('assert');
const { newClass, book, cancel } = require('./booking.js');

const yoga = newClass(2);
assert.strictEqual(book(yoga, 'Mei'), 'booked');
assert.strictEqual(book(yoga, 'Raj'), 'booked');
assert.strictEqual(book(yoga, 'Aisha'), 'waitlisted');   // full: never more than the seats
assert.strictEqual(book(yoga, 'Chen'), 'waitlisted');
assert.strictEqual(book(yoga, 'Mei'), 'already');        // no double booking
assert.strictEqual(yoga.booked.length, 2);

assert.strictEqual(cancel(yoga, 'Raj'), 'Aisha');        // first in the waitlist moves in
assert.deepStrictEqual(yoga.booked, ['Mei', 'Aisha']);
assert.deepStrictEqual(yoga.waitlist, ['Chen']);

assert.strictEqual(cancel(yoga, 'Chen'), null);          // leaving the waitlist frees no seat
assert.deepStrictEqual(yoga.waitlist, []);

assert.strictEqual(cancel(yoga, 'Nobody'), null);        // unknown person: nothing changes
assert.strictEqual(cancel(yoga, 'Mei'), null);           // empty waitlist: seat just opens
assert.strictEqual(yoga.booked.length, 1);

// Your own test goes here: a cancel when the waitlist is empty, then a new booking.

console.log('ok: seats never overfill and the waitlist moves in order');
