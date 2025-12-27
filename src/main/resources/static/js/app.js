let board = null;
let game = new Chess();
let userId = null;
let userName = null;
let movesCount = 0;
let nudgeTimer = null;
let gameMode = 'single'; // 'single' 또는 'multi'

// 멀티플레이어 관련 변수 (multiplayer.js에서 사용)
let roomId = null;
let stompClient = null;
let myColor = 'w'; // 'w' (백색) 또는 'b' (흑색)
let isHost = false;
let opponentName = 'AI'; // 현재 게임의 상대방 이름
let lastSentFen = null; // 마지막으로 보낸 FEN 추적 (자신이 보낸 메시지 무시용)

// 싱글플레이어 관련 변수 (single-player.js에서 사용)
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

function onDragStart(source, piece) {
    if (game.game_over()) return false;
    
    // 멀티플레이어 모드일 때 차례 및 색상 확인
    if (gameMode === 'multi') {
        const currentTurn = game.turn();
        if (currentTurn !== myColor) return false;
        
        const pieceColor = piece.charAt(0); // 'w' 또는 'b'
        if (pieceColor !== myColor) return false;
    } else {
        // 싱글 모드: AI는 검은색이므로 흑색 말은 드래그 불가
        if (piece.search(/^b/) !== -1) return false;
    }
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    
    if (gameMode === 'single') stopNudgeTimer();
    updateStatus();
    movesCount++;

    if (gameMode === 'multi') {
        sendMoveToServer(source, target, 'q');
        // 멀티플레이어 모드에서는 서버로부터 상태 업데이트를 받아 처리하므로
        // 여기서 별도로 checkGameOver를 호출하지 않습니다.
    } else {
        const isUserMajorCapture = move.captured && move.captured !== 'p';
        if ((isUserMajorCapture || game.in_check()) && !game.game_over()) {
            getAIComment();
        }

        if (!checkGameOver()) window.setTimeout(makeAIMove, 500);
    }
}

function onSnapEnd() { board.position(game.fen()); }

function updateStatus() {
    if (!game) return;

    let moveColor = game.turn() === 'b' ? '흑색' : '백색';
    const isMate = game.in_checkmate();
    const isCheck = game.in_check();
    const isDraw = game.in_draw();
    
    let status = isMate ? `게임 종료! ${moveColor} 패배.` : 
                 isDraw ? "게임 종료! 무승부." : `${moveColor} 차례.`;
    if (isCheck && !isMate) status += " (체크!)";
    $('#game-status').text(status);
    
    if (isMate) {
        $('#ai-message').text('체크메이트! 게임이 끝났어!');
    } else if (isCheck) {
        const checkMsg = '조심해! 체크야! ⚠️';
        $('#ai-message').text(checkMsg);
        speak(checkMsg);
    } else if (isDraw) {
        const drawMsg = '무승부네! 좋은 승부였어.';
        $('#ai-message').text(drawMsg);
        speak(drawMsg);
    } else {
        if (gameMode === 'multi') {
            if (game.turn() === myColor) {
                $('#ai-message').text('당신의 차례입니다. 멋진 수를 보여주세요! 😊');
                // 내 차례일 때는 재촉하기 버튼과 말하기 버튼 숨김
                $('#btn-nudge').hide();
                $('#btn-voice-message').hide();
            } else {
                $('#ai-message').text('상대방이 생각 중입니다... ⏳');
                // 상대방 차례일 때는 재촉하기 버튼과 말하기 버튼 표시
                $('#btn-nudge').show();
                // Web Speech API 지원 여부 및 음성 사용 허용 체크박스 확인 후 말하기 버튼 표시
                const VOICE_PERMISSION_KEY = 'voicePermissionAllowed';
                const voicePermissionAllowed = localStorage.getItem(VOICE_PERMISSION_KEY) === 'true';
                if (typeof isSpeechRecognitionSupported === 'function' && isSpeechRecognitionSupported() && voicePermissionAllowed) {
                    $('#btn-voice-message').show();
                } else {
                    $('#btn-voice-message').hide();
                }
            }
        } else {
            if (game.turn() === 'w') {
                $('#ai-message').text('어디로 두면 좋을까? 천천히 생각해보렴!');
            }
            // 싱글 모드에서는 재촉하기 버튼과 말하기 버튼 숨김
            $('#btn-nudge').hide();
            $('#btn-voice-message').hide();
        }
    }
    
    // 게임이 종료되었을 때는 재촉하기 버튼과 말하기 버튼 숨김
    if (game.game_over()) {
        $('#btn-nudge').hide();
        $('#btn-voice-message').hide();
    }
    
    updateCapturedPieces();
}

