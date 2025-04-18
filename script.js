'use strict'; // より厳格なエラーチェック

// --- DOM要素の取得 ---
const modeSelection = document.getElementById('mode-selection');
const quizArea = document.getElementById('quiz-area');
const resultArea = document.getElementById('result-area');
const pauseOverlay = document.getElementById('pause-overlay');

const vocabModeButton = document.getElementById('vocab-mode-button');
const posModeButton = document.getElementById('pos-mode-button');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const homeButton = document.getElementById('home-button');
const nextButton = document.getElementById('next-button');
const restartButton = document.getElementById('restart-button');

const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const timeLimitSelect = document.getElementById('time-limit-select');

// --- 定数 ---
const PARTS_OF_SPEECH = {
    'noun': '名詞 (noun)',
    'verb': '動詞 (verb)',
    'adjective': '形容詞 (adjective)',
    'adverb': '副詞 (adverb)'
};
const POS_OPTIONS = Object.values(PARTS_OF_SPEECH); // 品詞問題の固定選択肢

// --- ゲーム状態変数 ---
let wordsData = []; // 単語データ
let currentMode = null; // 'vocab' or 'pos'
let currentQuestionIndex = 0;
let score = 0;
let correctAnswers = 0;
let incorrectAnswers = 0; //  不正解数をカウントする変数を追加
//let totalQuestionsAsked = 0; //合計の問題数（今はつかわない
let currentWord = null;
let shuffledIndices = []; // 単語の出題順序を保持
let timerInterval = null;
let timeLeft = 0; // 秒
let currentTimeLimit = 10; // デフォルト10秒 (0で無制限)
let isPaused = false;
let isAnswered = false; // 現在の問題に回答済みか


