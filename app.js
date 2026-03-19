// Nhạc nền và Âm thanh
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.3; // Chỉnh âm lượng nhạc nền êm dịu

let isSoundEnabled = true;

function playSound(type) {
    if (!isSoundEnabled || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'start') {
        osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'finish') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'cheer') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.linearRampToValueAtTime(1200, now + 1);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.2); gain.gain.linearRampToValueAtTime(0, now + 1);
        osc.start(now); osc.stop(now + 1);
    } else if (type === 'boost') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(1500, now + 0.3);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'stun') {
        osc.type = 'square'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(150, now + 0.5);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

// Nút Bật/Tắt Âm Thanh + Nhạc Nền
const toggleBtn = document.getElementById('sound-toggle-btn');
const mobileSoundBtn = document.getElementById('mobile-sound-btn');

function toggleSound() {
     isSoundEnabled = !isSoundEnabled;
     const icon = isSoundEnabled ? '🔊' : '🔇';
     if(toggleBtn) toggleBtn.innerHTML = icon;
     if(mobileSoundBtn) {
         const btnIcon = mobileSoundBtn.querySelector('.btn-icon');
         if(btnIcon) btnIcon.innerText = icon;
     }
     if(isSoundEnabled) {
         if (audioCtx.state === 'suspended') audioCtx.resume();
         bgMusic.play().catch(e => console.log("BGM error:", e));
     } else {
         bgMusic.pause();
     }
}

if(toggleBtn) toggleBtn.addEventListener('click', toggleSound);
if(mobileSoundBtn) mobileSoundBtn.addEventListener('click', toggleSound);

// Các phần tử DOM
const screens = {
    selection: document.getElementById('selection-screen'),
    race: document.getElementById('race-screen'),
    result: document.getElementById('result-screen')
};
const characterGrid = document.getElementById('character-grid');
const startBtn = document.getElementById('start-btn');
const trackContainer = document.getElementById('track-container');
const raceTitle = document.getElementById('race-title');
const podium = document.getElementById('podium');
const otherRanks = document.getElementById('other-ranks');
const leaderboardTitle = document.getElementById('leaderboard-title');
const restartBtn = document.getElementById('restart-btn');
const reselectBtn = document.getElementById('reselect-btn');
const actionButtons = document.getElementById('action-buttons');
const predictionSelect = document.getElementById('prediction-select');
const bettingSection = document.getElementById('betting-section');
const predictionResultNode = document.getElementById('prediction-result');

// Trạng thái (State)
let selectedIds = new Set();
let raceInterval;
let racers = [];
let finishOrder = [];
const RACE_DURATION = 10000; // ~10 giây
const FPS = 60;

// Cập nhật danh sách dự đoán
function updatePredictionOptions() {
    predictionSelect.innerHTML = '<option value="">-- Ai sẽ vô địch? --</option>';
    if (selectedIds.size >= 2) {
        bettingSection.style.display = 'block';
        characterData.forEach(char => {
            if(selectedIds.has(char.id)) {
                const opt = document.createElement('option');
                opt.value = char.id;
                opt.innerText = char.name;
                predictionSelect.appendChild(opt);
            }
        });
    } else {
        bettingSection.style.display = 'none';
        predictionSelect.value = '';
    }
}

// Khởi tạo màn hình Chọn Nhân Vật
function initSelection() {
    characterGrid.innerHTML = '';
    characterData.forEach(char => {
        const card = document.createElement('div');
        card.className = 'char-card';
        if(selectedIds.has(char.id)) card.classList.add('selected');
        
        card.innerHTML = `
            <img src="${char.image}" alt="${char.name}">
            <h3>${char.name}</h3>
        `;
        
        card.addEventListener('click', () => {
            playSound('click');
            if (selectedIds.has(char.id)) {
                selectedIds.delete(char.id);
                card.classList.remove('selected');
            } else {
                selectedIds.add(char.id);
                card.classList.add('selected');
            }
            updatePredictionOptions();
            startBtn.disabled = selectedIds.size < 2;
        });
        characterGrid.appendChild(card);
    });
    updatePredictionOptions();
    startBtn.disabled = selectedIds.size < 2;
}

// Chuyển Đổi Màn Hình
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Bắt Đầu Cuộc Đua
startBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Focus lên đầu trang
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isSoundEnabled) bgMusic.play().catch(e => console.log("BGM error:", e));
    playSound('start');
    
    racers = characterData.filter(c => selectedIds.has(c.id)).map((c, i) => ({
        ...c,
        position: 0,
        speedMultiplier: 0.8 + Math.random() * 0.4, 
        finished: false,
        hasEffect: false,
        element: null,
        originalLaneIndex: i,
        laneOffset: 0
    }));
    finishOrder = [];
    predictionResultNode.style.display = 'none';
    
    // Khởi tạo đường đua
    const oldLines = trackContainer.querySelectorAll('.racer-lane');
    oldLines.forEach(l => l.remove());
    
    racers.forEach((racer) => {
        const lane = document.createElement('div');
        lane.className = 'racer-lane';
        
        const racerEl = document.createElement('div');
        racerEl.className = 'racer';
        racerEl.innerHTML = `
            <img src="${racer.image}" alt="${racer.name}">
            <span class="racer-name">${racer.name}</span>
        `;
        
        lane.appendChild(racerEl);
        trackContainer.appendChild(lane);
        racer.element = racerEl;
    });
    
    showScreen('race');
    raceTitle.innerText = 'Chuẩn bị... 3';
    
    // Đếm ngược
    let countdown = 3;
    const cdInterval = setInterval(() => {
        countdown--;
        if(countdown > 0) {
            raceTitle.innerText = `Chuẩn bị... ${countdown}`;
            playSound('click');
        } else {
            clearInterval(cdInterval);
            raceTitle.innerText = 'ĐUA TỐC ĐỘ!';
            playSound('start');
            startRace();
        }
    }, 1000);
});

