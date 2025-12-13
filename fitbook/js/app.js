// app.js (Depends on parser.js loaded before)

const { createApp, ref, computed, watch, onMounted } = Vue;

createApp({
    setup() {
        const currentPage = ref(1);
        const showModal = ref(false);
        const rawInput = ref('');
        const currentStep = ref(0);
        const selectedPeriod = ref('2025');
        const parsedData = ref([]);

        // Editable Title State
        const pageTitle = ref("很棒的練習！繼續努力！");
        const isEditingTitle = ref(false);
        const isTitleManuallyEdited = ref(false);
        const detectedUserName = ref(null);
        const hasSavedData = ref(false);

        const guideSteps = [
            "1. 到工作室的 Line 聊天頁面（平常預約上課的地方），點選「預約課程」",
            "2. 點擊右上角的個人頭貼",
            "3. 點選「我的預約」",
            "4. 點選「歷史紀錄」",
            "5. 這邊會看到所有過去完成的課程",
            "6. 在任何一個課程的時間(文字處)，常壓點選會出現選項，選「全部選取」",
            "7. 全部選取後選項還會在，這時選「複製」",
            "8. 貼到我們這個頁面裡面來，按「來看看課上的怎麼樣...」",
            "9. 美美的上課紀錄就出來囉！來看看你的上課狀況吧！"
        ];

        const nextStep = () => {
            if(currentStep.value < guideSteps.length - 1) currentStep.value++;
        };

        const prevStep = () => {
            if(currentStep.value > 0) currentStep.value--;
        };

        const formatDuration = (totalHours) => {
            return `${totalHours} 小時`;
        };

        const updateTitle = () => {
            if(isTitleManuallyEdited.value) return;

            if(detectedUserName.value) {
                if(selectedPeriod.value === '2025') {
                    pageTitle.value = `${detectedUserName.value} 2025 的練習紀錄`;
                } else {
                    pageTitle.value = `${detectedUserName.value} 的練習紀錄`;
                }
            } else {
                pageTitle.value = "很棒的練習！繼續努力！";
            }
        };

        const generateReport = () => {
            if(!rawInput.value.trim()) {
                alert('請輸入資料');
                return;
            }

            // Save to localStorage
            localStorage.setItem('fitbook_raw', rawInput.value);
            hasSavedData.value = true;

            const result = parseRawData(rawInput.value);

            // Check if result is object (new parser) or array (old parser fallback safety)
            if(Array.isArray(result)) {
                parsedData.value = result;
                detectedUserName.value = null;
            } else {
                parsedData.value = result.records;
                detectedUserName.value = result.userName;
            }

            // Reset manual edit flag 
            isTitleManuallyEdited.value = false;
            updateTitle();

            currentPage.value = 2;
        };

        const clearData = () => {
            if(confirm('確定要清除所有內容嗎？')) {
                localStorage.removeItem('fitbook_raw');
                rawInput.value = '';
                hasSavedData.value = false;
                parsedData.value = [];
                detectedUserName.value = null;
                // Optional: Force reload or just stay? logic says "Clear content and cookie"
                // Stay on page 1 is fine.
            }
        };

        onMounted(() => {
            const saved = localStorage.getItem('fitbook_raw');
            if(saved) {
                rawInput.value = saved;
                hasSavedData.value = true;
                generateReport();
            }
        });

        // Watch for changes to update title automatically
        watch(selectedPeriod, () => {
            updateTitle();
        });

        // If user manually edits title, set flag
        watch(isEditingTitle, (newVal, oldVal) => {
            // When finishing edit (switching from true to false), mark as manually edited
            if(oldVal === true && newVal === false) {
                isTitleManuallyEdited.value = true;
            }
        });

        const filteredStats = computed(() => {
            let data = parsedData.value;

            if(selectedPeriod.value === '2025') {
                data = data.filter(r => r.year === 2025);
            }

            // Rule: 1 Course = 1 Hour
            const totalHours = data.length;
            const totalCount = data.length;

            const courseMap = {};
            data.forEach(r => {
                // Group by Course Name + Teacher Name unique key
                const key = `${r.courseName}-:-${r.teacherName}`;

                if(!courseMap[key]) {
                    courseMap[key] = {
                        name: r.courseName,
                        count: 0,
                        hours: 0,
                        teacher: r.teacherName
                    };
                }
                courseMap[key].count++;
                courseMap[key].hours += 1;
            });

            const uniqueCourses = Object.keys(courseMap).length;
            const distribution = Object.values(courseMap).sort((a, b) => b.count - a.count);

            let maxCourse = null;
            if(distribution.length > 0) {
                // Longest course is just the one with highest count/hours
                maxCourse = distribution[0];
            }

            // Advanced Stats
            const advancedStats = calculateStats(data);

            return {
                totalDurationStr: formatDuration(totalHours),
                totalCount,
                uniqueCourses,
                maxCourse,
                distribution,
                mostActiveMonth: advancedStats.mostActiveMonth,
                longestStreak: advancedStats.longestStreak
            };
        });

        // Theme Logic
        const setRandomTheme = () => {
            const randomColor = () => {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                return { r, g, b, hex: `rgb(${r},${g},${b})` };
            };

            // Primary color
            const p = randomColor();

            // Background color (Light or Dark)
            const isDarkBg = Math.random() > 0.5;
            const bg = isDarkBg ?
                { r: 20, g: 20, b: 24, hex: '#141418' } :
                { r: 240, g: 242, b: 245, hex: '#f0f2f5' };

            // Card BG
            const cardBg = isDarkBg ? '#1e1e24' : '#ffffff';

            // Text Color based on BG contrast
            const textColor = isDarkBg ? '#e0e0e0' : '#333333';
            const textSecondary = isDarkBg ? '#aaaaaa' : '#666666';

            document.documentElement.style.setProperty('--primary-color', p.hex);
            document.documentElement.style.setProperty('--bg-color', bg.hex);
            document.documentElement.style.setProperty('--card-bg', cardBg);
            document.documentElement.style.setProperty('--text-color', textColor);
            document.documentElement.style.setProperty('--text-secondary', textSecondary);
            document.documentElement.style.setProperty('--modal-bg', isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.7)');
            document.documentElement.style.setProperty('--modal-bg', isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.7)');
        };

        const shareScreenshot = async () => {
            const captureNode = document.getElementById('capture-node');
            if(!captureNode) return;

            // Add class to hide UI elements like edit icon
            captureNode.classList.add('capturing');

            try {
                const canvas = await html2canvas(captureNode, {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(),
                    scale: 2 // High res
                });

                // Remove class immediately
                captureNode.classList.remove('capturing');

                canvas.toBlob(blob => {
                    if(!blob) return;

                    // Try Native Share
                    if(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'course-report.png', { type: 'image/png' })] })) {
                        const file = new File([blob], 'course-report.png', { type: 'image/png' });
                        navigator.share({
                            title: 'Fitbook Report',
                            text: 'Check out my workout report!',
                            files: [file]
                        }).catch(console.error);
                    } else {
                        // Fallback Download
                        const link = document.createElement('a');
                        link.download = 'course-report.png';
                        link.href = canvas.toDataURL();
                        link.click();
                    }
                });
            } catch(err) {
                console.error(err);
                captureNode.classList.remove('capturing');
                alert('Screenshot failed');
            }
        };

        return {
            currentPage,
            showModal,
            rawInput,
            currentStep,
            guideSteps,
            nextStep,
            prevStep,
            generateReport,
            selectedPeriod,
            filteredStats,
            formatDuration,
            pageTitle,
            isEditingTitle,
            setRandomTheme,
            shareScreenshot,
            clearData,
            hasSavedData
        };
    }
}).mount('#app');
