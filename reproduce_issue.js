const { parseRawData } = require('./fitbook/js/parser.js');

// Mock window if needed (parser checks window)
if(typeof window === 'undefined') {
    global.window = {};
}

const rawInput = `Yoga
Steven
---



 回主場館

我的預約
即將到來
歷史紀錄
完成課程
頌缽音療

2025/11/28(五) 17:45~18:45

Christine
Christine
評價
完成課程
動物流

2025/11/25(二) 18:45~19:45

Jane
Jane
評價
課程未完成
椅子伸展

2025/11/22(六) 20:00~21:00

Kira
Kira  教室: 團體教室
完成課程
輪瑜珈 / 晨`;

console.log("Parsing sample data...");
const result = parseRawData(rawInput);

// Handle object return
let records = result.records || result;

console.log(`Found ${records.length} records.`);
records.forEach((r, idx) => {
    console.log(`Record ${idx + 1}:`);
    console.log(`  Date: ${r.year}/${r.month}/${r.day}`);
    console.log(`  Course: "${r.courseName}"`);
    console.log(`  Teacher: "${r.teacherName}"`);
    console.log(`  Is Unknown? ${r.teacherName === 'Unknown Teacher'}`);
});