// Logic Đua Chạy Đi Xuyên Qua Đích
function startRace() {
    racers.forEach(r => r.element.classList.add('running'));
    const trackWidth = trackContainer.clientWidth; 
    const cutoff = window.innerWidth <= 768 ? 85 : 130; // Dời vạch đích sang điểm cân đối mới bên phải
    const finishLineThreshold = trackWidth - cutoff; 

    let availableFinishLanes = Array.from({length: racers.length}, (_, i) => i);

    const totalSteps = (RACE_DURATION / 1000) * FPS;
    
    let currentTick = 0;
    
    raceInterval = setInterval(() => {
        currentTick++;
        let allFinished = true;
        let crossedThisFrame = []; // Mảng theo dõi ai về đích trong frame này
        
        racers.forEach(racer => {
            if (racer.finished) return;
            allFinished = false;
            
            // --- AI THÔNG MINH NHẢY LÀN VÀ NÉ TRÁNH TẠT ĐẦU ---
            if (!racer.ranked && !racer.element.classList.contains('stunned') && !racer.element.classList.contains('bombed')) {
                let currentVisLane = racer.originalLaneIndex + racer.laneOffset;
                
                // Logic né vật cản / xe khác
                const MIN_GAP = 65; 
                const isLaneFree = (targetLane, myPos) => {
                    return !racers.some(other => {
                        if (other.id === racer.id) return false;
                        let otherVisLane = other.originalLaneIndex + other.laneOffset;
                        return (otherVisLane === targetLane && Math.abs(other.position - myPos) < 50); // Khoảng cách giãn khi lách
                    });
                };

                let possibleDirs = [];
                if (currentVisLane > 0 && isLaneFree(currentVisLane - 1, racer.position)) possibleDirs.push(-1);
                if (currentVisLane < racers.length - 1 && isLaneFree(currentVisLane + 1, racer.position)) possibleDirs.push(1);
                
                const DANGER_ZONE = 75;
                let isBlocked = racers.some(other => {
                    if (other.id === racer.id || other.ranked) return false;
                    let otherVisLane = other.originalLaneIndex + other.laneOffset;
                    return (otherVisLane === currentVisLane && other.position > racer.position && (other.position - racer.position) < DANGER_ZONE);
                });

                let shouldJump = false;
                let dir = 0;
                
                if (isBlocked && possibleDirs.length > 0) {
                    shouldJump = Math.random() < 0.9;
                    dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                } else if (Math.random() < 0.003 && possibleDirs.length > 0) {
                    shouldJump = true;
                    dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                }

                if (shouldJump && dir !== 0) {
                    racer.laneOffset += dir;
                    const laneHeight = racer.element.parentElement.clientHeight || 70;
                    racer.element.style.marginTop = (racer.laneOffset * laneHeight) + 'px';
                    racers.forEach(r => r.element.style.zIndex = "2");
                    racer.element.style.zIndex = "10";
                }
            }
            
            // Random Events: Chướng ngại vật đa dạng & Boost
            if (!racer.ranked && !racer.hasEffect && Math.random() < 0.004) {
                racer.hasEffect = true;
                const roll = Math.random();
                let effectType, emojiIcon, duration;

                if (roll < 0.25) {
                    // 🚀 25% Boost Tên Lửa
                    effectType = 'boosting'; emojiIcon = '🚀';
                    racer.speedMultiplier = 3.5 + Math.random() * 1.5;
                    duration = 600; playSound('boost');
                } else if (roll < 0.45) {
                    // 🍌 20% Vỏ Chuối (Stun xoay)
                    effectType = 'stunned'; emojiIcon = '🍌';
                    racer.speedMultiplier = 0;
                    duration = 1200; playSound('stun');
                } else if (roll < 0.65) {
                    // 💣 20% Mìn (Đen thui giật tung)
                    effectType = 'bombed'; emojiIcon = '💣💥';
                    racer.speedMultiplier = 0;
                    duration = 1500; playSound('stun');
                } else if (roll < 0.85) {
                    // 🐌 20% Ốc sên (Chậm rì)
                    effectType = 'slowed'; emojiIcon = '🐌';
                    racer.speedMultiplier = 0.3;
                    duration = 2000;
                } else {
                    // ⚡ 15% Tia Sét (Max xấp xỉ blink)
                    effectType = 'lightning'; emojiIcon = '⚡';
                    racer.speedMultiplier = 5;
                    duration = 400; playSound('boost');
                }
                
                racer.element.classList.add(effectType);
                
                const emoji = document.createElement('div');
                emoji.className = 'effect-emoji';
                emoji.innerHTML = emojiIcon;
                racer.element.appendChild(emoji);
                
                setTimeout(() => {
                    racer.element.classList.remove(effectType);
                    racer.speedMultiplier = 0.8 + Math.random() * 0.4;
                    if (emoji.parentNode) emoji.remove();
                    racer.hasEffect = false;
                }, duration);
            }
            
            // Cập nhật tốc độ nền nếu không dính hiệu ứng (Trung bình luôn là 1.0 để kéo dài cuộc đua sát 10s)
            if (!racer.ranked) {
                if (!racer.hasEffect && Math.random() < 0.05) {
                    racer.speedMultiplier = 0.7 + Math.random() * 0.6;
                }
            } else {
                racer.speedMultiplier = 1.0; // Xe trôi nhẹ đỗ bãi
            }
            
            // Ép tốc độ trung bình và chuẩn hóa để cuộc đua thực sự diễn ra trong ~10 giây
            const moveAmount = (finishLineThreshold / ((RACE_DURATION / 1000) * FPS)) * racer.speedMultiplier * (0.8 + Math.random() * 0.4);
            let nextPos = racer.position + moveAmount;
            
            // --- CƠ CHẾ VẬT LÝ RẮN: KHÔNG THỂ XUYÊN QUA NHAU TRONG CÙNG 1 LÀN ---
            if (!racer.ranked) {
                const MIN_GAP = 65; 
                let currentVisLane = racer.originalLaneIndex + racer.laneOffset;
                let blocker = racers.find(other => {
                    if (other.id === racer.id || other.ranked) return false;
                    let otherVisLane = other.originalLaneIndex + other.laneOffset;
                    if (otherVisLane !== currentVisLane) return false;
                    
                    // Thêm phần bù trừ ID để 2 xe ở cùng 1 vị trí exac không khoá nhau vĩnh viễn
                    let myVirt = racer.position + racer.id * 0.01;
                    let otherVirt = other.position + other.id * 0.01;
                    return (otherVirt >= myVirt && (otherVirt - nextPos) < MIN_GAP);
                });

                if (blocker) {
                    let allowedPos = blocker.position - MIN_GAP;
                    if (allowedPos < racer.position) allowedPos = racer.position; 
                    nextPos = allowedPos;
                }
            }
            
            racer.position = nextPos;
            
            if (racer.position >= finishLineThreshold && !racer.ranked) {
                // Vừa chạm vạch là lên bảng phong thần ngay lập tức
                racer.ranked = true;
                crossedThisFrame.push(racer); 
            }
            
            // Xe tiếp tục lăn bánh thêm 1 đoạn ngắn đến bãi đỗ
            if (racer.ranked && racer.parkTarget && racer.position >= racer.parkTarget) {
                racer.position = racer.parkTarget;
                racer.finished = true; // Hoàn toàn đỗ dứt điểm
                racer.element.classList.remove('running', 'boosting', 'stunned', 'bombed', 'slowed', 'lightning');
                racer.element.classList.add('finish');
                const em = racer.element.querySelector('.effect-emoji');
                if(em) em.remove();
            }
            
            racer.element.style.left = `${racer.position}px`;
        });
        
        // Bến đỗ độc quyền: Mỗi làn 1 xe
        if (crossedThisFrame.length > 0) {
            crossedThisFrame.sort((a, b) => b.position - a.position);
            crossedThisFrame.forEach(racer => {
                let currentVisLane = racer.originalLaneIndex + racer.laneOffset;
                let assignedLane = currentVisLane;
                
                if (!availableFinishLanes.includes(currentVisLane) && availableFinishLanes.length > 0) {
                    // Nếu làn đã bị chiếm, tìm làn trống gần nhất
                    assignedLane = availableFinishLanes.reduce((prev, curr) => 
                        Math.abs(curr - currentVisLane) < Math.abs(prev - currentVisLane) ? curr : prev
                    );
                }
                
                // Thu hồi làn để không xe nào khác đỗ vào
                availableFinishLanes = availableFinishLanes.filter(l => l !== assignedLane);
                
                if (assignedLane !== currentVisLane) {
                    racer.laneOffset = assignedLane - racer.originalLaneIndex;
                    const laneHeight = racer.element.parentElement.clientHeight || 70;
                    racer.element.style.marginTop = (racer.laneOffset * laneHeight) + 'px';
                }
                
                racer.finalLane = assignedLane;
                const parkOffset = window.innerWidth <= 768 ? 35 : 45;
                racer.parkTarget = finishLineThreshold + parkOffset;

                if (!finishOrder.includes(racer)) {
                    finishOrder.push(racer);
                    playSound('finish');
                }
            });
        }
        
        // Buộc kết thúc hoặc All Finished
        if (allFinished || currentTick > totalSteps * 1.5) {
            let remaining = racers.filter(r => !r.ranked);
            remaining.sort((a, b) => b.position - a.position); 
            remaining.forEach(r => {
                r.position = finishLineThreshold;
                r.ranked = true;
                r.finished = true;
                
                let currentVisLane = r.originalLaneIndex + r.laneOffset;
                let assignedLane = currentVisLane;
                
                if (!availableFinishLanes.includes(currentVisLane) && availableFinishLanes.length > 0) {
                    assignedLane = availableFinishLanes.reduce((prev, curr) => 
                        Math.abs(curr - currentVisLane) < Math.abs(prev - currentVisLane) ? curr : prev
                    );
                }
                
                availableFinishLanes = availableFinishLanes.filter(l => l !== assignedLane);
                
                if (assignedLane !== currentVisLane) {
                    r.laneOffset = assignedLane - r.originalLaneIndex;
                    const laneHeight = r.element.parentElement.clientHeight || 70;
                    r.element.style.marginTop = (r.laneOffset * laneHeight) + 'px';
                }
                
                r.finalLane = assignedLane;
                const parkOffset = window.innerWidth <= 768 ? 35 : 45;
                r.parkTarget = finishLineThreshold + parkOffset;
                
                r.element.style.left = `${r.parkTarget}px`; 
                r.element.classList.remove('running', 'boosting', 'stunned', 'bombed', 'slowed', 'lightning');
                r.element.classList.add('finish');
                finishOrder.push(r);
            });
            
            // Ép những ai đã ranked nhưng chưa kịp tới điểm đỗ phải snap tới bãi ngay lập tức
            racers.filter(r => r.ranked && !r.finished).forEach(r => {
                r.position = r.parkTarget || finishLineThreshold;
                r.element.style.left = `${r.position}px`;
                r.finished = true;
                r.element.classList.remove('running', 'boosting', 'stunned', 'bombed', 'slowed', 'lightning');
                r.element.classList.add('finish');
            });
            
            clearInterval(raceInterval);
            setTimeout(() => {
                playSound('cheer');
                showResults();
            }, 1000);
        }
    }, 1000 / FPS);
}

