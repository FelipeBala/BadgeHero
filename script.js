// API Base URL
const API_URL = 'http://localhost:3000/api';

// Data Store
let users = [];
let currentUser = null;

// Admin State
let isAdmin = false;

// DOM Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminPanel = document.getElementById('adminPanel');
const adminModal = document.getElementById('adminModal');
const addUserModal = document.getElementById('addUserModal');
const addBadgeModal = document.getElementById('addBadgeModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const addUserForm = document.getElementById('addUserForm');
const addBadgeForm = document.getElementById('addBadgeForm');
const addUserBtn = document.getElementById('addUserBtn');
const addBadgeBtn = document.getElementById('addBadgeBtn');
const userGrid = document.getElementById('userGrid');
const userProfile = document.getElementById('userProfile');
const userSelection = document.querySelector('.user-selection');
const backBtn = document.getElementById('backBtn');

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
                alert('Usuário adicionado com sucesso!');
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
        addBadgeModal.style.display = 'block';
    });

    addBadgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Erro: usuário não selecionado.');
            return;
        }
        
        const user_id = currentUser.id;
        const name = document.getElementById('badgeName').value;
        const description = document.getElementById('badgeDescription').value;
        const icon = document.getElementById('badgeIcon').value;
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
                alert('Badge adicionada com sucesso!');
                
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

    // Back Button
    backBtn.addEventListener('click', () => {
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
        }
    } else {
        adminLoginBtn.style.display = 'block';
        adminLogoutBtn.style.display = 'none';
        adminPanel.style.display = 'none';
        addBadgeBtn.style.display = 'none';
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
        
        // Show add badge button if admin
        if (isAdmin) {
            addBadgeBtn.style.display = 'inline-block';
        } else {
            addBadgeBtn.style.display = 'none';
        }
        
        // Update profile info
        document.getElementById('profileAvatar').src = user.avatar;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('badgeCount').textContent = user.badges.length;
        
        // Render badges
        const badgesGrid = document.getElementById('badgesGrid');
        const noBadges = document.getElementById('noBadges');
        
        if (user.badges.length === 0) {
            badgesGrid.style.display = 'none';
            noBadges.style.display = 'block';
        } else {
            badgesGrid.style.display = 'grid';
            noBadges.style.display = 'none';
            badgesGrid.innerHTML = '';
            
            user.badges.forEach(badge => {
                const badgeCard = document.createElement('div');
                badgeCard.className = 'badge-card';
                
                // Format date
                const date = new Date(badge.date);
                const formattedDate = date.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                });
                
                badgeCard.innerHTML = `
                    <div class="badge-header">
                        <div class="badge-icon">${badge.icon}</div>
                        <div class="badge-info">
                            <h4>${badge.name}</h4>
                            <p class="badge-date">${formattedDate}</p>
                        </div>
                    </div>
                    <p class="badge-description">${badge.description}</p>
                `;
                badgesGrid.appendChild(badgeCard);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('badgeDate').value = today;
});
