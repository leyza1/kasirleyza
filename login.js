// Login System
class LoginSystem {
    constructor() {
        this.api = new KasirAPI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Enter key untuk login
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
    }

    async login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');

        // Validasi
        if (!username || !password) {
            this.showError('Username dan password harus diisi');
            return;
        }

        // Tampilkan loading
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        loginBtn.disabled = true;
        this.hideError();

        try {
            const result = await this.api.login(username, password);
            
            if (result.success) {
                // Simpan user data ke localStorage
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect ke halaman utama
                window.location.href = 'index.html';
            } else {
                this.showError(result.message || 'Login gagal');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Terjadi kesalahan saat login');
        } finally {
            // Reset button
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'none';
    }
}

// Check jika sudah login
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!isLoggedIn || !currentUser) {
        // Redirect ke login page jika tidak ada di halaman login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }
    
    return JSON.parse(currentUser);
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    }
}

// Initialize login system ketika di halaman login
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        new LoginSystem();
        
        // Auto focus ke username field
        document.getElementById('username').focus();
    });
}