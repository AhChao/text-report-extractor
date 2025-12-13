const { calculateStats } = require('./stats.js');

describe('Fitbook Stats', () => {

    test('calculateStats should handle empty input', () => {
        const stats = calculateStats([]);
        expect(stats.mostActiveMonth).toBeNull();
        expect(stats.longestStreak).toBe(0);
    });

    test('should identify most active month correctly', () => {
        const records = [
            { year: 2025, month: 1, day: 10 },
            { year: 2025, month: 1, day: 15 }, // Jan: 2
            { year: 2025, month: 2, day: 10 }, // Feb: 1
        ];
        const stats = calculateStats(records);
        expect(stats.mostActiveMonth).toEqual({ year: 2025, month: 1, count: 2 });
    });

    test('should calculate weekly streak within same month', () => {
        // Three consecutive weeks:
        // Week 1: Jan 1 (Wed) -> Monday Dec 30
        // Week 2: Jan 8 (Wed) -> Monday Jan 6
        // Week 3: Jan 15 (Wed) -> Monday Jan 13
        const records = [
            { year: 2025, month: 1, day: 1 },
            { year: 2025, month: 1, day: 8 },
            { year: 2025, month: 1, day: 15 },
        ];
        const stats = calculateStats(records);
        expect(stats.longestStreak).toBe(3);
    });

    test('should calculate streak across year boundary', () => {
        // Week A: Dec 25, 2024 (Wed)
        // Week B: Jan 1, 2025 (Wed)
        const records = [
            { year: 2024, month: 12, day: 25 },
            { year: 2025, month: 1, day: 1 },
        ];
        const stats = calculateStats(records);
        expect(stats.longestStreak).toBe(2);
    });

    test('should handle gaps in streak', () => {
        // Week 1, Week 2, Gap, Week 4
        const records = [
            { year: 2025, month: 1, day: 1 },  // Week 1
            { year: 2025, month: 1, day: 8 },  // Week 2 (Streak 2)
            { year: 2025, month: 1, day: 22 }, // Week 4 (Gap! Reset to 1)
        ];
        const stats = calculateStats(records);
        expect(stats.longestStreak).toBe(2); // Max was 2
    });

    test('should treat multiple classes in same week as single streak increment', () => {
        const records = [
            { year: 2025, month: 1, day: 1 }, // Week 1
            { year: 2025, month: 1, day: 2 }, // Week 1
            { year: 2025, month: 1, day: 8 }, // Week 2
        ];
        const stats = calculateStats(records);
        expect(stats.longestStreak).toBe(2);
    });
});
