/**
 * Fitbook Statistics Module
 * Logic for calculating advanced metrics
 */

(function (global) {

    function getMonday(d) {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    function calculateStats(records) {
        if(!records || records.length === 0) {
            return {
                mostActiveMonth: null,
                longestStreak: 0
            };
        }

        // 1. Most Active Month
        // Group by YYYY-MM
        const monthCounts = {};
        records.forEach(r => {
            const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
            monthCounts[key] = (monthCounts[key] || 0) + 1;
        });

        let maxMonth = null;
        let maxCount = -1;

        for(const [key, count] of Object.entries(monthCounts)) {
            if(count > maxCount) {
                maxCount = count;
                maxMonth = key;
            } else if(count === maxCount) {
                // Tie-breaking: prefer recent? or just keep first? 
                // Let's keep the earlier one or implicitly random depending on obj iteration order. 
                // For simplicity, strict greater keeps the first one found if iteration is consistent, 
                // but usually we might want the latest. Let's stick to "strict greater" for now.
            }
        }

        let mostActiveMonthData = null;
        if(maxMonth) {
            const [y, m] = maxMonth.split('-');
            mostActiveMonthData = {
                year: parseInt(y),
                month: parseInt(m),
                count: maxCount
            };
        }

        // 2. Longest Weekly Streak
        // Strategy: Convert all dates to their "Monday" timestamp.
        // Sort unique Mondays.
        // Iterate and check for 7-day gaps.

        const uniqueMondays = new Set();
        records.forEach(r => {
            // Note: Month is 1-based in our record, Date constructor takes 0-based month
            const d = new Date(r.year, r.month - 1, r.day);
            const monday = getMonday(d).getTime();
            uniqueMondays.add(monday);
        });

        const sortedMondays = Array.from(uniqueMondays).sort((a, b) => a - b);

        let currentStreak = 0;
        let maxStreak = 0;
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

        for(let i = 0; i < sortedMondays.length; i++) {
            if(i === 0) {
                currentStreak = 1;
            } else {
                const diff = sortedMondays[i] - sortedMondays[i - 1];
                // Allow some tolerance for DST? calculated difference should be exactly 7 days usually.
                // 7 days = 604800000 ms. 
                // Let's check roughly to be safe against DST shifts if generic Date used local time.
                // But we set hours to 0,0,0,0.
                if(Math.abs(diff - ONE_WEEK_MS) < 1000 * 60 * 60 * 2) { // 2 hour tolerance
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            if(currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        }

        return {
            mostActiveMonth: mostActiveMonthData,
            longestStreak: maxStreak
        };
    }

    // Export Logic
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = { calculateStats };
    } else {
        global.calculateStats = calculateStats;
    }

})(typeof window !== 'undefined' ? window : this);
