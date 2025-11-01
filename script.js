// API Base URL
const API_URL = 'http://localhost:3000/api';

// Data Store
let users = [];
let currentUser = null;

// Admin State
let isAdmin = false;
let deleteMode = false;
let selectedAiImage = null;

// DOM Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminPanel = document.getElementById('adminPanel');
const adminModal = document.getElementById('adminModal');
const addUserModal = document.getElementById('addUserModal');
const addBadgeModal = document.getElementById('addBadgeModal');
const aiGalleryModal = document.getElementById('aiGalleryModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const addUserForm = document.getElementById('addUserForm');
const addBadgeForm = document.getElementById('addBadgeForm');
const addUserBtn = document.getElementById('addUserBtn');
const addBadgeBtn = document.getElementById('addBadgeBtn');
const deleteBadgeBtn = document.getElementById('deleteBadgeBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const openAiGalleryBtn = document.getElementById('openAiGalleryBtn');
const userGrid = document.getElementById('userGrid');
const userProfile = document.getElementById('userProfile');
const userSelection = document.querySelector('.user-selection');
const backBtn = document.getElementById('backBtn');

// AI Generated Images (simulated - using quality badge icons)
const aiImages = [
    'https://cdn-icons-png.flaticon.com/512/7648/7648377.png',
    'https://cdn-icons-png.flaticon.com/512/8074/8074800.png',
    'https://cdn-icons-png.flaticon.com/512/2767/2767146.png',
    'https://cdn-icons-png.flaticon.com/512/9068/9068642.png'
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Admin Login/Logout
    adminLoginBtn.addEventListener('click', () => {
        adminModal.style.display = 'block';
    });

    adminLogoutBtn.addEventListener('click', () => {
        isAdmin = false;
        updateAdminUI();
    });

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/admin/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                isAdmin = true;
                adminModal.style.display = 'none';
                document.getElementById('adminPassword').value = '';
                updateAdminUI();
            } else {
                alert('Senha incorreta!');
            }
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    // Add User
    addUserBtn.addEventListener('click', () => {
        addUserModal.style.display = 'block';
    });

    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('userName').value;
        const avatar = document.getElementById('userAvatar').value || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
        
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                await loadUsers();
                addUserModal.style.display = 'none';
                addUserForm.reset();
            } else {
                alert('Erro ao adicionar usuário: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    // Add Badge (within profile)
    addBadgeBtn.addEventListener('click', () => {
        selectedAiImage = null;
        document.querySelector('input[name="imageSource"][value="url"]').checked = true;
        toggleImageSource();
        addBadgeModal.style.display = 'block';
    });

    // Image source toggle
    document.querySelectorAll('input[name="imageSource"]').forEach(radio => {
        radio.addEventListener('change', toggleImageSource);
    });

    // Open AI Gallery
    openAiGalleryBtn.addEventListener('click', () => {
        loadAiGallery();
        aiGalleryModal.style.display = 'block';
    });

    addBadgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Erro: usuário não selecionado.');
            return;
        }
        
        const imageSource = document.querySelector('input[name="imageSource"]:checked').value;
        let icon;
        
        if (imageSource === 'url') {
            icon = document.getElementById('badgeIcon').value;
            if (!icon) {
                alert('Por favor, insira a URL da imagem.');
                return;
            }
        } else {
            if (!selectedAiImage) {
                alert('Por favor, selecione uma imagem gerada por IA.');
                return;
            }
            icon = selectedAiImage;
        }
        
        const user_id = currentUser.id;
        const name = document.getElementById('badgeName').value;
        const description = document.getElementById('badgeDescription').value;
        const date = document.getElementById('badgeDate').value;
        
        try {
            const response = await fetch(`${API_URL}/badges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, name, description, icon, date })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                await loadUsers();
                addBadgeModal.style.display = 'none';
                addBadgeForm.reset();
                
                // Atualizar perfil
                await showUserProfile(user_id);
            } else {
                alert('Erro ao adicionar badge: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao adicionar badge:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    // Delete Badge Mode
    deleteBadgeBtn.addEventListener('click', () => {
        deleteMode = true;
        toggleDeleteMode();
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteMode = false;
        toggleDeleteMode();
    });

    // Back Button
    backBtn.addEventListener('click', () => {
        deleteMode = false;
        userProfile.style.display = 'none';
        userSelection.style.display = 'block';
        if (isAdmin) {
            adminPanel.style.display = 'block';
        }
    });

    // Close Modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Update Admin UI
function updateAdminUI() {
    if (isAdmin) {
        adminLoginBtn.style.display = 'none';
        adminLogoutBtn.style.display = 'block';
        adminPanel.style.display = 'block';
        
        // Show add badge button in profile if viewing a user
        if (currentUser && userProfile.style.display !== 'none') {
            addBadgeBtn.style.display = 'inline-block';
            deleteBadgeBtn.style.display = 'inline-block';
        }
    } else {
        adminLoginBtn.style.display = 'block';
        adminLogoutBtn.style.display = 'none';
        adminPanel.style.display = 'none';
        addBadgeBtn.style.display = 'none';
        deleteBadgeBtn.style.display = 'none';
        cancelDeleteBtn.style.display = 'none';
    }
}

// Toggle Delete Mode
function toggleDeleteMode() {
    if (deleteMode) {
        deleteBadgeBtn.style.display = 'none';
        addBadgeBtn.style.display = 'none';
        cancelDeleteBtn.style.display = 'inline-block';
    } else {
        deleteBadgeBtn.style.display = 'inline-block';
        addBadgeBtn.style.display = 'inline-block';
        cancelDeleteBtn.style.display = 'none';
    }
    
    // Re-render badges with or without delete buttons
    if (currentUser) {
        renderBadges(currentUser.badges);
    }
}

// Load Users from API
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        
        if (response.ok) {
            users = data;
            renderUsers();
        } else {
            console.error('Erro ao carregar usuários:', data.error);
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        alert('Não foi possível conectar ao servidor. Certifique-se de que o servidor está rodando em http://localhost:3000');
    }
}

// Render Users
function renderUsers() {
    userGrid.innerHTML = '';
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}" class="user-card-avatar">
            <h3>${user.name}</h3>
            <p class="user-card-badges">${user.badge_count} badge${user.badge_count !== 1 ? 's' : ''}</p>
        `;
        userCard.addEventListener('click', () => showUserProfile(user.id));
        userGrid.appendChild(userCard);
    });
}

// Show User Profile
async function showUserProfile(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const user = await response.json();
        
        if (!response.ok) {
            alert('Erro ao carregar perfil do usuário.');
            return;
        }
        
        currentUser = user;
        
        // Hide user selection and admin panel
        userSelection.style.display = 'none';
        adminPanel.style.display = 'none';
        
        // Show profile
        userProfile.style.display = 'block';
        
        // Reset delete mode
        deleteMode = false;
        
        // Show admin buttons if admin
        if (isAdmin) {
            addBadgeBtn.style.display = 'inline-block';
            deleteBadgeBtn.style.display = 'inline-block';
            cancelDeleteBtn.style.display = 'none';
        } else {
            addBadgeBtn.style.display = 'none';
            deleteBadgeBtn.style.display = 'none';
            cancelDeleteBtn.style.display = 'none';
        }
        
        // Update profile info
        document.getElementById('profileAvatar').src = user.avatar;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('badgeCount').textContent = user.badges.length;
        
        // Render badges
        renderBadges(user.badges);
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Render Badges
function renderBadges(badges) {
    const badgesGrid = document.getElementById('badgesGrid');
    const noBadges = document.getElementById('noBadges');
    
    if (badges.length === 0) {
        badgesGrid.style.display = 'none';
        noBadges.style.display = 'block';
    } else {
        badgesGrid.style.display = 'grid';
        noBadges.style.display = 'none';
        badgesGrid.innerHTML = '';
        
        badges.forEach(badge => {
            const badgeCard = document.createElement('div');
            badgeCard.className = 'badge-card';
            
            if (deleteMode) {
                badgeCard.classList.add('delete-mode');
            }
            
            // Format date
            const date = new Date(badge.date);
            const formattedDate = date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            // Check if icon is a URL or emoji
            const isUrl = badge.icon.startsWith('http://') || badge.icon.startsWith('https://');
            const iconHtml = isUrl 
                ? `<img src="${badge.icon}" alt="${badge.name}" onerror="this.parentElement.innerHTML='🏆'">` 
                : badge.icon;
            
            badgeCard.innerHTML = `
                ${deleteMode ? '<div class="badge-delete-btn">✕</div>' : ''}
                <div class="badge-header">
                    <div class="badge-icon${isUrl ? '' : ' emoji'}">${iconHtml}</div>
                    <div class="badge-info">
                        <h4>${badge.name}</h4>
                        <p class="badge-date">${formattedDate}</p>
                    </div>
                </div>
                <p class="badge-description">${badge.description}</p>
            `;
            
            // Add click handler for delete mode
            if (deleteMode) {
                badgeCard.addEventListener('click', () => deleteBadge(badge.id));
            }
            
            badgesGrid.appendChild(badgeCard);
        });
    }
}

// Delete Badge
async function deleteBadge(badgeId) {
    if (!confirm('Tem certeza que deseja deletar esta badge?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/badges/${badgeId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Reload user profile
            await showUserProfile(currentUser.id);
            await loadUsers(); // Update user list
        } else {
            alert('Erro ao deletar badge: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao deletar badge:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Toggle Image Source
function toggleImageSource() {
    const imageSource = document.querySelector('input[name="imageSource"]:checked').value;
    const urlInputGroup = document.getElementById('urlInputGroup');
    const aiInputGroup = document.getElementById('aiInputGroup');
    const badgeIconInput = document.getElementById('badgeIcon');
    
    if (imageSource === 'url') {
        urlInputGroup.style.display = 'block';
        aiInputGroup.style.display = 'none';
        badgeIconInput.required = true;
    } else {
        urlInputGroup.style.display = 'none';
        aiInputGroup.style.display = 'block';
        badgeIconInput.required = false;
    }
}

// Load AI Gallery
function loadAiGallery() {
    const aiImageGrid = document.getElementById('aiImageGrid');
    aiImageGrid.innerHTML = '';
    
    aiImages.forEach((imageUrl, index) => {
        const imageOption = document.createElement('div');
        imageOption.className = 'ai-image-option';
        imageOption.innerHTML = `<img src="${imageUrl}" alt="AI Badge ${index + 1}">`;
        
        imageOption.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.ai-image-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selection to clicked image
            imageOption.classList.add('selected');
            selectedAiImage = imageUrl;
            
            // Update preview
            updateAiImagePreview();
            
            // Close modal after short delay
            setTimeout(() => {
                aiGalleryModal.style.display = 'none';
            }, 500);
        });
        
        aiImageGrid.appendChild(imageOption);
    });
}

// Update AI Image Preview
function updateAiImagePreview() {
    const selectedAiImageDiv = document.getElementById('selectedAiImage');
    
    if (selectedAiImage) {
        selectedAiImageDiv.innerHTML = `<img src="${selectedAiImage}" alt="Selected Badge">`;
    } else {
        selectedAiImageDiv.innerHTML = '<p style="color: #6B7280;">Nenhuma imagem selecionada</p>';
    }
}

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('badgeDate').value = today;
});