function updateCapturedPieces() {
    if (!game || !board) return;
    
    const initialPieces = {
        'wP': 8, 'wN': 2, 'wB': 2, 'wR': 2, 'wQ': 1, 'wK': 1,
        'bP': 8, 'bN': 2, 'bB': 2, 'bR': 2, 'bQ': 1, 'bK': 1
    };
    
    const currentPieces = {};
    const boardState = game.board();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece) {
                const key = piece.color + piece.type.toUpperCase();
                currentPieces[key] = (currentPieces[key] || 0) + 1;
            }
        }
    }
    
    const capW = [], capB = [];
    
    Object.keys(initialPieces).forEach(pieceKey => {
        const initialCount = initialPieces[pieceKey];
        const currentCount = currentPieces[pieceKey] || 0;
        const capturedCount = initialCount - currentCount;
        
        if (capturedCount > 0) {
            const piece = pieceKey.charAt(0) + pieceKey.charAt(1).toUpperCase();
            for (let i = 0; i < capturedCount; i++) {
                if (pieceKey.startsWith('w')) {
                    capW.push(piece);
                } else {
                    capB.push(piece);
                }
            }
        }
    });
    
    const sortFn = (a, b) => {
        const order = {'P':1,'N':2,'B':3,'R':4,'Q':5,'K':6};
        return (order[a[1]] || 0) - (order[b[1]] || 0);
    };
    capW.sort(sortFn);
    capB.sort(sortFn);
    
    const theme = 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png';
    const img = p => `<img src="${theme.replace('{piece}', p)}" class="captured-piece" />`;
    
    $('#captured-black').html(capW.map(img).join(''));
    $('#captured-white').html(capB.map(img).join(''));
}

function checkGameOver() {
    if (game.game_over()) {
        const isCheckmate = game.in_checkmate();
        
        let message = '';
        let result = 'DRAW';
        
        if (game.in_draw()) {
            message = '게임 종료! 무승부입니다.';
        } else {
            const resultMsg = isCheckmate ? '체크메이트! ' : '게임 종료! ';
            const winnerColor = game.turn() === 'w' ? 'b' : 'w';
            
            if (gameMode === 'multi') {
                if (winnerColor === myColor) {
                    message = resultMsg + '승리했습니다! 🎉';
                    result = 'WIN';
                } else {
                    message = resultMsg + '패배했습니다.';
                    result = 'LOSS';
                }
            } else {
                if (winnerColor === 'w') {
                    message = resultMsg + '승리했습니다! 🎉';
                    result = 'WIN';
                } else {
                    message = resultMsg + '패배했습니다.';
                    result = 'LOSS';
                }
            }
        }
        $('#ai-message').text(message);
        speak(message);

        let currentOpponentName = 'AI';
        if (gameMode === 'multi' && opponentName && opponentName !== 'AI' && opponentName !== '상대방') {
            currentOpponentName = opponentName;
        }
        $.ajax({
            url: '/api/history/' + userId,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ result: result, movesCount: movesCount, opponentName: currentOpponentName, gameType: 'CHESS' }),
            success: function() { 
                alert('게임 종료! 결과가 저장되었습니다.');
                // 승리자 또는 무승부인 경우 새 게임 버튼 표시 (싱글 모드 포함)
                if (result === 'WIN' || result === 'DRAW') {
                    $('#btn-new-game').show();
                }
            }
        });
        return true;
    }
    return false;
}

