// Seats and a waitlist for one class. Plain functions, no screen attached.
function newClass(seats) {
  return { seats, booked: [], waitlist: [] };
}

// Returns 'booked', 'waitlisted' or 'already'.
function book(cls, name) {
  if (cls.booked.includes(name) || cls.waitlist.includes(name)) return 'already';
  if (cls.booked.length < cls.seats) {
    cls.booked.push(name);
    return 'booked';
  }
  cls.waitlist.push(name);
  return 'waitlisted';
}

// Removes the person; if a seat frees up, the first waitlisted person gets it.
// Returns the name that was moved in, or null.
function cancel(cls, name) {
  cls.waitlist = cls.waitlist.filter(n => n !== name);
  const i = cls.booked.indexOf(name);
  if (i === -1) return null;
  cls.booked.splice(i, 1);
  if (cls.waitlist.length > 0 && cls.booked.length < cls.seats) {
    const next = cls.waitlist.shift();
    cls.booked.push(next);
    return next;
  }
  return null;
}

module.exports = { newClass, book, cancel };
