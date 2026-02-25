import { describe, it, expect } from "@jest/globals";
import { calculateEaster } from "../easterCalculation";
import {
    getGoodFriday,
    getEasterSunday,
    getEasterMonday,
    getAscensionDay,
    getPentecost,
    getMidsummer,
    getAllSaintsDay,
    getMovableHolidays,
    isMovableHoliday,
} from "../swedishMovableHolidays";

describe("Easter Calculation", () => {
    it("should calculate Easter 2024 correctly (March 31)", () => {
        const easter = calculateEaster(2024);
        expect(easter.getFullYear()).toBe(2024);
        expect(easter.getMonth()).toBe(2); // March (0-indexed)
        expect(easter.getDate()).toBe(31);
    });

    it("should calculate Easter 2025 correctly (April 20)", () => {
        const easter = calculateEaster(2025);
        expect(easter.getFullYear()).toBe(2025);
        expect(easter.getMonth()).toBe(3); // April (0-indexed)
        expect(easter.getDate()).toBe(20);
    });

    it("should calculate Easter 2026 correctly (April 5)", () => {
        const easter = calculateEaster(2026);
        expect(easter.getFullYear()).toBe(2026);
        expect(easter.getMonth()).toBe(3); // April (0-indexed)
        expect(easter.getDate()).toBe(5);
    });

    it("should calculate Easter 2027 correctly (March 28)", () => {
        const easter = calculateEaster(2027);
        expect(easter.getFullYear()).toBe(2027);
        expect(easter.getMonth()).toBe(2); // March (0-indexed)
        expect(easter.getDate()).toBe(28);
    });

    it("should calculate earliest possible Easter (March 22)", () => {
        // Easter falls on March 22 in years like 2285, 2296, etc.
        const easter = calculateEaster(2285);
        expect(easter.getMonth()).toBe(2); // March
        expect(easter.getDate()).toBe(22);
    });
});

describe("Good Friday (Långfredagen)", () => {
    it("should be 2 days before Easter 2024", () => {
        const goodFriday = getGoodFriday(2024);
        expect(goodFriday.getFullYear()).toBe(2024);
        expect(goodFriday.getMonth()).toBe(2); // March
        expect(goodFriday.getDate()).toBe(29); // March 29, 2024
    });

    it("should be 2 days before Easter 2025", () => {
        const goodFriday = getGoodFriday(2025);
        expect(goodFriday.getFullYear()).toBe(2025);
        expect(goodFriday.getMonth()).toBe(3); // April
        expect(goodFriday.getDate()).toBe(18); // April 18, 2025
    });
});

describe("Easter Sunday (Påskdagen)", () => {
    it("should be March 31, 2024", () => {
        const easterSunday = getEasterSunday(2024);
        expect(easterSunday.getFullYear()).toBe(2024);
        expect(easterSunday.getMonth()).toBe(2); // March
        expect(easterSunday.getDate()).toBe(31);
    });

    it("should be April 20, 2025", () => {
        const easterSunday = getEasterSunday(2025);
        expect(easterSunday.getFullYear()).toBe(2025);
        expect(easterSunday.getMonth()).toBe(3); // April
        expect(easterSunday.getDate()).toBe(20);
    });

    it("should always be a Sunday", () => {
        for (let year = 2020; year <= 2030; year++) {
            const easterSunday = getEasterSunday(year);
            expect(easterSunday.getDay()).toBe(0); // Sunday
        }
    });
});

describe("Easter Monday (Annandag påsk)", () => {
    it("should be 1 day after Easter 2024", () => {
        const easterMonday = getEasterMonday(2024);
        expect(easterMonday.getFullYear()).toBe(2024);
        expect(easterMonday.getMonth()).toBe(3); // April
        expect(easterMonday.getDate()).toBe(1); // April 1, 2024
    });

    it("should be 1 day after Easter 2025", () => {
        const easterMonday = getEasterMonday(2025);
        expect(easterMonday.getFullYear()).toBe(2025);
        expect(easterMonday.getMonth()).toBe(3); // April
        expect(easterMonday.getDate()).toBe(21); // April 21, 2025
    });
});

describe("Ascension Day (Kristi himmelfärdsdag)", () => {
    it("should be 39 days after Easter 2024", () => {
        const ascension = getAscensionDay(2024);
        expect(ascension.getFullYear()).toBe(2024);
        expect(ascension.getMonth()).toBe(4); // May
        expect(ascension.getDate()).toBe(9); // May 9, 2024
    });

    it("should be 39 days after Easter 2025", () => {
        const ascension = getAscensionDay(2025);
        expect(ascension.getFullYear()).toBe(2025);
        expect(ascension.getMonth()).toBe(4); // May
        expect(ascension.getDate()).toBe(29); // May 29, 2025
    });

    it("should always be a Thursday", () => {
        for (let year = 2020; year <= 2030; year++) {
            const ascension = getAscensionDay(year);
            expect(ascension.getDay()).toBe(4); // Thursday
        }
    });
});

