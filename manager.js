// manager.js
if (sessionStorage.getItem('admin') !== '1710') {
    window.location.href = 'index.html';
}

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

// DOM Elements
const managerCharList = document.getElementById('manager-char-list');
const closeHeaderBtn = document.getElementById('close-manager-header-btn');

const addCharModal = document.getElementById('add-char-modal');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const cancelAddCharBtn = document.getElementById('cancel-add-char-btn');
const addCharBtn = document.getElementById('add-char-btn');
const newCharName = document.getElementById('new-char-name');
const newCharImage = document.getElementById('new-char-image');

if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', () => {
        addCharModal.style.display = 'flex';
    });
}
if (cancelAddCharBtn) {
    cancelAddCharBtn.addEventListener('click', () => {
        addCharModal.style.display = 'none';
    });
}

const editCharModal = document.getElementById('edit-char-modal');
const editCharName = document.getElementById('edit-char-name');
const editCharImage = document.getElementById('edit-char-image');
const editCharSaveBtn = document.getElementById('edit-char-save-btn');
const editCharCancelBtn = document.getElementById('edit-char-cancel-btn');
let currentEditId = null;

// Âm thanh
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.3;
let isSoundEnabled = true;
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
        if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') audioCtx.resume();
        bgMusic.play().catch(e => console.log("BGM error:", e));
    } else {
        bgMusic.pause();
    }
}
toggleBtn.addEventListener('click', toggleSound);
mobileSoundBtn.addEventListener('click', toggleSound);

// Mobile Menu
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileManageBtn = document.getElementById('mobile-manage-btn');

if(mobileMenu && hamburgerBtn && closeMenuBtn) {
    hamburgerBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    closeMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('open'));
    
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove('open');
        }
    });

    let touchStartX = 0;
    let touchEndX = 0;
    mobileMenu.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    mobileMenu.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 50) { // Swipe right to close
            mobileMenu.classList.remove('open');
        }
    });
}

// Load data
async function loadCharacters() {
    managerCharList.innerHTML = '<p style="text-align: center; color: #6a1b9a;">Đang tải dữ liệu...</p>';
    try {
        const snapshot = await db.collection("characters").get();
        characterData = [];
        snapshot.forEach(doc => {
            characterData.push(doc.data());
        });

        // Tự động dọn rác avatar ảo khi đã có người dùng nhập avatar thật
        const hasRealChars = characterData.some(c => !c.image.includes('ui-avatars.com'));
        if (hasRealChars) {
            const fakeChars = characterData.filter(c => c.image.includes('ui-avatars.com'));
            fakeChars.forEach(fake => {
                db.collection("characters").doc(fake.id.toString()).delete().catch(e => console.log(e));
            });
            characterData = characterData.filter(c => !c.image.includes('ui-avatars.com'));
        }

        characterData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        renderManagerList();
    } catch(err) {
        console.error(err);
        await customAlert("Lỗi tải dữ liệu từ Firebase!");
        managerCharList.innerHTML = '<p style="text-align: center; color: red;">Lỗi kết nối Firebase</p>';
    }
}

function renderManagerList() {
    managerCharList.innerHTML = '';
    characterData.forEach(char => {
        const item = document.createElement('div');
        item.className = 'manager-item';
        item.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 12px 20px; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.02); width: 100%;";
        item.innerHTML = `
            <div class="manager-item-info" style="display: flex; align-items: center; gap: 15px;">
                <img src="${char.image}" alt="${char.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #fce4ec;">
                <strong style="color: #4a148c; font-size: 1.1rem; word-break: break-word; line-height: 1.2;">${char.name}</strong>
            </div>
            <div class="manager-item-actions" style="display: flex; align-items: center; gap: 8px;">
                <button class="cute-btn" style="padding: 0.5rem 0.8rem; background-color: #29b6f6; border-radius: 8px; border: none; font-weight: bold; color: white; cursor: pointer; margin: 0; min-width: 45px; display: flex; align-items: center; justify-content: center;" onclick="editChar('${char.id}')"><span class="btn-icon" style="display:none; margin:0;">✏️</span><span class="btn-text">Sửa</span></button>
                <button class="cute-btn" style="padding: 0.5rem 0.8rem; background-color: #ef5350; border-radius: 8px; border: none; font-weight: bold; color: white; cursor: pointer; margin: 0; min-width: 45px; display: flex; align-items: center; justify-content: center;" onclick="deleteChar('${char.id}')"><span class="btn-icon" style="display:none; margin:0;">🗑️</span><span class="btn-text">Xóa</span></button>
            </div>
        `;
        managerCharList.appendChild(item);
    });
}

