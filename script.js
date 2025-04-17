document.addEventListener('DOMContentLoaded', () => {
    // HTML要素取得
    const wordDisplay = document.getElementById('wordDisplay');
    const posOptions = document.getElementById('posOptions');
    const resultDisplay = document.getElementById('resultDisplay');
    const submitButton = document.getElementById('submitButton');
    const nextButton = document.getElementById('nextButton');
    const correctCountSpan = document.getElementById('correctCount');
    const incorrectCountSpan = document.getElementById('incorrectCount');
    const radioButtons = document.querySelectorAll('input[name="pos"]');
    const quizContainer = document.getElementById('quizContainer');
    const timerDisplay = document.getElementById('timerDisplay');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const timeLimitSelect = document.getElementById('timeLimitSelect');
    const resetButtonMenu = document.getElementById('resetButtonMenu');
    const closeSettingsButton = document.getElementById('closeSettingsButton');

    // 品詞の日本語名マッピング
    const posJpMap = {
        'noun': '名詞',
        'verb': '動詞',
        'adjective': '形容詞',
        'adverb': '副詞'
    };

    // 状態変数
    let wordList = []; // 単語リスト (JSONから読み込む)
    let currentWordData = null;
    let correctCount = 0;
    let incorrectCount = 0;
    let timeLimit = 15; // 時間制限（秒数、0は無制限）。<select>のselected値と合わせる
    let timerIntervalId = null;
    let remainingTime = 0;
    let isPaused = false;

    // スコア表示更新
    function updateScoreDisplay() {
        correctCountSpan.textContent = correctCount;
        incorrectCountSpan.textContent = incorrectCount;
    }

    // --- タイマー関連 ---
    function stopQuestionTimer() {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = remainingTime >= 0 ? remainingTime : 0;
    }

    function startQuestionTimer() {
        stopQuestionTimer();
        if (timeLimit <= 0 || isPaused) {
            timerDisplay.textContent = "--";
            return;
        }
        remainingTime = timeLimit;
        updateTimerDisplay();
        timerIntervalId = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime < 0) {
                handleTimeout();
            }
        }, 1000);
    }

    function handleTimeout() {
        stopQuestionTimer();
        incorrectCount++;
        updateScoreDisplay();
        const correctPosJp = posJpMap[currentWordData.pos] || currentWordData.pos;
        resultDisplay.textContent = `時間切れ！ 正解は「${correctPosJp}」`;
        resultDisplay.className = 'timeout';
        submitButton.disabled = true;
        nextButton.style.display = 'inline-block';
        radioButtons.forEach(rb => rb.disabled = true);
    }

     function resumeQuestionTimer() {
         stopQuestionTimer();
         if (timeLimit > 0 && remainingTime > 0 && currentWordData && !isPaused) {
             updateTimerDisplay();
             timerIntervalId = setInterval(() => {
                 remainingTime--;
                 updateTimerDisplay();
                 if (remainingTime < 0) {
                     handleTimeout();
                 }
             }, 1000);
         } else {
              timerDisplay.textContent = timeLimit <= 0 ? "--" : (remainingTime >= 0 ? remainingTime : 0);
         }
    }

    // --- クイズロジック関連 ---
    function loadNextWord() {
        // wordListが読み込まれていない場合は処理中断
        if (!wordList || wordList.length === 0) {
            console.error("単語リストが空または読み込まれていません。");
            wordDisplay.textContent = "エラー"; // エラー表示
            submitButton.disabled = true;
            nextButton.style.display = 'none';
            radioButtons.forEach(rb => rb.disabled = true);
            return;
        }

        isPaused = false;
        stopQuestionTimer();

        resultDisplay.textContent = '';
        resultDisplay.className = '';
        radioButtons.forEach(rb => {
             rb.checked = false;
             rb.disabled = false;
        });

        const randomIndex = Math.floor(Math.random() * wordList.length);
        currentWordData = wordList[randomIndex];
        wordDisplay.textContent = currentWordData.word;

        submitButton.disabled = false;
        nextButton.style.display = 'none';

        startQuestionTimer();
    }

    function handleSubmit() {
        if (isPaused) return;

        const selectedOption = document.querySelector('input[name="pos"]:checked');
        if (!selectedOption) {
            alert('品詞を選択してください。');
            return;
        }

        stopQuestionTimer();

        const userAnswer = selectedOption.value;
        const correctAnswer = currentWordData.pos;

        if (userAnswer === correctAnswer) {
            correctCount++;
            resultDisplay.textContent = '正解！ 🎉';
            resultDisplay.className = 'correct';
        } else {
            incorrectCount++;
            const correctPosJp = posJpMap[correctAnswer] || correctAnswer;
            resultDisplay.textContent = `不正解... 正解は「${correctPosJp}」です。`;
            resultDisplay.className = 'incorrect';
        }

        updateScoreDisplay();

        submitButton.disabled = true;
        nextButton.style.display = 'inline-block';
        radioButtons.forEach(rb => rb.disabled = true);
    }

    function resetQuiz() {
        stopQuestionTimer();
        correctCount = 0;
        incorrectCount = 0;
        updateScoreDisplay();
        isPaused = false;

        // wordListが読み込まれていれば最初の単語をロード
        if (wordList && wordList.length > 0) {
             loadNextWord();
        } else {
             // まだ読み込まれていない場合 (初期化時など) は loadNextWord は loadWordList 完了後に呼ばれる
             console.log("単語リスト待機中...");
        }
    }

    // --- 設定メニュー関連 ---
    function openSettings() {
        isPaused = true;
        stopQuestionTimer();
        timeLimitSelect.value = timeLimit;
        settingsModal.style.display = 'flex';
    }

    function closeSettings() {
        settingsModal.style.display = 'none';
        isPaused = false;
        if (!submitButton.disabled && currentWordData) {
             resumeQuestionTimer();
        } else {
             timerDisplay.textContent = timeLimit <= 0 ? "--" : (remainingTime >= 0 ? remainingTime : 0);
        }
    }

    function handleTimeLimitChange() {
        timeLimit = parseInt(timeLimitSelect.value, 10);
        console.log(`時間制限を ${timeLimit <= 0 ? '無制限' : timeLimit + '秒'} に変更`);
        // 次の問題から適用
    }

    // --- 非同期でJSONファイルを読み込む関数 ---
    async function loadWordList() {
        try {
            // 'words.json' ファイルを fetch API で取得
            const response = await fetch('words.json');
            // ネットワークエラーなどをチェック
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // レスポンスボディをJSONとしてパース
            const loadedList = await response.json();

            // 読み込んだリストが配列であることを確認 (より安全に)
            if (Array.isArray(loadedList)) {
                wordList = loadedList; // グローバル変数に格納
                console.log('単語リスト読み込み成功:', wordList.length, '語');
                // 読み込み成功後に最初のクイズを開始
                resetQuiz();
            } else {
                 throw new Error('読み込んだデータが配列形式ではありません。');
            }

        } catch (error) {
            // エラーハンドリング
            console.error('単語リストの読み込みに失敗しました:', error);
            // ユーザーにエラーを通知 (より詳細なメッセージが良い場合もある)
            quizContainer.innerHTML = `<p style="color: red;">クイズデータの読み込みに失敗しました。<br>'words.json'ファイルを確認してください。</p>`;
            // ヘッダーなども非表示にするか検討
             document.getElementById('header').style.display = 'none';
        }
    }

    // --- イベントリスナー設定 ---
    submitButton.addEventListener('click', handleSubmit);
    nextButton.addEventListener('click', loadNextWord);
    settingsButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', closeSettings);
    resetButtonMenu.addEventListener('click', () => {
        resetQuiz();
        closeSettings();
    });
    timeLimitSelect.addEventListener('change', handleTimeLimitChange);
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettings();
        }
    });

    // --- 初期化処理 ---
    timeLimit = parseInt(timeLimitSelect.value, 10); // 初期時間制限を取得
    loadWordList(); // ★ 最初に単語リストを非同期で読み込む

});