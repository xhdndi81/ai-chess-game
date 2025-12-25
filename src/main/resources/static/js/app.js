let board = null;
let game = new Chess();
let userId = null;
let userName = null;
let movesCount = 0;
let nudgeTimer = null;
let stockfish = null;
let currentSkillLevel = 5;

// 음성 출력 관리 변수
let lastSpokenText = "";
let lastSpokenTime = 0;

// 음성 출력 함수 (시스템 TTS 전용 - 에러 없음)
function speak(text) {
    if (typeof speechSynthesis === 'undefined' || !text) return;
    
    // 1. 짧은 시간 내에 동일한 텍스트 중복 재생 방지
    const now = Date.now();
    if (text === lastSpokenText && (now - lastSpokenTime) < 1000) return;
    
    lastSpokenText = text;
    lastSpokenTime = now;

    // 2. 기존 음성 취소 및 약간의 지연 후 재생 (브라우저 버그 방지)
    speechSynthesis.cancel();
    
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        
        const preferredVoice = voices.find(v => v.lang === 'ko-KR' && (v.name.includes('Google') || v.name.includes('Natural'))) ||
                               voices.find(v => v.lang === 'ko-KR' && v.name.includes('Heami')) ||
                               voices.find(v => v.lang === 'ko-KR');

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.lang = 'ko-KR';
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
    }, 50);
}

// 전문 엔진 초기화
function initStockfish() {
    if (typeof Stockfish !== 'undefined') {
        try {
            stockfish = Stockfish();
            stockfish.postMessage('uci');
            stockfish.postMessage('setoption name Skill Level value ' + currentSkillLevel);
            // 메모리 사용량 최적화 (기본 16MB -> 32MB로 상향하여 성능 개선)
            stockfish.postMessage('setoption name Hash value 32');
            
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
        // 엔진 로드 실패 시 랜덤 수 (Fallback)
        const moves = game.moves();
        executeMove(moves[Math.floor(Math.random() * moves.length)]);
        return;
    }
    
    // 난이도에 따른 탐색 깊이 조절 (0~20)
    let depth = 10;
    if (currentSkillLevel <= 5) depth = 8;
    else if (currentSkillLevel <= 12) depth = 12;
    else if (currentSkillLevel <= 18) depth = 15;
    else depth = 18; // 마스터 모드

    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth ' + depth); 
}

function executeMove(moveStr) {
    // 이미 게임이 종료되었거나 내 차례(White)라면 실행 중단 (중복 실행 방지)
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
    
    // [비용 최적화] 폰(p)을 잡았을 때는 로컬 멘트, 중요한 말(n,b,r,q)이나 체크일 때만 ChatGPT 호출
    const isMajorPieceCaptured = move && move.captured && move.captured !== 'p';
    const isCheckOrOver = game.in_check() || game.game_over();
    
    if (isMajorPieceCaptured || isCheckOrOver) {
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
            userName: userName // 사용자 이름 추가
        }),
        success: function(response) {
            $('#ai-message').text(response.comment);
            speak(response.comment);
        }
    });
}

function onDragStart(source, piece) {
    if (game.game_over() || piece.search(/^b/) !== -1) return false;
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    
    stopNudgeTimer();
    updateStatus();
    movesCount++;

    // [비용 최적화] 사용자가 중요한 말(폰 제외)을 잡았거나 체크했을 때만 ChatGPT 호출
    const isUserMajorCapture = move.captured && move.captured !== 'p';
    if ((isUserMajorCapture || game.in_check()) && !game.game_over()) {
        getAIComment();
    }

    if (!checkGameOver()) window.setTimeout(makeAIMove, 500);
}

function onSnapEnd() { board.position(game.fen()); }

function updateStatus() {
    let moveColor = game.turn() === 'b' ? '흑색' : '백색';
    let status = game.in_checkmate() ? `게임 종료! ${moveColor} 패배.` : 
                 game.in_draw() ? "게임 종료! 무승부." : `${moveColor} 차례.`;
    if (game.in_check() && !game.in_checkmate()) status += " (체크!)";
    $('#game-status').text(status);
    updateCapturedPieces();
}

function updateCapturedPieces() {
    const history = game.history({ verbose: true });
    const capW = [], capB = [];
    history.forEach(m => {
        if (m.captured) {
            if (m.color === 'w') capB.push('b' + m.captured.toUpperCase());
            else capW.push('w' + m.captured.toUpperCase());
        }
    });
    const sortFn = (a, b) => ({'P':1,'N':2,'B':3,'R':4,'Q':5}[a[1]] - {'P':1,'N':2,'B':3,'R':4,'Q':5}[b[1]]);
    capW.sort(sortFn); capB.sort(sortFn);
    const theme = 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png';
    const img = p => `<img src="${theme.replace('{piece}', p)}" class="captured-piece" />`;
    $('#captured-black').html(capW.map(img).join(''));
    $('#captured-white').html(capB.map(img).join(''));
}

function checkGameOver() {
    if (game.game_over()) {
        const result = game.in_checkmate() ? (game.turn() === 'b' ? 'WIN' : 'LOSS') : 'DRAW';
        $.ajax({
            url: '/api/history/' + userId,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ result: result, movesCount: movesCount }),
            success: function() { alert('게임 종료! 결과가 저장되었습니다.'); }
        });
        return true;
    }
    return false;
}

$(document).ready(function() {
    // 저장된 설정 불러오기
    const savedName = localStorage.getItem('chess_username');
    if (savedName) {
        $('#username').val(savedName);
    }

    const savedDiff = localStorage.getItem('chess_difficulty');
    if (savedDiff !== null) {
        $('#difficulty').val(savedDiff);
        currentSkillLevel = parseInt(savedDiff);
    }

    $('#btn-start').on('click', function() {
        const name = $('#username').val();
        if (!name) { alert('이름을 입력해주세요!'); return; }
        
        currentSkillLevel = parseInt($('#difficulty').val());
        
        // localStorage에 저장
        localStorage.setItem('chess_username', name);
        localStorage.setItem('chess_difficulty', currentSkillLevel);

        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();

        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name: name }),
            success: function(user) {
                userId = user.id; userName = user.name;
                $('#display-name').text(userName);
                $('#login-container').hide(); $('#game-container').show();
                initBoard();
                
                // 첫 인사 음성 출력 (이름 포함)
                const welcome = `안녕, ${userName}야! 나는 너의 체스 친구야. 우리 재미있게 놀아보자!`;
                $('#ai-message').text(welcome);
                speak(welcome);
                
                startNudgeTimer();
            }
        });
    });

    $('#btn-logout').on('click', () => location.reload());
    $('#btn-history').on('click', () => {
        $.ajax({
            url: '/api/history/' + userId,
            method: 'GET',
            success: function(history) {
                const tbody = $('#history-table tbody').empty();
                history.forEach(h => {
                    const res = h.result === 'WIN' ? '승리 🏆' : h.result === 'LOSS' ? '패배' : '무승부';
                    tbody.append(`<tr><td>${new Date(h.playedAt).toLocaleDateString()}</td><td>${res}</td><td>${h.movesCount}</td></tr>`);
                });
                $('#history-modal').show();
            }
        });
    });
    $('.close').on('click', () => $('#history-modal').hide());
});

function initBoard() {
    board = Chessboard('myBoard', {
        draggable: true, position: 'start',
        onDragStart: onDragStart, onDrop: onDrop, onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });
    updateStatus();
    initStockfish();
    $(window).on('resize', () => board && board.resize());
}