// Hiển Thị Kết Quả Đầy Đủ
function showResults() {
    showScreen('result');
    podium.innerHTML = '';
    otherRanks.innerHTML = '';
    
    // Bắn Pháo Hoa Mừng Chiến Thắng (Confetti)
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#f06292', '#ba68c8', '#4db6ac', '#ffd700'] });
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } }), 500);
    }
    
    const top3 = finishOrder.slice(0, 3);
    const others = finishOrder.slice(3);
    
    // ----------------
    // CHẤM ĐIỂM TIÊN TRI
    // ----------------
    const predictedId = predictionSelect.value;
    if (predictedId) {
        predictionResultNode.style.display = 'block';
        if (finishOrder[0].id.toString() === predictedId.toString()) {
            predictionResultNode.innerHTML = '🎯 Chúc mừng! Bạn dự đoán chính xác nhà vô địch!';
            predictionResultNode.className = 'prediction-result predict-success';
            setTimeout(() => playSound('cheer'), 800);
        } else {
            predictionResultNode.innerHTML = '😢 Bạn đoán sai rồi lêu lêu.';
            predictionResultNode.className = 'prediction-result predict-fail';
        }
    } else {
        predictionResultNode.style.display = 'none';
    }

    let podiumHTML = '';
    
    // Hạng 2
    if (top3[1]) {
        podiumHTML += `
        <div class="podium-item rank-2">
            <img src="${top3[1].image}" alt="${top3[1].name}">
            <div class="name">${top3[1].name}</div>
            <div class="podium-box">2</div>
        </div>`;
    }
    
    // Hạng 1
    if (top3[0]) {
        podiumHTML += `
        <div class="podium-item rank-1">
            <img src="${top3[0].image}" alt="${top3[0].name}">
            <div class="name">${top3[0].name}</div>
            <div class="podium-box">1</div>
        </div>`;
    }
    
    // Hạng 3
    if (top3[2]) {
        podiumHTML += `
        <div class="podium-item rank-3">
            <img src="${top3[2].image}" alt="${top3[2].name}">
            <div class="name">${top3[2].name}</div>
            <div class="podium-box">3</div>
        </div>`;
    }
    
    podium.innerHTML = podiumHTML;
    
    // Hạng Khác (Leaderboard List)
    if (others.length > 0) {
        if(leaderboardTitle) leaderboardTitle.style.display = 'block';
        others.forEach((char, index) => {
            otherRanks.innerHTML += `
                <div class="other-rank-item">
                    <div class="rank-info">
                        <span class="rank-number">#${index + 4}</span>
                        <img src="${char.image}" alt="${char.name}">
                        <span class="char-name">${char.name}</span>
                    </div>
                </div>
            `;
        });
    } else {
        if(leaderboardTitle) leaderboardTitle.style.display = 'none';
    }
}

