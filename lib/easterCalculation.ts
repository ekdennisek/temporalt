/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm
 * (Meeus/Jones/Butcher algorithm)
 *
 * This algorithm is valid for all years from 1583 onwards (Gregorian calendar adoption).
 * The algorithm was published anonymously in Nature magazine in 1876 and later
 * reprinted by Samuel Butcher (1877), H. Spencer Jones (1922), and Jean Meeus (1991).
 *
 * Easter Sunday falls between March 22 and April 25.
 *
 * @param year - The year to calculate Easter for (1583 or later)
 * @returns Date object representing Easter Sunday
 */
export function calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    // month is 3 for March, 4 for April
    // JavaScript Date uses 0-indexed months, so subtract 1
    return new Date(year, month - 1, day);
}