// --- 初期化処理 ---
async function initializeApp() {
    try {
        const response = await fetch('words.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        wordsData = await response.json();
        if (!wordsData || wordsData.length === 0) {
            throw new Error('単語データが空または読み込めませんでした。');
        }
        console.log("単語データを読み込みました:", wordsData);
        setupEventListeners();
        // 初期画面表示
        showModeSelection();
    } catch (error) {
        console.error("初期化中にエラーが発生しました:", error);
        // エラーメッセージをユーザーに表示する処理を追加しても良い
        document.getElementById('app').innerHTML = `<p style="color: red;">エラー: アプリケーションを初期化できませんでした。(${error.message})</p>`;
    }
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
    vocabModeButton.addEventListener('click', () => startGame('vocab'));
    posModeButton.addEventListener('click', () => startGame('pos'));
    nextButton.addEventListener('click', goToNextQuestion);
    pauseButton.addEventListener('click', togglePause);
    resumeButton.addEventListener('click', togglePause);
    homeButton.addEventListener('click', goHome);
    timeLimitSelect.addEventListener('change', updateTimeLimit);
    restartButton.addEventListener('click', showModeSelection); // もう一度挑戦
}

// --- 画面表示制御 ---
function showModeSelection() {
    modeSelection.classList.remove('hidden');
    quizArea.classList.add('hidden');
    resultArea.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    resetGame(); // ゲーム状態をリセット
}

function showQuizArea() {
    modeSelection.classList.add('hidden');
    quizArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
}

function showResultArea() {
    modeSelection.classList.add('hidden');
    quizArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
    pauseOverlay.classList.add('hidden');
    // finalScoreElement.textContent = `最終スコア: ${correctAnswers} / ${totalQuestionsAsked}`;
    finalScoreElement.textContent = `最終結果 - 正答: ${correctAnswers}  誤答: ${incorrectAnswers}`; // ★ 表示形式を変更
}

// --- ゲームロジック ---

/**
 * ゲームを開始する
 * @param {string} mode 'vocab' または 'pos'
 */
function startGame(mode) {
    currentMode = mode;
    resetGame(); // ゲーム状態を初期化
    currentTimeLimit = parseInt(timeLimitSelect.value, 10); // 現在の設定値を反映
    shuffledIndices = shuffleArray([...Array(wordsData.length).keys()]); // 0から始まる連番配列をシャッフル
    console.log("出題順:", shuffledIndices);
    showQuizArea();
    displayQuestion();
}

/**
 * ゲーム状態をリセットする
 */
function resetGame() {
    currentQuestionIndex = 0;
    score = 0; // ※ score 変数は現在未使用だが、将来的なスコアリングのために残す
    correctAnswers = 0; // 正答の数
    incorrectAnswers = 0; //誤答の数
    // totalQuestionsAsked = 0;
    currentWord = null;
    shuffledIndices = [];
    stopTimer();
    timeLeft = 0;
    isPaused = false;
    isAnswered = false;
    updateScoreDisplay(); // 表示をリセット
    updateTimerDisplay(); // 表示をリセット
    feedbackElement.textContent = '';
    feedbackElement.className = ''; // クラスもリセット
    optionsContainer.innerHTML = ''; // 選択肢クリア
    nextButton.disabled = true;
    pauseButton.disabled = false; // ポーズボタンは有効化
}

/**
 * 現在の問題を表示する
 */
function displayQuestion() {
    if (currentQuestionIndex >= shuffledIndices.length) {
        showResultArea();
        return;
    }

    isAnswered = false; // 新しい問題なので回答フラグをリセット
    const wordIndex = shuffledIndices[currentQuestionIndex];
    currentWord = wordsData[wordIndex];
    // totalQuestionsAsked++;

    // 問題文設定
    if (currentMode === 'vocab') {
        questionElement.textContent = `「${currentWord.word}」の意味は？`;
    } else {
        questionElement.textContent = `「${currentWord.word}」の品詞は？`;
    }

    // 選択肢生成と表示
    generateOptions();

    // UIリセット
    feedbackElement.textContent = '';
    feedbackElement.className = '';
    nextButton.disabled = true;
    updateScoreDisplay();

    // タイマースタート
    startTimer();
}

/**
 * 選択肢を生成し表示する
 */
function generateOptions() {
    optionsContainer.innerHTML = ''; // 古い選択肢をクリア
    let options = [];

    if (currentMode === 'vocab') {
        // --- 語彙問題の選択肢生成 ---
        const correctAnswer = currentWord.meaning;
        options.push({ text: correctAnswer, correct: true });

        // 他の単語から誤答を3つ選ぶ (意味が重複せず、正解の単語を除く)
        const otherWords = wordsData.filter((word, index) => index !== shuffledIndices[currentQuestionIndex]);
        const shuffledOtherWords = shuffleArray(otherWords);

        let incorrectAnswersCount = 0;
        for (const otherWord of shuffledOtherWords) {
            if (incorrectAnswersCount < 3 && otherWord.meaning !== correctAnswer && !options.some(opt => opt.text === otherWord.meaning)) {
                options.push({ text: otherWord.meaning, correct: false });
                incorrectAnswersCount++;
            }
            if (incorrectAnswersCount >= 3) break;
        }
        // 万が一誤答が3つ集まらなかった場合のフォールバック (単純な重複ありでも追加)
        while (options.length < 4 && otherWords.length > 0) {
            const fallbackWord = otherWords.pop(); // 末尾から取る
             if (fallbackWord.meaning !== correctAnswer && !options.some(opt => opt.text === fallbackWord.meaning)) {
                 options.push({ text: fallbackWord.meaning, correct: false });
             }
        }
         // さらに足りない場合 (データが少ない場合に備え、ダミーを入れるなど考慮可能)
        while (options.length < 4) {
             options.push({ text: `ダミー選択肢 ${options.length}`, correct: false });
        }


    } else {
        // --- 品詞問題の選択肢生成 ---
        const correctAnswer = PARTS_OF_SPEECH[currentWord.partOfSpeech];
        // 固定の選択肢を使用
        options = POS_OPTIONS.map(pos => ({
            text: pos,
            correct: pos === correctAnswer
        }));
    }

    // 選択肢をシャッフルしてボタンを作成
    // 選択肢をシャッフルするかどうかを決定
    let optionsToDisplay = [];
    if (currentMode === 'vocab') {
        // 語彙モードの場合は選択肢をシャッフルする
        optionsToDisplay = shuffleArray(options);
        console.log("語彙モード: 選択肢をシャッフルしました"); // デバッグ用ログ
    } else {
        // 品詞モードの場合はシャッフルしない (定義された順序のまま)
        optionsToDisplay = options;
        console.log("品詞モード: 選択肢を固定順序で表示します"); // デバッグ用ログ
}

// ボタンを作成して表示
optionsToDisplay.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;
    button.dataset.correct = option.correct;
    button.addEventListener('click', handleAnswer);
    optionsContainer.appendChild(button);
});
}

/**
 * 回答ボタンがクリックされたときの処理
 * @param {Event} event クリックイベント
 */
function handleAnswer(event) {
    if (isAnswered || isPaused) return; // 回答済み、またはポーズ中は処理しない

    isAnswered = true;
    stopTimer();
    const selectedButton = event.target;
    const isCorrect = selectedButton.dataset.correct === 'true';

    // 全ての選択肢ボタンを無効化
    const optionButtons = optionsContainer.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);

    // 正誤判定とフィードバック
    if (isCorrect) {
        correctAnswers++;
        feedbackElement.textContent = '正解！';
        feedbackElement.className = 'feedback-correct';
        selectedButton.classList.add('correct');
    } else {
        incorrectAnswers++; // ★ 不正解カウントを追加
        feedbackElement.textContent = `不正解… 正解は「${getCorrectAnswerText()}」`;
        feedbackElement.className = 'feedback-incorrect';
        selectedButton.classList.add('incorrect');
        // 正解の選択肢をハイライト
        optionButtons.forEach(btn => {
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correct-answer-highlight');
            }
        });
        updateScoreDisplay(); // スコア表示更新
        nextButton.disabled = false;
    }

    updateScoreDisplay();
    nextButton.disabled = false; // 次へボタンを有効化
}