// Nút Điều Hướng Trở Lại
restartBtn.addEventListener('click', () => {
    playSound('click');
    showScreen('race');
    startBtn.click();
});

reselectBtn.addEventListener('click', () => {
    playSound('click');
    initSelection();
    showScreen('selection');
});

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAEqZMUIrnneG0Na-X9KJkiyDjH2nBuHJA",
  authDomain: "stt126.firebaseapp.com",
  projectId: "stt126",
  storageBucket: "stt126.firebasestorage.app",
  messagingSenderId: "153281554076",
  appId: "1:153281554076:web:6199aac24bae6bdc096f59",
  measurementId: "G-5JPHZ09L4N"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

let characterData = [];
const DEFAULT_CHARACTERS = [
    { id: 1, name: 'Phát', image: 'https://ui-avatars.com/api/?name=Phat&background=ffb3ba&color=fff&size=100' },
    { id: 2, name: 'Dương', image: 'https://ui-avatars.com/api/?name=Duong&background=ffdfba&color=fff&size=100' },
    { id: 3, name: 'Diễm', image: 'https://ui-avatars.com/api/?name=Diem&background=ffffba&color=fff&size=100' },
    { id: 4, name: 'Nguyên', image: 'https://ui-avatars.com/api/?name=Nguyen&background=baffc9&color=fff&size=100' },
    { id: 5, name: 'Vi', image: 'https://ui-avatars.com/api/?name=Vi&background=bae1ff&color=fff&size=100' },
    { id: 6, name: 'Nhung', image: 'https://ui-avatars.com/api/?name=Nhung&background=e2cbf2&color=fff&size=100' },
    { id: 7, name: 'Nhân', image: 'https://ui-avatars.com/api/?name=Nhan&background=f2c8cb&color=fff&size=100' },
];

