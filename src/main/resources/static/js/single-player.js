// 혼자하기(AI) 관련 로직 (변수는 app.js에 정의됨)

// 전문 엔진 초기화
function initStockfish() {
    if (typeof Stockfish !== 'undefined') {
        try {
            stockfish = Stockfish();
            stockfish.postMessage('uci');
            
            if (currentSkillLevel >= 19) {
                stockfish.postMessage('setoption name Skill Level value 20');
                stockfish.postMessage('setoption name Hash value 128');
            } else {
                stockfish.postMessage('setoption name Skill Level value ' + currentSkillLevel);
                stockfish.postMessage('setoption name Hash value 32');
            }
            
            stockfish.onmessage = function(event) {
                if (event.includes('bestmove')) {
                    const moveStr = event.split(' ')[1];
                    executeMove(moveStr);
                }
            };
        } catch (e) {
            console.error("Stockfish init error:", e);
        }
    }
}

// 사용자를 재촉하는 함수
function startNudgeTimer() {
    stopNudgeTimer();
    nudgeTimer = setTimeout(() => {
        if (game.turn() === 'w' && !game.game_over()) {
            const nudges = [
                "어디로 둘지 결정했니? 😊",
                `${userName}야, 천천히 생각해도 돼!`,
                "선생님은 기다리고 있어!",
                `${userName}야, 어떤 전략을 세우고 있니?`,
                "선생님은 준비 다 됐어! 천천히 해봐~"
            ];
            const ment = nudges[Math.floor(Math.random() * nudges.length)];
            $('#ai-message').text(ment);
            speak(ment);
            startNudgeTimer();
        }
    }, 30000);
}

function stopNudgeTimer() {
    if (nudgeTimer) clearTimeout(nudgeTimer);
}

function makeAIMove() {
    if (!stockfish) initStockfish();
    stopNudgeTimer();
    $('#ai-message').text('음... 어디로 두면 좋을까? 🤔');
    
    if (!stockfish) {
        const moves = game.moves();
        executeMove(moves[Math.floor(Math.random() * moves.length)]);
        return;
    }
    
    let depth = 10;
    let movetime = null;
    
    if (currentSkillLevel <= 5) {
        depth = 10;
    } else if (currentSkillLevel <= 12) {
        depth = 15;
    } else if (currentSkillLevel <= 18) {
        depth = 20;
    } else {
        depth = 40;
        movetime = 10000;
    }

    stockfish.postMessage('position fen ' + game.fen());
    if (movetime) {
        stockfish.postMessage('go depth ' + depth + ' movetime ' + movetime);
    } else {
        stockfish.postMessage('go depth ' + depth);
    } 
}

function executeMove(moveStr) {
    if (game.game_over() || game.turn() === 'w') return;

    const move = game.move(moveStr, { sloppy: true });
    if (move === null) {
        const moves = game.moves();
        if (moves.length > 0) {
            game.move(moves[Math.floor(Math.random() * moves.length)]);
        }
    }

    board.position(game.fen());
    updateStatus();
    startNudgeTimer();
    
    const isMajorPieceCaptured = move && move.captured && move.captured !== 'p';
    const isCheckOrOver = game.in_check() || game.game_over();
    
    if (game.game_over()) {
        // Handled by checkGameOver
    } else if (isMajorPieceCaptured || isCheckOrOver) {
        getAIComment();
    } else {
        const casualMents = [
            "와! 정말 좋은 수네!",
            `${userName}야, 실력이 대단한데?`,
            "음, 제 차례군요.",
            "어디로 두면 좋을까?",
            "선생님도 집중하고 있어요!"
        ];
        const ment = casualMents[Math.floor(Math.random() * casualMents.length)];
        $('#ai-message').text(ment);
        speak(ment);
    }
    checkGameOver();
}

function getAIComment() {
    $.ajax({
        url: '/api/ai/move',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            fen: game.fen(), 
            turn: game.turn() === 'w' ? 'White' : 'Black',
            userName: userName
        }),
        success: function(response) {
            $('#ai-message').text(response.comment);
            speak(response.comment);
        }
    });
}