/**
 * 正解のテキストを取得する
 * @returns {string} 正解のテキスト
 */
function getCorrectAnswerText() {
    if (currentMode === 'vocab') {
        return currentWord.meaning;
    } else {
        return PARTS_OF_SPEECH[currentWord.partOfSpeech];
    }
}

/**
 * 次の問題へ進む
 */
function goToNextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

// --- タイマー関連 ---

/**
 * タイマーを開始する
 */
function startTimer() {
    stopTimer(); // 念のため既存のタイマーをクリア
    if (currentTimeLimit <= 0) { // 制限時間なしの場合
        timeLeft = 0; // 表示用に0
        updateTimerDisplay();
        return;
    }

    timeLeft = currentTimeLimit;
    updateTimerDisplay(); // まず初期表示

    timerInterval = setInterval(() => {
        if (isPaused) return; // ポーズ中はカウントダウンしない

        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000); // 1秒ごとに実行
}

/**
 * タイマーを停止する
 */
function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/**
 * 時間切れ処理
 */
function handleTimeout() {
    if (isAnswered) return; // 既に回答済みなら何もしない

    stopTimer();
    isAnswered = true; // 時間切れでも回答済み扱い
    incorrectAnswers++; // 時間切れも誤答扱い

    feedbackElement.textContent = `時間切れ！ 正解は「${getCorrectAnswerText()}」`;
    feedbackElement.className = 'feedback-timeout';

    // 全ての選択肢ボタンを無効化し、正解をハイライト
    const optionButtons = optionsContainer.querySelectorAll('button');
    optionButtons.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.correct === 'true') {
            btn.classList.add('correct-answer-highlight');
        }
        updateScoreDisplay(); // スコア表示更新
        nextButton.disabled = false;
    });

    updateScoreDisplay(); // スコア表示更新 (正解数は増えない)
    nextButton.disabled = false; // 次へボタンを有効化
}


// --- ポーズ機能 ---

/**
 * ポーズ状態を切り替える
 */
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        // ポーズ開始
        pauseOverlay.classList.remove('hidden');
        pauseButton.textContent = '再開'; // ボタンテキスト変更
        // タイマーが動いていれば、この瞬間の残り時間を保持 (startTimer/stopTimerで管理されるため、追加処理は不要)
    } else {
        // ポーズ解除
        pauseOverlay.classList.add('hidden');
        pauseButton.textContent = 'ポーズ';
        // タイマーが動作中だった場合、カウントダウンが再開される (setIntervalは止まっていないが、内部のif(isPaused)で処理がスキップされていた)
        // 瞬間的な時間表示のズレを防ぐため、表示を更新
        updateTimerDisplay();
    }
}

/**
 * 制限時間を更新する
 */
function updateTimeLimit() {
    currentTimeLimit = parseInt(timeLimitSelect.value, 10);
    console.log("制限時間を変更:", currentTimeLimit > 0 ? `${currentTimeLimit}秒` : "無制限");
    // 次の問題から適用されるため、ここではタイマーの再起動などはしない
}

/**
 * ホーム画面に戻る
 */
function goHome() {
    stopTimer(); // 念のためタイマー停止
    showModeSelection(); // モード選択画面表示＆ゲームリセット
    isPaused = false; // ポーズ状態も解除
    pauseButton.textContent = 'ポーズ'; // ボタンテキストを戻す
}


// --- 表示更新系 ---

/**
 * スコア表示を更新する
 */
function updateScoreDisplay() {
    // scoreElement.textContent = `スコア: ${correctAnswers} / ${totalQuestionsAsked}`;
    scoreElement.textContent = `正答: ${correctAnswers}  誤答: ${incorrectAnswers}`; // ★ 表示形式を変更
}

/**
 * タイマー表示を更新する
 */
function updateTimerDisplay() {
    if (currentTimeLimit <= 0) {
        timerElement.textContent = '残り時間: --';
    } else {
        timerElement.textContent = `残り時間: ${timeLeft} 秒`;
    }
}

// --- ヘルパー関数 ---

/**
 * 配列の要素をランダムにシャッフルする (Fisher-Yatesアルゴリズム)
 * @param {Array} array シャッフルしたい配列
 * @returns {Array} シャッフルされた新しい配列
 */
function shuffleArray(array) {
    const newArray = [...array]; // 元の配列を変更しないようにコピー
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 要素を交換
    }
    return newArray;
}

// --- アプリケーション開始 ---
initializeApp();