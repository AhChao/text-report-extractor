const { parseRawData } = require('./parser.js');

describe('Fitbook Parser', () => {
    // Mock the window object if it doesn't exist (though jsdom handles this, good for safety)
    if(typeof window === 'undefined') {
        global.window = {};
    }

    test('should correctly parse fitbookRawSample.txt data', () => {
        const rawInput = `Yoga
Steven
---
2025/11/28(五) 17:45~18:45
Christine`;

        const result = parseRawData(rawInput);

        expect(result.userName).toBe('Steven');
        expect(result.records).toHaveLength(1);
        expect(result.records[0].courseName).toBe('Yoga');
    });

    test('should return object with records and userName', () => {
        const rawInput = `Yoga
Steven
2025/11/28(五) 17:45~18:45
CourseName
`;
        const result = parseRawData(rawInput);
        expect(result).toHaveProperty('records');
        expect(result).toHaveProperty('userName');
        expect(result.userName).toBe('Steven');
    });

    test('should handle blank line after Yoga', () => {
        const rawInput = `Yoga

Steven
2025/11/28(五) 17:45~18:45
CourseName`;
        const result = parseRawData(rawInput);
        expect(result.userName).toBe('Steven');
    });

    // New Logic Tests
    test('should detect name on first line if not Yoga', () => {
        const rawInput = `Steven
2025/11/28(五) 17:45~18:45
CourseName`;
        const result = parseRawData(rawInput);
        expect(result.userName).toBe('Steven');
    });

    test('should ignore noise on first line', () => {
        const rawInput = `---
Steven
2025/11/28(五) 17:45~18:45
CourseName`;
        const result = parseRawData(rawInput);
        expect(result.userName).toBeNull();
    });

    test('should ignore Yoga if not on first line', () => {
        const rawInput = `
Yoga
Steven
2025/11/28(五) 17:45~18:45
CourseName`;
        const result = parseRawData(rawInput);
        expect(result.userName).toBeNull();
    });

    test('should ignore noise lines correctly', () => {
        const rawInput = `
         完成課程
         Bad Course
         評價
         2025/11/28(五) 17:45~18:45
         
         My Teacher
         評價
         `;
        // "Bad Course" is surrounded by noise, should be picked up as course?
        // Looking backwards from date:
        // Empty -> continue
        // 評價 -> Noise
        // Bad Course -> Course!
        // 完成課程 -> Noise

        const result = parseRawData(rawInput);
        expect(result[0].courseName).toBe('Bad Course');
        expect(result[0].teacherName).toBe('My Teacher');
    });
});
