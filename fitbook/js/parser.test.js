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



 回主場館
...`; // Need to mimic structure or just update expectations

        // Easier: Just update expectations on existing result structure
        const rawInput = `Yoga
Steven
---
2025/11/28(五) 17:45~18:45
Christine`;

        const result = parseRawData(rawInput);

        expect(result.userName).toBe('Steven');
        expect(result.records).toHaveLength(1);
        expect(result.records[0].courseName).toBe('Yoga'); // Wait, "Yoga" is above "Steven" above "---". 
        // With existing logic: 
        // Date line 2025...
        // Backwards: "---" (noise?) -> "Steven" -> "Yoga"
        // Wait, "Steven" is not noise. So courseName is "Steven"?
        // Original logic: "Find Course Name (Look backwards)... courseName = t"
        // If "Steven" is detected as user name, should it be skipped as course name?
        // Ah, the requirements didn't say to skip it as a course name candidate.
        // It says "Default Yoga next line if text is user name".
        // In the sample provided by user:
        // Yoga
        // Steven
        // ---
        // ...
        // ...
        // 2025/11/28...
        // 
        // Is "Yoga" or "Steven" the course for the record way down there?
        // Actually, the records usually have the course name immediately above. 
        // The top of the file "Yoga / Steven" seems to be header info, not necessarily the course for the first record.
        // The first record 2025/11/28 has "頌缽音療" above it in the sample. 
        // So "Yoga / Steven" at the top shouldn't interfere with record parsing if they are far away.
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