// Global scope
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

window.deleteChar = async function(id) {
    const isConfirmed = await customConfirm("Bạn có chắc muốn xóa nhân vật này?");
    if (isConfirmed) {
        try {
            await db.collection("characters").doc(id.toString()).delete();
            characterData = characterData.filter(c => c.id.toString() !== id.toString());
            renderManagerList();
            await customAlert("Xóa thành công!");
        } catch(e) { console.error(e); await customAlert("Lỗi khi xóa! Xin kiểm tra Rules Firestore."); }
    }
};

window.editChar = function(id) {
    let char = characterData.find(c => c.id.toString() === id.toString());
    if(!char) return;
    currentEditId = id.toString();
    editCharName.value = char.name;
    editCharImage.value = char.image;
    editCharModal.style.display = 'flex';
};

editCharCancelBtn.addEventListener('click', () => {
    editCharModal.style.display = 'none';
});

editCharSaveBtn.addEventListener('click', async () => {
    if(!currentEditId) return;
    const newName = editCharName.value.trim();
    const newImage = editCharImage.value.trim();
    
    if(!newName || !newImage) {
        return await customAlert("Vui lòng nhập đầy đủ Tên và Link ảnh!");
    }
    
    editCharSaveBtn.disabled = true;
    const btnText = editCharSaveBtn.querySelector('.btn-text');
    if(btnText) btnText.innerText = "Đang lưu...";
    
    try {
        await db.collection("characters").doc(currentEditId).update({
            name: newName,
            image: newImage
        });
        
        // Update local state temporarily
        let char = characterData.find(c => c.id.toString() === currentEditId);
        if(char) {
            char.name = newName;
            char.image = newImage;
        }
        
        renderManagerList();
        editCharModal.style.display = 'none';
        await customAlert("Sửa dữ liệu thành công!");
    } catch(e) { 
        console.error(e); 
        await customAlert("Có lỗi cập nhật. Vui lòng kiểm tra Rules Firestore!"); 
    } finally {
        editCharSaveBtn.disabled = false;
        const btnText = editCharSaveBtn.querySelector('.btn-text');
        if(btnText) btnText.innerText = "Lưu";
    }
});

addCharBtn.addEventListener('click', async () => {
    const name = newCharName.value.trim();
    const img = newCharImage.value.trim();
    
    if (!name || !img) {
        return await customAlert("Vui lòng nhập đầy đủ Tên và Link ảnh!");
    }
    
    let existingIds = characterData.map(c => parseInt(c.id)).filter(v => !isNaN(v));
    const nextIdNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newId = nextIdNumber.toString(); 
    
    const newChar = { id: newId, name: name, image: img };
    
    addCharBtn.disabled = true;
    const btnText2 = addCharBtn.querySelector('.btn-text');
    if(btnText2) btnText2.innerText = "Đang tải...";
    try {
        await db.collection("characters").doc(newId).set(newChar);
        characterData.push(newChar);
        newCharName.value = '';
        newCharImage.value = '';
        renderManagerList();
        addCharModal.style.display = 'none';
        await customAlert("Thêm nhân vật thành công!");
    } catch(e) {
        console.error(e);
        await customAlert("Lỗi thêm dữ liệu! Bạn hãy vào Firebase -> Firestore Database -> Rules và thiết lập allow read, write: if true;");
    } finally {
        addCharBtn.disabled = false;
        const btnText2 = addCharBtn.querySelector('.btn-text');
        if(btnText2) btnText2.innerText = "Thêm mới";
    }
});

// Navigation & Buttons Same as Index
const manageBtn = document.getElementById('manage-btn');
if(manageBtn) manageBtn.addEventListener('click', () => { window.location.href = 'manager.html'; });
if(mobileManageBtn) mobileManageBtn.addEventListener('click', () => { window.location.href = 'manager.html'; });

// Khởi chạy
loadCharacters();