describe("Pentecost (Pingstdagen)", () => {
    it("should be 49 days after Easter 2024", () => {
        const pentecost = getPentecost(2024);
        expect(pentecost.getFullYear()).toBe(2024);
        expect(pentecost.getMonth()).toBe(4); // May
        expect(pentecost.getDate()).toBe(19); // May 19, 2024
    });

    it("should be 49 days after Easter 2025", () => {
        const pentecost = getPentecost(2025);
        expect(pentecost.getFullYear()).toBe(2025);
        expect(pentecost.getMonth()).toBe(5); // June
        expect(pentecost.getDate()).toBe(8); // June 8, 2025
    });

    it("should always be a Sunday", () => {
        for (let year = 2020; year <= 2030; year++) {
            const pentecost = getPentecost(year);
            expect(pentecost.getDay()).toBe(0); // Sunday
        }
    });
});

describe("Midsummer Day (Midsommardagen)", () => {
    it("should be June 21 in 2025 (Saturday)", () => {
        const midsummer = getMidsummer(2025);
        expect(midsummer.getFullYear()).toBe(2025);
        expect(midsummer.getMonth()).toBe(5); // June
        expect(midsummer.getDate()).toBe(21);
        expect(midsummer.getDay()).toBe(6); // Saturday
    });

    it("should be June 20 in 2026 (Saturday)", () => {
        const midsummer = getMidsummer(2026);
        expect(midsummer.getFullYear()).toBe(2026);
        expect(midsummer.getMonth()).toBe(5); // June
        expect(midsummer.getDate()).toBe(20);
        expect(midsummer.getDay()).toBe(6); // Saturday
    });

    it("should always be a Saturday", () => {
        for (let year = 2020; year <= 2030; year++) {
            const midsummer = getMidsummer(year);
            expect(midsummer.getDay()).toBe(6); // Saturday
        }
    });

    it("should always be between June 20-26", () => {
        for (let year = 2020; year <= 2030; year++) {
            const midsummer = getMidsummer(year);
            expect(midsummer.getMonth()).toBe(5); // June
            expect(midsummer.getDate()).toBeGreaterThanOrEqual(20);
            expect(midsummer.getDate()).toBeLessThanOrEqual(26);
        }
    });
});

describe("All Saints' Day (Alla helgons dag)", () => {
    it("should be November 1 in 2025 (Saturday)", () => {
        const allSaints = getAllSaintsDay(2025);
        expect(allSaints.getFullYear()).toBe(2025);
        expect(allSaints.getMonth()).toBe(10); // November
        expect(allSaints.getDate()).toBe(1);
        expect(allSaints.getDay()).toBe(6); // Saturday
    });

    it("should be October 31 in 2026 (Saturday)", () => {
        const allSaints = getAllSaintsDay(2026);
        expect(allSaints.getFullYear()).toBe(2026);
        expect(allSaints.getMonth()).toBe(9); // October
        expect(allSaints.getDate()).toBe(31);
        expect(allSaints.getDay()).toBe(6); // Saturday
    });

    it("should always be a Saturday", () => {
        for (let year = 2020; year <= 2030; year++) {
            const allSaints = getAllSaintsDay(year);
            expect(allSaints.getDay()).toBe(6); // Saturday
        }
    });

    it("should always be between October 31 - November 6", () => {
        for (let year = 2020; year <= 2030; year++) {
            const allSaints = getAllSaintsDay(year);
            const month = allSaints.getMonth();
            const date = allSaints.getDate();

            if (month === 9) {
                // October
                expect(date).toBe(31);
            } else if (month === 10) {
                // November
                expect(date).toBeGreaterThanOrEqual(1);
                expect(date).toBeLessThanOrEqual(6);
            } else {
                throw new Error("All Saints Day should be in October or November");
            }
        }
    });
});

describe("getMovableHolidays", () => {
    it("should return all 7 movable holidays for 2025", () => {
        const holidays = getMovableHolidays(2025);
        expect(holidays.size).toBe(7);
    });

    it("should contain all expected holiday names", () => {
        const holidays = getMovableHolidays(2025);
        const holidayNames = Array.from(holidays.values()).map((h) => h.name);

        expect(holidayNames).toContain("Långfredagen");
        expect(holidayNames).toContain("Påskdagen");
        expect(holidayNames).toContain("Annandag påsk");
        expect(holidayNames).toContain("Kristi himmelfärdsdag");
        expect(holidayNames).toContain("Pingstdagen");
        expect(holidayNames).toContain("Midsommardagen");
        expect(holidayNames).toContain("Alla helgons dag");
    });
});

describe("isMovableHoliday", () => {
    it("should return true for Easter 2025 (April 20)", () => {
        const date = new Date(2025, 3, 20); // April 20
        const result = isMovableHoliday(date);
        expect(result.isHoliday).toBe(true);
        expect(result.name).toBe("Påskdagen");
    });

    it("should return true for Midsummer 2025 (June 21)", () => {
        const date = new Date(2025, 5, 21); // June 21
        const result = isMovableHoliday(date);
        expect(result.isHoliday).toBe(true);
        expect(result.name).toBe("Midsommardagen");
    });

    it("should return false for a regular day", () => {
        const date = new Date(2025, 0, 15); // January 15
        const result = isMovableHoliday(date);
        expect(result.isHoliday).toBe(false);
        expect(result.name).toBeUndefined();
    });
});
