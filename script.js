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

    // 単語リスト (単語, 品詞)  ‑ TOEIC 頻出語を中心に 100 語
    const wordList = [
        // ── Nouns ── 26
        { word: 'apple', pos: 'noun' }, { word: 'book', pos: 'noun' },
        { word: 'information', pos: 'noun' }, { word: 'student', pos: 'noun' },
        { word: 'happiness', pos: 'noun' }, { word: 'science', pos: 'noun' },
        { word: 'decision', pos: 'noun' }, { word: 'computer', pos: 'noun' },
        { word: 'water', pos: 'noun' }, { word: 'development', pos: 'noun' },
        { word: 'research', pos: 'noun' }, { word: 'ability', pos: 'noun' },
        { word: 'employee', pos: 'noun' }, { word: 'manager', pos: 'noun' },
        { word: 'client', pos: 'noun' }, { word: 'revenue', pos: 'noun' },
        { word: 'contract', pos: 'noun' }, { word: 'schedule', pos: 'noun' },
        { word: 'presentation', pos: 'noun' }, { word: 'shipment', pos: 'noun' },
        { word: 'product', pos: 'noun' }, { word: 'service', pos: 'noun' },
        { word: 'market', pos: 'noun' }, { word: 'policy', pos: 'noun' },
        { word: 'proposal', pos: 'noun' }, { word: 'deadline', pos: 'noun' },

        // ── Verbs ── 25
        { word: 'run', pos: 'verb' }, { word: 'eat', pos: 'verb' },
        { word: 'study', pos: 'verb' }, { word: 'think', pos: 'verb' },
        { word: 'develop', pos: 'verb' }, { word: 'create', pos: 'verb' },
        { word: 'explain', pos: 'verb' }, { word: 'decide', pos: 'verb' },
        { word: 'manage', pos: 'verb' }, { word: 'communicate', pos: 'verb' },
        { word: 'increase', pos: 'verb' }, { word: 'provide', pos: 'verb' },
        { word: 'arrange', pos: 'verb' }, { word: 'deliver', pos: 'verb' },
        { word: 'purchase', pos: 'verb' }, { word: 'supply', pos: 'verb' },
        { word: 'replace', pos: 'verb' }, { word: 'request', pos: 'verb' },
        { word: 'require', pos: 'verb' }, { word: 'recommend', pos: 'verb' },
        { word: 'approve', pos: 'verb' }, { word: 'negotiate', pos: 'verb' },
        { word: 'implement', pos: 'verb' }, { word: 'hire', pos: 'verb' },
        { word: 'confirm', pos: 'verb' },

        // ── Adjectives ── 21
        { word: 'beautiful', pos: 'adjective' }, { word: 'happy', pos: 'adjective' },
        { word: 'important', pos: 'adjective' }, { word: 'difficult', pos: 'adjective' },
        { word: 'scientific', pos: 'adjective' }, { word: 'large', pos: 'adjective' },
        { word: 'small', pos: 'adjective' }, { word: 'red', pos: 'adjective' },
        { word: 'new', pos: 'adjective' }, { word: 'possible', pos: 'adjective' },
        { word: 'effective', pos: 'adjective' }, { word: 'available', pos: 'adjective' },
        { word: 'additional', pos: 'adjective' }, { word: 'annual', pos: 'adjective' },
        { word: 'monthly', pos: 'adjective' }, { word: 'convenient', pos: 'adjective' },
        { word: 'efficient', pos: 'adjective' }, { word: 'eligible', pos: 'adjective' },
        { word: 'required', pos: 'adjective' }, { word: 'previous', pos: 'adjective' },
        { word: 'financial', pos: 'adjective' },

        // ── Adverbs ── 28
        { word: 'quickly', pos: 'adverb' }, { word: 'slowly', pos: 'adverb' },
        { word: 'happily', pos: 'adverb' }, { word: 'carefully', pos: 'adverb' },
        { word: 'often', pos: 'adverb' }, { word: 'very', pos: 'adverb' },
        { word: 'really', pos: 'adverb' }, { word: 'well', pos: 'adverb' },
        { word: 'easily', pos: 'adverb' }, { word: 'finally', pos: 'adverb' },
        { word: 'recently', pos: 'adverb' }, { word: 'usually', pos: 'adverb' },
        { word: 'approximately', pos: 'adverb' }, { word: 'immediately', pos: 'adverb' },
        { word: 'regularly', pos: 'adverb' }, { word: 'currently', pos: 'adverb' },
        { word: 'especially', pos: 'adverb' }, { word: 'accordingly', pos: 'adverb' },
        { word: 'separately', pos: 'adverb' }, { word: 'subsequently', pos: 'adverb' },
        { word: 'significantly', pos: 'adverb' }, { word: 'primarily', pos: 'adverb' },
        { word: 'promptly', pos: 'adverb' }, { word: 'beforehand', pos: 'adverb' },
        { word: 'frequently', pos: 'adverb' }, { word: 'typically', pos: 'adverb' },
        { word: 'mainly', pos: 'adverb' }, { word: 'nearly', pos: 'adverb' }
    ];

    // 状態変数
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
        // 残り時間が0未満にならないように表示
        timerDisplay.textContent = remainingTime >= 0 ? remainingTime : 0;
    }

    function startQuestionTimer() {
        stopQuestionTimer(); // 既存のタイマーをクリア
        if (timeLimit <= 0 || isPaused) {
            timerDisplay.textContent = "--"; // 無制限またはポーズ中は "--" 表示
            return;
        }

        remainingTime = timeLimit; // 残り時間をリセット
        updateTimerDisplay(); // 初期表示

        timerIntervalId = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();

            if (remainingTime < 0) { // 0秒になった次のインターバルで時間切れ
                handleTimeout();
            }
        }, 1000);
    }

    function handleTimeout() {
        stopQuestionTimer();
        incorrectCount++; // 時間切れは不正解
        updateScoreDisplay();
        const correctPosJp = posJpMap[currentWordData.pos] || currentWordData.pos;
        resultDisplay.textContent = `時間切れ！ 正解は「${correctPosJp}」`;
        resultDisplay.className = 'timeout';
        submitButton.disabled = true;
        nextButton.style.display = 'inline-block';
        radioButtons.forEach(rb => rb.disabled = true);
    }

     // タイマー再開用関数 (ポーズ解除時に呼ばれる)
     function resumeQuestionTimer() {
         stopQuestionTimer(); // 念のためクリア
         // 再開条件: 時間制限あり、残り時間あり、問題データあり、ポーズ中でない
         if (timeLimit > 0 && remainingTime > 0 && currentWordData && !isPaused) {
             updateTimerDisplay(); // まず現在の残り時間を表示

             timerIntervalId = setInterval(() => {
                 remainingTime--;
                 updateTimerDisplay();
                 if (remainingTime < 0) {
                     handleTimeout();
                 }
             }, 1000);
         } else {
             // 再開できない場合（時間切れ後など）は表示を適切に保つ
              timerDisplay.textContent = timeLimit <= 0 ? "--" : (remainingTime >= 0 ? remainingTime : 0);
         }
    }

    // --- クイズロジック関連 ---
    function loadNextWord() {
        isPaused = false; // ポーズ解除
        stopQuestionTimer(); // 前の問題のタイマー停止

        resultDisplay.textContent = '';
        resultDisplay.className = '';
        radioButtons.forEach(rb => {
             rb.checked = false;
             rb.disabled = false; // 選択肢を有効化
        });

        // ランダムに単語を選択
        const randomIndex = Math.floor(Math.random() * wordList.length);
        currentWordData = wordList[randomIndex];
        wordDisplay.textContent = currentWordData.word;

        // ボタン状態更新
        submitButton.disabled = false; // 解答ボタン有効化
        nextButton.style.display = 'none'; // 次の問題ボタン非表示

        startQuestionTimer(); // 新しい問題のタイマー開始
    }

    function handleSubmit() {
        if (isPaused) return; // ポーズ中は解答不可

        const selectedOption = document.querySelector('input[name="pos"]:checked');
        if (!selectedOption) {
            alert('品詞を選択してください。');
            return;
        }

        stopQuestionTimer(); // 解答したらタイマー停止

        const userAnswer = selectedOption.value;
        const correctAnswer = currentWordData.pos;

        // 正誤判定と結果表示
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

        updateScoreDisplay(); // スコア更新

        // ボタン状態更新
        submitButton.disabled = true; // 解答ボタン無効化
        nextButton.style.display = 'inline-block'; // 次の問題ボタン表示
        radioButtons.forEach(rb => rb.disabled = true); // 選択肢を無効化
    }

    function resetQuiz() {
        stopQuestionTimer(); // タイマー停止
        correctCount = 0;
        incorrectCount = 0;
        updateScoreDisplay(); // スコア表示リセット
        isPaused = false; // ポーズ解除
        loadNextWord(); // 最初の単語をロード
    }

    // --- 設定メニュー関連 ---
    function openSettings() {
        isPaused = true; // ポーズ状態にする
        stopQuestionTimer(); // タイマーを一時停止
        timeLimitSelect.value = timeLimit; // 現在の設定値をセレクトボックスに反映
        settingsModal.style.display = 'flex'; // モーダル表示
    }

    function closeSettings() {
        settingsModal.style.display = 'none'; // モーダル非表示
        isPaused = false; // ポーズ解除
        // 解答前の問題が表示されている場合のみタイマーを再開
        if (!submitButton.disabled && currentWordData) {
             resumeQuestionTimer();
        } else {
            // 解答後や初期状態ならタイマー表示を更新するだけ
             timerDisplay.textContent = timeLimit <= 0 ? "--" : (remainingTime >= 0 ? remainingTime : 0);
        }
    }

    function handleTimeLimitChange() {
        timeLimit = parseInt(timeLimitSelect.value, 10);
        console.log(`時間制限を ${timeLimit <= 0 ? '無制限' : timeLimit + '秒'} に変更`);
        // 変更は次の問題から適用される (現在のタイマーには影響しない)
        // もし即時適用したい場合は、ここでもタイマー関連の処理が必要
        // 例: closeSettings() を呼ぶ前に現在のタイマーをリセットして表示更新するなど
        // 今回はシンプルに次の問題から適用
    }

    // --- イベントリスナー設定 ---
    submitButton.addEventListener('click', handleSubmit);
    nextButton.addEventListener('click', loadNextWord);
    settingsButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', closeSettings);
    resetButtonMenu.addEventListener('click', () => {
        resetQuiz(); // スコアと問題をリセット
        closeSettings(); // メニューを閉じる
    });
    timeLimitSelect.addEventListener('change', handleTimeLimitChange);
    // モーダルの背景クリックで閉じる
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) { // 背景部分がクリックされたかチェック
            closeSettings();
        }
    });

    // --- 初期化処理 ---
    // HTMLのselect要素で選択されている値を初期のtimeLimitとする
    timeLimit = parseInt(timeLimitSelect.value, 10);
    resetQuiz(); // 最初にリセット関数を呼んでクイズを開始

});