/**
 * Fitbook Parser
 * Logic adapted from exportScriptFromRaw.js (Strict Adherence)
 */

// parser.js
const parseRawData = function (rawInput) {
    const lines = rawInput.replace(/\r\n?/g, "\n").split("\n").map(l => l.trim());
    const usedLines = new Set();

    // Exact noise set
    const noise = new Set(["評價", "完成課程", "課程未完成"]);
    const extraNoise = new Set(["我的預約", "即將到來", "歷史紀錄", "回主場館", ""]); // Added empty string as noise

    function isNoise(l) {
        // Also check if line is purely symbols or common noise
        return !l || noise.has(l) || extraNoise.has(l) || /^[-\s]+$/.test(l) || /^[=]+$/.test(l);
    }

    const dateRegex = /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2}).*?(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/;
    const dateLineIndices = new Set();

    // First pass: Mark all date lines
    lines.forEach((l, idx) => {
        if(dateRegex.test(l)) {
            dateLineIndices.add(idx);
            usedLines.add(idx);
        }
    });

    const records = [];

    // Process each line
    for(let i = 0; i < lines.length; i++) {
        // Only process if it is a date line
        if(!dateLineIndices.has(i)) continue;

        const line = lines[i];
        const m = line.match(dateRegex);

        if(m) {
            const year = parseInt(m[1]);
            const month = parseInt(m[2]);
            const day = parseInt(m[3]);

            // Calculate duration (kept for reference)
            const [startH, startM] = m[4].split(':').map(Number);
            const [endH, endM] = m[5].split(':').map(Number);
            let duration = (endH * 60 + endM) - (startH * 60 + startM);
            if(duration < 0) duration += 24 * 60;

            // Find Course Name (Look backwards from Date Line)
            let courseName = "Unknown Course";
            for(let j = i - 1; j >= 0; j--) {
                // If we hit another date line or a used line, we stop.
                // However, we must be careful. If the previous line was a "Teacher" for the previous record, 
                // it might be marked used. But here we are looking for THIS record's course.
                // Usually Course is physically above.
                if(dateLineIndices.has(j)) break; // Hit previous record's date
                if(usedLines.has(j)) continue; // Skip already consumed lines (e.g. Teacher of previous block)

                const t = lines[j];
                if(isNoise(t)) continue;

                courseName = t;
                usedLines.add(j);
                break;
            }

            // Find Teacher (Look forwards from Date Line)
            let teacherName = "Unknown Teacher";
            for(let j = i + 1; j < lines.length; j++) {
                if(dateLineIndices.has(j)) break; // Hit next record's start
                if(usedLines.has(j)) continue;

                const t = lines[j];
                if(isNoise(t)) continue;

                teacherName = t;
                usedLines.add(j);
                break;
            }

            records.push({
                year,
                month,
                day,
                duration,
                courseName,
                teacherName
            });
        }
    }
    // Extract User Name
    // Extract User Name
    // Rule: Check first line for "Yoga". 
    // If found, check line 2 (index 1). If blank/noise, check line 3 (index 2).
    let userName = null;
    if(lines.length > 0) {
        if(lines[0].toLowerCase() === 'yoga') {
            // Check line 1
            if(lines[1] && !isNoise(lines[1]) && !dateRegex.test(lines[1])) {
                userName = lines[1];
            }
            // If line 1 is not valid (assumed blank/noise), check line 2
            else if(lines[2] && !isNoise(lines[2]) && !dateRegex.test(lines[2])) {
                userName = lines[2];
            }
        } else if(!isNoise(lines[0]) && !dateRegex.test(lines[0])) {
            // If first line is NOT "Yoga" and not noise/date, assume it is the name
            userName = lines[0];
        }
    }

    return { records, userName };
};

if(typeof window !== 'undefined') {
    window.parseRawData = parseRawData;
}

// Export for CommonJS (Jest)
if(typeof module !== 'undefined' && module.exports) {
    module.exports = { parseRawData };
}
