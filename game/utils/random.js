/**
 * utils/random.js
 */
export function chance(rate) {
  return Math.random() < rate;
}

export function pickOne(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function pickNUnique(list, n) {
  const bag = list.slice();
  const out = [];
  while (out.length < n && bag.length) {
    out.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
  }
  return out;
}
