document.addEventListener('DOMContentLoaded', function() {
    
    // ===================================
    // PENGAMBILAN ELEMEN DOM
    // ===================================

    // --- Tab ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // --- Unfollowers Checker ---
    const followersInput = document.getElementById('followers-input');
    const followingInput = document.getElementById('following-input');
    const followersFileName = document.getElementById('followers-file-name');
    const followingFileName = document.getElementById('following-file-name');
    const processBtn = document.getElementById('process-btn');
    const resetUnfollowerBtn = document.getElementById('reset-unfollower-btn');
    const errorUnfollower = document.getElementById('error-unfollower');
    const loadingUnfollower = document.getElementById('loading-unfollower');
    const resultsUnfollower = document.getElementById('results-unfollower');
    const unfollowersList = document.getElementById('unfollowers-list');
    const unfollowersTitle = document.getElementById('unfollowers-title');

    // --- Text Analyzer ---
    const textInput = document.getElementById('text-input');
    const fileInputAnalyzer = document.getElementById('file-input-analyzer');
    const fileNameAnalyzer = document.getElementById('file-name-analyzer');
    const searchQuery = document.getElementById('search-query');
    const caseSensitiveCheckbox = document.getElementById('case-sensitive');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetAnalyzerBtn = document.getElementById('reset-analyzer-btn');
    const loadingAnalyzer = document.getElementById('loading-analyzer');
    const resultsAnalyzer = document.getElementById('results-analyzer');
    const summaryAnalyzer = document.getElementById('results-summary');
    const detailsAnalyzer = document.getElementById('results-details');
    const errorAnalyzer = document.getElementById('error-analyzer');

    // ===================================
    // EVENT LISTENERS
    // ===================================

    // --- Sistem Tab ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(content => content.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- Unfollowers Checker ---
    followersInput.addEventListener('change', () => updateFileName(followersInput, followersFileName));
    followingInput.addEventListener('change', () => updateFileName(followingInput, followingFileName));
    processBtn.addEventListener('click', processUnfollowerFiles);
    resetUnfollowerBtn.addEventListener('click', resetUnfollowerTool);

    // --- Text Analyzer ---
    fileInputAnalyzer.addEventListener('change', handleAnalyzerFileSelect); // DIPERBARUI
    analyzeBtn.addEventListener('click', runTextAnalysis);
    resetAnalyzerBtn.addEventListener('click', resetAnalyzerTool);

    // ===================================
    // FUNGSI-FUNGSI
    // ===================================
    
    function updateFileName(input, display) {
        if (input.files.length > 0) {
            display.textContent = input.files[0].name;
            display.style.color = '#1f2937';
        } else {
            display.textContent = 'Belum ada file dipilih';
            display.style.color = '#4b5563';
        }
    }

    // --- FUNGSI UNTUK UNFOLLOWERS CHECKER ---

    function processUnfollowerFiles() {
        loadingUnfollower.classList.remove('hidden');
        errorUnfollower.classList.add('hidden');
        resultsUnfollower.classList.add('hidden');

        const followersFile = followersInput.files[0];
        const followingFile = followingInput.files[0];

        if (!followersFile || !followingFile) {
            errorUnfollower.textContent = 'Silakan pilih kedua file (followers dan following).';
            errorUnfollower.classList.remove('hidden');
            loadingUnfollower.classList.add('hidden');
            return;
        }

        Promise.all([
            readFileAndParseHTML(followersFile),
            readFileAndParseHTML(followingFile)
        ]).then(([followers, following]) => {
            loadingUnfollower.classList.add('hidden');
            if (followers.size === 0 && following.size === 0) {
                errorUnfollower.textContent = 'Gagal memindai kedua file. Pastikan file tidak kosong dan formatnya benar.';
                errorUnfollower.classList.remove('hidden');
            } else if (followers.size === 0) {
                errorUnfollower.textContent = 'Gagal memindai file Followers. Coba unduh ulang dari Instagram.';
                errorUnfollower.classList.remove('hidden');
            } else if (following.size === 0) {
                errorUnfollower.textContent = 'Gagal memindai file Following. Coba unduh ulang dari Instagram.';
                errorUnfollower.classList.remove('hidden');
            } else {
                resultsUnfollower.classList.remove('hidden');
                displayUnfollowerResults(followers, following);
            }
        }).catch(err => {
            loadingUnfollower.classList.add('hidden');
            errorUnfollower.textContent = 'Terjadi kesalahan: ' + err.message;
            errorUnfollower.classList.remove('hidden');
        });
    }
    
    /**
     * PERBAIKAN BUG: Filter link yang tidak relevan seperti link ke logo Instagram
     */
    function readFileAndParseHTML(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    const usernames = new Set();
                    const elements = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
                    
                    elements.forEach(el => {
                        const username = el.textContent.trim();
                        // Filter diperketat: memastikan href mengandung username dan BUKAN link ke halaman explore/tags/dll.
                        const path = new URL(el.href).pathname.slice(1); // Ambil path setelah "/"
                        if (username && path.split('/')[0] === username) {
                            usernames.add(username);
                        }
                    });
                    resolve(usernames);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
            reader.readAsText(file);
        });
    }

    function displayUnfollowerResults(followersSet, followingSet) {
        const unfollowers = [];
        followingSet.forEach(user => {
            if (!followersSet.has(user)) {
                unfollowers.push(user);
            }
        });
        unfollowers.sort((a, b) => a.localeCompare(b));
        unfollowersTitle.textContent = `Unfollowers (${unfollowers.length})`;
        populateList(unfollowersList, unfollowers, "Tidak ada unfollowers. Hebat!");
    }

    function populateList(listElement, dataArray, emptyMessage) {
        listElement.innerHTML = '';
        if (dataArray.length === 0) {
            const li = document.createElement('li');
            li.textContent = emptyMessage;
            li.style.color = '#6b7280';
            li.style.textAlign = 'center';
            listElement.appendChild(li);
        } else {
            dataArray.forEach((user, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${index + 1}.</span> <a href="https://www.instagram.com/${user}" target="_blank">${user}</a>`;
                listElement.appendChild(li);
            });
        }
    }
    
    function resetUnfollowerTool() {
        followersInput.value = '';
        followingInput.value = '';
        updateFileName(followersInput, followersFileName);
        updateFileName(followingInput, followingFileName);
        resultsUnfollower.classList.add('hidden');
        errorUnfollower.classList.add('hidden');
        loadingUnfollower.classList.add('hidden');
    }

    // --- FUNGSI UNTUK ANALISIS TEKS ---

    /**
     * PERBAIKAN BUG: Fungsi ini sekarang akan otomatis memproses isi file sebagai teks.
     */
    function handleAnalyzerFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            updateFileName(fileInputAnalyzer, fileNameAnalyzer);
            const reader = new FileReader();
            reader.onload = function(e) { 
                const fileContent = e.target.result;
                // Jika file adalah HTML, ambil teksnya saja. Jika tidak, gunakan apa adanya.
                if (file.type === "text/html") {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(fileContent, "text/html");
                    textInput.value = doc.body.textContent || "";
                } else {
                    textInput.value = fileContent;
                }
            };
            reader.readAsText(file);
        }
    }

    function runTextAnalysis() {
        const text = textInput.value;
        const query = searchQuery.value;
        const isCaseSensitive = caseSensitiveCheckbox.checked;

        loadingAnalyzer.classList.remove('hidden');
        resultsAnalyzer.classList.add('hidden');
        errorAnalyzer.classList.add('hidden');

        if (!text.trim() || !query.trim()) {
            errorAnalyzer.textContent = 'Area teks dan kata kunci pencarian tidak boleh kosong.';
            errorAnalyzer.classList.remove('hidden');
            loadingAnalyzer.classList.add('hidden');
            return;
        }

        setTimeout(() => {
            const lines = text.split('\n');
            let totalCount = 0;
            const resultDetails = [];
            const queryToSearch = isCaseSensitive ? query : query.toLowerCase();

            lines.forEach((line, index) => {
                const lineToSearch = isCaseSensitive ? line : line.toLowerCase();
                if (lineToSearch.includes(queryToSearch)) {
                    const regex = new RegExp(escapeRegExp(queryToSearch), 'g');
                    const countInLine = (lineToSearch.match(regex) || []).length;
                    totalCount += countInLine;
                    resultDetails.push({ lineNumber: index + 1, content: line, originalQuery: query });
                }
            });
            
            displayTextAnalyzerResults(totalCount, resultDetails);
            loadingAnalyzer.classList.add('hidden');
            resultsAnalyzer.classList.remove('hidden');
        }, 300);
    }

    function displayTextAnalyzerResults(totalCount, details) {
        const query = searchQuery.value;
        summaryAnalyzer.innerHTML = `Kata kunci <strong>"${query}"</strong> ditemukan sebanyak <strong>${totalCount}</strong> kali.`;
        detailsAnalyzer.innerHTML = '';

        if (details.length > 0) {
            details.forEach(item => {
                const li = document.createElement('li');
                const highlightRegex = new RegExp(escapeRegExp(item.originalQuery), 'gi');
                const highlightedContent = item.content.replace(highlightRegex, `<span class="highlight">$&</span>`);
                li.innerHTML = `<strong>Baris ${item.lineNumber}:</strong> ${highlightedContent}`;
                detailsAnalyzer.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "Tidak ditemukan di baris manapun.";
            li.style.color = '#6b7280';
            detailsAnalyzer.appendChild(li);
        }
    }
    
    function resetAnalyzerTool() {
        textInput.value = '';
        searchQuery.value = '';
        fileInputAnalyzer.value = '';
        updateFileName(fileInputAnalyzer, fileNameAnalyzer);
        caseSensitiveCheckbox.checked = false;
        resultsAnalyzer.classList.add('hidden');
        errorAnalyzer.classList.add('hidden');
        loadingAnalyzer.classList.add('hidden');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});