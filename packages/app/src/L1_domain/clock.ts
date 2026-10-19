// How the phone writes a moment, in the person's own time zone: the hour, and the day.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const twoDigits = (n: number) => String(n).padStart(2, '0');

/** `14:32`. */
export function hourOf(at: number): string {
  const then = new Date(at);
  return twoDigits(then.getHours()) + ':' + twoDigits(then.getMinutes());
}

/** `12 Oct`. */
export function dateOf(at: number): string {
  const then = new Date(at);
  return String(then.getDate()) + ' ' + (MONTHS[then.getMonth()] ?? '');
}

/** Which calendar day a moment falls on, as a key two moments can be compared by. */
export function dayOf(at: number): string {
  return new Date(at).toDateString();
}