async function loadCharacters() {
    try {
        const snapshot = await db.collection("characters").get();
        if (snapshot.empty) {
            console.log("Seeding Database...");
            for (let char of DEFAULT_CHARACTERS) {
                await db.collection("characters").doc(char.id.toString()).set(char);
            }
            characterData = [...DEFAULT_CHARACTERS];
        } else {
            characterData = [];
            snapshot.forEach(doc => {
                let data = doc.data();
                characterData.push(data);
            });
            characterData.sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Sắp xếp theo ID
        }
    } catch(err) {
        console.error("Firebase load error. Dùng mảng mặc định.", err);
        characterData = [...DEFAULT_CHARACTERS];
    }
    
    // Auto remove selectedIds that no longer exist
    let currentIdsStr = characterData.map(c => c.id.toString());
    selectedIds.forEach(val => {
        if (!currentIdsStr.includes(val.toString())) {
            selectedIds.delete(val);
        }
    });

    initSelection();
}

// --- Logic Màn Hình Quản Lý ---
const manageBtn = document.getElementById('manage-btn');
const manageAuthPopup = document.getElementById('manage-auth-popup');
const managePassword = document.getElementById('manage-password');
const manageAuthSubmit = document.getElementById('manage-auth-submit-btn');
const manageAuthCancel = document.getElementById('manage-auth-cancel-btn');
const manageAuthError = document.getElementById('manage-auth-error');