$(document).ready(function() {
    // 대기방 목록 HTML 로드
    $('#waiting-rooms-placeholder').load('/waiting-rooms.html', function() {
        // 음성 사용 허용 체크박스 상태 로드 및 저장
        const VOICE_PERMISSION_KEY = 'voicePermissionAllowed';
        const voicePermissionCheckbox = $('#voice-permission-checkbox');
        
        // localStorage에서 체크박스 상태 로드
        const savedVoicePermission = localStorage.getItem(VOICE_PERMISSION_KEY);
        if (savedVoicePermission === 'true') {
            voicePermissionCheckbox.prop('checked', true);
        }
        
        // 체크박스 변경 시 localStorage에 저장
        voicePermissionCheckbox.on('change', function() {
            const isChecked = $(this).is(':checked');
            localStorage.setItem(VOICE_PERMISSION_KEY, isChecked ? 'true' : 'false');
            
            // 체크된 경우 마이크 권한 요청 (이미 게임 중이면 Speech Recognition 초기화)
            if (isChecked && gameMode === 'multi' && typeof initSpeechRecognition === 'function') {
                initSpeechRecognition();
            } else if (!isChecked) {
                // 체크 해제된 경우 말하기 버튼 숨김
                $('#btn-voice-message').hide();
            }
        });
    });

    $('#btn-new-game').hide();
    
    const savedName = localStorage.getItem('chess_username');
    if (savedName) $('#username').val(savedName);

    const savedDiff = localStorage.getItem('chess_difficulty');
    if (savedDiff !== null) {
        $('#difficulty').val(savedDiff);
        currentSkillLevel = parseInt(savedDiff);
    }

    $('.mode-btn').on('click', function() {
        $('.mode-btn').css('background', '#fff');
        $(this).css('background', '#ffeb99');
        
        if ($(this).attr('id') === 'btn-single-mode') {
            gameMode = 'single';
            $('#single-mode-options').show();
            $('#btn-start').show();
            $('#btn-create-room').hide();
        } else {
            gameMode = 'multi';
            $('#single-mode-options').hide();
            $('#btn-start').hide();
            $('#btn-create-room').hide();
            
            const name = $('#username').val();
            if (!name) { alert('이름을 입력해주세요!'); return; }
            
            $.ajax({
                url: '/api/login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ name: name }),
                success: function(user) {
                    userId = user.id;
                    userName = user.name;
                    localStorage.setItem('chess_username', name);
                    
                    $('#login-container').hide();
                    $('#waiting-rooms-container').show();
                    loadWaitingRooms();
                    
                    if (window.roomRefreshInterval) clearInterval(window.roomRefreshInterval);
                    window.roomRefreshInterval = setInterval(loadWaitingRooms, 5000);
                }
            });
        }
    });
    
    $('#btn-single-mode').trigger('click');

    $('#btn-start').on('click', function() {
        const name = $('#username').val();
        if (!name) { alert('이름을 입력해주세요!'); return; }
        
        currentSkillLevel = parseInt($('#difficulty').val());
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
                
                const welcome = `안녕, ${userName}야! 나는 너의 체스 친구야. 우리 재미있게 놀아보자!`;
                $('#ai-message').text(welcome);
                speak(welcome);
                
                startNudgeTimer();
            }
        });
    });

    // 대기하기 화면 관련 이벤트 (이벤트 위임 사용)
    $(document).on('click', '#btn-back-to-login', function() {
        if (window.roomRefreshInterval) {
            clearInterval(window.roomRefreshInterval);
            window.roomRefreshInterval = null;
        }
        $('#waiting-rooms-container').hide();
        $('#login-container').show();
    });
    
    $(document).on('click', '#btn-refresh-rooms', function() {
        loadWaitingRooms();
    });
    
    $(document).on('click', '#btn-create-new-room', function() {
        if (!userId) { alert('먼저 이름을 입력하고 같이하기를 선택해주세요.'); return; }
        createRoom();
    });

    $('#btn-logout').on('click', () => {
        if (typeof stompClient !== 'undefined' && stompClient && stompClient.connected) {
            stompClient.disconnect();
        }
        location.reload();
    });

    $('#btn-history').on('click', () => {
        if (!userId) return;
        $.ajax({
            url: '/api/history/' + userId,
            method: 'GET',
            success: function(history) {
                const tbody = $('#history-table tbody').empty();
                history.forEach(h => {
                    const res = h.result === 'WIN' ? '승리 🏆' : h.result === 'LOSS' ? '패배' : '무승부';
                    const opponent = h.opponentName || 'AI';
                    tbody.append(`<tr><td>${new Date(h.playedAt).toLocaleDateString()}</td><td>${res}</td><td>${opponent}</td><td>${h.movesCount}</td></tr>`);
                });
                $('#history-modal').show();
            }
        });
    });
    
    $('#btn-new-game').on('click', () => {
        game = new Chess();
        movesCount = 0;
        if (typeof lastSentFen !== 'undefined') lastSentFen = null;
        $('#btn-new-game').hide();
        
        if (gameMode === 'multi') {
            // 같이하기 모드: 같은 방에서 새 게임 시작
            if (stompClient && stompClient.connected && roomId) {
                const headers = { userId: userId.toString() };
                const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                
                // 상대방이 아직 남아있는지 확인 (이름이 '상대방'이 아니면 재경기로 간주)
                const isRematch = opponentName && opponentName !== '상대방' && opponentName !== 'AI';
                const nextStatus = isRematch ? 'PLAYING' : 'WAITING';
                const nextMessage = isRematch ? '재경기를 시작합니다! 즐거운 게임 되세요.' : '새 게임을 시작합니다! 상대방을 기다려주세요...';

                // 상대방이 나간 경우에만 이름을 '상대방'으로 초기화
                if (!isRematch) {
                    opponentName = '상대방';
                }

                stompClient.send('/app/game/' + roomId + '/state', headers, JSON.stringify({
                    fen: INITIAL_FEN,
                    turn: 'w',
                    status: nextStatus,
                    isGameOver: false,
                    winner: null,
                    message: nextMessage
                }));
            }
            
            initBoard();
            // 메시지는 서버에서 보낸 것을 handleGameStateUpdate에서 처리하므로 여기서 중복 설정 불필요
            speak('새 게임을 시작합니다!');
        } else {
            initBoard();
            $('#ai-message').text('새 게임을 시작합니다!');
            speak('새 게임을 시작합니다!');
            startNudgeTimer();
        }
    });
    
    // 재촉하기 버튼 클릭 이벤트
    $('#btn-nudge').on('click', function() {
        if (gameMode === 'multi' && typeof sendNudgeToServer === 'function') {
            sendNudgeToServer();
        }
    });
    
    // 말하기 버튼 이벤트 핸들러 (mousedown/touchstart: 녹음 시작, mouseup/touchend: 녹음 중지)
    const btnVoiceMessage = $('#btn-voice-message');
    
    btnVoiceMessage.on('mousedown touchstart', function(e) {
        e.preventDefault();
        if (gameMode === 'multi' && recognition && !isRecording) {
            try {
                recognition.start();
            } catch (err) {
                console.error('Failed to start recognition:', err);
            }
        }
    });
    
    btnVoiceMessage.on('mouseup touchend mouseleave', function(e) {
        e.preventDefault();
        if (recognition && isRecording) {
            recognition.stop();
        }
    });
    
    $('.close').on('click', () => $('#history-modal').hide());
});

function initBoard() {
    const position = game.fen() || 'start';
    board = Chessboard('myBoard', {
        draggable: true, position: position,
        onDragStart: onDragStart, onDrop: onDrop, onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });
    updateStatus();
    $('#btn-new-game').hide();
    $('#btn-nudge').hide(); // 초기에는 재촉하기 버튼 숨김
    $('#btn-voice-message').hide(); // 초기에는 말하기 버튼 숨김
    
    if (gameMode === 'single') {
        initStockfish();
    }
    
    $(window).on('resize', () => board && board.resize());
}
