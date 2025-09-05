const fileInput = document.getElementById('file-input');
const fileInputContainer = document.getElementById('file-input-container');

const quizContainer = document.getElementById('quiz-container');
const progressCounterEl = document.getElementById('progress-counter');
const wordEl = document.getElementById('word');
const meaningEl = document.getElementById('meaning');

const controls = document.getElementById('controls');
const showMeaningBtn = document.getElementById('show-meaning-button');
const stopBtn = document.getElementById('stop-button');

const resultContainer = document.getElementById('result-container');
const retryBtn = document.getElementById('retry-button');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

const favoriteStar = document.getElementById('favorite-star');

let allWords = [];
let currentWords = [];
let currentIndex = 0;

let phase1Timer = null;
let phase2Timer = null;
let isPaused = false;
let remainingTime = 0;
let currentPhase = '';
let phaseStartTime = 0;

let isFavorite = false; // 星マークの状態

// 初期非表示
quizContainer.classList.add('hidden');
controls.classList.add('hidden');
progressContainer.classList.add('hidden');
resultContainer.classList.add('hidden');

fileInput.addEventListener('change', handleFileSelect);
retryBtn.addEventListener('click', () => startQuiz(allWords));
stopBtn.addEventListener('click', togglePause);

favoriteStar.addEventListener('click', () => {
    if (!currentWords[currentIndex]) return;
    const currentWord = currentWords[currentIndex];
    currentWord.favorite = !currentWord.favorite;
    favoriteStar.textContent = currentWord.favorite ? '★' : '☆';
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileInputContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    controls.classList.remove('hidden');
    progressContainer.classList.remove('hidden');

    wordEl.textContent = "読み込み中…";
    meaningEl.textContent = "";
    meaningEl.classList.remove('visible');
    progressCounterEl.textContent = "";

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error("JSON is not an array.");

            allWords = data.filter(item => item.単語 && item.意味).map(item => ({
                word: item.単語,
                meaning: item.意味,
                favorite: false
            }));

            if (allWords.length > 0) {
                startQuiz(allWords);
            } else {
                alert("有効なデータがファイル内に見つかりませんでした。");
                fileInputContainer.classList.remove('hidden');
                quizContainer.classList.add('hidden');
                controls.classList.add('hidden');
                progressContainer.classList.add('hidden');
            }
        } catch (error) {
            alert("JSONファイルの解析に失敗しました。");
            console.error(error);
            fileInputContainer.classList.remove('hidden');
            quizContainer.classList.add('hidden');
            controls.classList.add('hidden');
            progressContainer.classList.add('hidden');
        }
    };
    reader.onerror = () => {
        alert("ファイルの読み込みに失敗しました。");
        fileInputContainer.classList.remove('hidden');
        quizContainer.classList.add('hidden');
        controls.classList.add('hidden');
        progressContainer.classList.add('hidden');
    };
    reader.readAsText(file, "UTF-8");
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startQuiz(words) {
    currentWords = [...words];
    shuffleArray(currentWords);

    if (currentWords.length > 15) {
        currentWords = currentWords.slice(0, 15);
    }

    currentIndex = 0;
    isPaused = false;
    stopBtn.textContent = 'ストップ';
    stopBtn.disabled = false;

    resultContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    controls.classList.remove('hidden');
    progressContainer.classList.remove('hidden');

    processNextWord();
}

function processNextWord() {
    if (currentIndex >= currentWords.length) {
        showResult();
        return;
    }

    clearTimeout(phase1Timer);
    clearTimeout(phase2Timer);

    const current = currentWords[currentIndex];
    wordEl.textContent = current.word;
    meaningEl.textContent = current.meaning;
    meaningEl.classList.remove('visible');
    showMeaningBtn.disabled = false;
    stopBtn.disabled = false;
    progressCounterEl.textContent = `${currentIndex + 1} / ${currentWords.length}`;

    // 星マーク状態反映
    favoriteStar.textContent = current.favorite ? '★' : '☆';

    currentPhase = 'phase1';
    remainingTime = 3000;
    phaseStartTime = Date.now();

    progressBar.style.transition = 'none';
    progressBar.style.backgroundColor = 'var(--stop-btn-bg)';
    progressBar.style.width = '0%';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            progressBar.style.transition = `width ${remainingTime / 1000}s linear`;
            progressBar.style.width = '100%';
        });
    });

    showMeaningBtn.onclick = () => {
        if (isPaused) return;
        clearTimeout(phase1Timer);
        showMeaningAndStartPhase2();
    };

    phase1Timer = setTimeout(showMeaningAndStartPhase2, remainingTime);
}

function showMeaningAndStartPhase2() {
    if (isPaused) return;

    showMeaningBtn.disabled = true;
    meaningEl.classList.add('visible');

    currentPhase = 'phase2';
    remainingTime = 2000;
    phaseStartTime = Date.now();

    progressBar.style.transition = 'none';
    progressBar.style.backgroundColor = 'var(--accent-color)';
    progressBar.style.width = '100%';

    phase2Timer = setTimeout(() => {
        currentIndex++;
        stopBtn.disabled = false;
        processNextWord();
    }, remainingTime);
}

function togglePause() {
    if (isPaused) { 
        // 再開
        isPaused = false;
        stopBtn.textContent = 'ストップ';
        if (currentPhase === 'phase1') {
            showMeaningBtn.disabled = false;
        }

        phaseStartTime = Date.now();

        if (currentPhase === 'phase1') {
            progressBar.style.transition = `width ${remainingTime / 1000}s linear`;
            progressBar.style.width = '100%';
            phase1Timer = setTimeout(showMeaningAndStartPhase2, remainingTime);
        } else if (currentPhase === 'phase2') {
            phase2Timer = setTimeout(() => {
                currentIndex++;
                processNextWord();
            }, remainingTime);
        }
    } else { 
        // 停止
        isPaused = true;
        stopBtn.textContent = '再開';

        if (currentPhase === 'phase1') {
            showMeaningBtn.disabled = true;
        }

        const pauseTime = Date.now();
        remainingTime -= (pauseTime - phaseStartTime);

        if (currentPhase === 'phase1') {
            clearTimeout(phase1Timer);
            const currentWidth = getComputedStyle(progressBar).width;
            progressBar.style.transition = 'none';
            progressBar.style.width = currentWidth;
        } else if (currentPhase === 'phase2') {
            clearTimeout(phase2Timer);
        }
    }
}

function showResult() {
    clearTimeout(phase1Timer);
    clearTimeout(phase2Timer);

    quizContainer.classList.add('hidden');
    controls.classList.add('hidden');
    progressContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    // 単語一覧を生成
    const resultWordsEl = document.getElementById('result-words');
    resultWordsEl.innerHTML = '';

    currentWords.forEach(word => {
        const div = document.createElement('div');
        div.classList.add('result-word');
        div.classList.add(word.favorite ? 'starred' : 'unstarred');
        div.textContent = `${word.word} ： ${word.meaning}`;
        resultWordsEl.appendChild(div);
    });
}