const managerModal = document.getElementById('manager-modal');
const closeManagerBtn = document.getElementById('close-manager-btn');
const managerCharList = document.getElementById('manager-char-list');
const addCharBtn = document.getElementById('add-char-btn');
const newCharName = document.getElementById('new-char-name');
const newCharImage = document.getElementById('new-char-image');

// --- Custom Dialog UI Helpers ---
window.customAlert = function(message) {
    return new Promise((resolve) => {
        document.getElementById('dialog-title').innerText = "Thông báo";
        document.getElementById('dialog-message').innerText = message;
        document.getElementById('dialog-cancel-btn').style.display = 'none';
        
        const overlay = document.getElementById('custom-dialog-overlay');
        overlay.style.display = 'flex';
        
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        confirmBtn.onclick = () => {
            overlay.style.display = 'none';
            resolve(true);
        };
    });
};

window.customConfirm = function(message) {
    return new Promise((resolve) => {
        document.getElementById('dialog-title').innerText = "Xác nhận";
        document.getElementById('dialog-message').innerText = message;
        document.getElementById('dialog-cancel-btn').style.display = 'inline-block';
        
        const overlay = document.getElementById('custom-dialog-overlay');
        overlay.style.display = 'flex';
        
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        
        confirmBtn.onclick = () => {
            overlay.style.display = 'none';
            resolve(true);
        };
        cancelBtn.onclick = () => {
            overlay.style.display = 'none';
            resolve(false);
        };
    });
};

// Hamburger Menu Logic
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileManageBtn = document.getElementById('mobile-manage-btn');

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.add('open');
    });
}
if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
}

function openManageAuth() {
    if(mobileMenu) mobileMenu.classList.remove('open');
    manageAuthPopup.style.display = 'flex';
    managePassword.value = '';
    manageAuthError.style.display = 'none';
}

if (manageBtn) manageBtn.addEventListener('click', openManageAuth);
if (mobileManageBtn) mobileManageBtn.addEventListener('click', openManageAuth);

function checkManageAuth() {
    if (managePassword.value === '1710') {
        manageAuthPopup.style.display = 'none';
        sessionStorage.setItem('admin', '1710');
        window.location.href = 'manager.html';
    } else {
        manageAuthError.style.display = 'block';
    }
}

if (manageAuthSubmit) {
    manageAuthSubmit.addEventListener('click', checkManageAuth);
    manageAuthCancel.addEventListener('click', () => {
        manageAuthPopup.style.display = 'none';
    });
    managePassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkManageAuth();
    });
}

// Kích hoạt giao diện
loadCharacters();

// --- Logic Popup Đăng Nhập ---
const loginPopup = document.getElementById('login-popup');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');

function checkLogin() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const jsMonth = today.getMonth(); // Dự phòng trường hợp nhầm tháng do Date đếm từ 0
    
    // Chấp nhận cả ngày + tháng và ngày + (tháng-1) theo logic ví dụ
    const pass1 = (day + month).toString();
    const pass2 = (day + jsMonth).toString();
    
    if (loginPassword.value === pass1 || loginPassword.value === pass2) {
        loginPopup.style.display = 'none';
        document.body.style.overflow = 'auto'; // Cho phép cuộn lại
        sessionStorage.setItem('race_logged_in', 'true');
    } else {
        loginError.style.display = 'block';
    }
}

if (sessionStorage.getItem('race_logged_in') === 'true') {
    if(loginPopup) loginPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
} else if (loginSubmitBtn && loginPassword) {
    document.body.style.overflow = 'hidden'; // Khóa cuộn ban đầu
    loginSubmitBtn.addEventListener('click', checkLogin);
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkLogin();
    });
}
