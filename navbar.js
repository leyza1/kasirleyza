// Navbar Management
class NavbarManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    init() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.showSection(this.currentSection);
        this.updateActiveNav();
        this.adjustUIForRole();
    }

    adjustUIForRole() {
        if (this.currentUser.role === 'kasir') {
            // Sembunyikan menu management untuk kasir
            const stokMenu = document.querySelector('[data-section="stok"]');
            const pelangganMenu = document.querySelector('[data-section="pelanggan"]');
            
            if (stokMenu) stokMenu.style.display = 'none';
            if (pelangganMenu) pelangganMenu.style.display = 'none';
            
            // Update user info
            const userInfo = document.querySelector('.navbar-user span');
            if (userInfo) {
                userInfo.textContent = this.currentUser.name;
            }
        }
    }

    setupEventListeners() {
        // Navbar links
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                this.updateActiveNav();
                
                // Close mobile menu if open
                this.closeMobileMenu();
            });
        });

        // Mobile toggle
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar-container')) {
                this.closeMobileMenu();
            }
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Load section-specific content
            this.loadSectionContent(sectionName);
        }
    }

    loadSectionContent(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'stok':
                this.loadStokManagement();
                break;
            case 'pelanggan':
                this.loadPelangganManagement();
                break;
            case 'kasir':
                // Kasir section already has content from app.js
                // Panggil method untuk load kasir content
                this.loadKasirContent();
                break;
        }
    }

    // TAMBAHKAN METHOD UNTUK LOAD KASIR CONTENT
    loadKasirContent() {
        const container = document.querySelector('.kasir-container');
        if (!container) return;

        // Pastikan app.js sudah terload
        if (window.app) {
            // Jika app sudah ada, tampilkan produk dan keranjang
            window.app.tampilkanProduk(window.app.produk);
            window.app.updateKeranjang();
            window.app.tampilkanPelanggan();
        } else {
            // Jika app belum ada, tampilkan loading
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-cash-register" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <p>Loading kasir system...</p>
                </div>
            `;
        }
    }

    updateActiveNav() {
        // Remove active class from all links
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current link
        const currentLink = document.querySelector(`[data-section="${this.currentSection}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }

    toggleMobileMenu() {
        const menu = document.getElementById('navbarMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    closeMobileMenu() {
        const menu = document.getElementById('navbarMenu');
        if (menu) {
            menu.classList.remove('active');
        }
    }

    // Dashboard Content
    async loadDashboard() {
        const container = document.querySelector('.dashboard-stats');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalPenjualanHariIni">0</h3>
                        <p>Penjualan Hari Ini</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalProduk">0</h3>
                        <p>Total Produk</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalPelanggan">0</h3>
                        <p>Total Pelanggan</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="produkHampirHabis">0</h3>
                        <p>Stok Menipis</p>
                    </div>
                </div>
            </div>
            <div class="recent-activity">
                <h3>Aktivitas Terbaru</h3>
                <div id="recentActivityList" class="activity-list">
                    <p>Memuat data...</p>
                </div>
            </div>
        `;

        await this.updateDashboardStats();
    }

    async updateDashboardStats() {
        try {
            // Update stats dengan data real
            if (window.app && window.app.produk) {
                const totalProduk = document.getElementById('totalProduk');
                const produkHampirHabis = document.getElementById('produkHampirHabis');
                
                if (totalProduk) {
                    totalProduk.textContent = window.app.produk.length;
                }
                
                if (produkHampirHabis) {
                    const lowStock = window.app.produk.filter(p => (p.Stok || 0) <= 5 && (p.Stok || 0) > 0);
                    produkHampirHabis.textContent = lowStock.length;
                }
            }

            if (window.app && window.app.pelanggan) {
                const totalPelanggan = document.getElementById('totalPelanggan');
                if (totalPelanggan) {
                    totalPelanggan.textContent = window.app.pelanggan.length;
                }
            }

        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // Stok Management Content
    loadStokManagement() {
        const container = document.querySelector('.stok-management');
        if (!container) return;

        container.innerHTML = `
            <div class="management-header">
                <button class="btn-primary" onclick="app.tampilkanModalProduk()">
                    <i class="fas fa-plus"></i> Tambah Produk
                </button>
                <div class="search-bar">
                    <input type="text" id="searchStok" placeholder="Cari produk...">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="stok-list" id="stokList">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Memuat data stok...
                </div>
            </div>
        `;

        this.loadStokData();
        this.setupStokSearch();
    }

    async loadStokData() {
        const container = document.getElementById('stokList');
        if (!container) return;

        try {
            if (window.app && window.app.produk) {
                this.displayStokList(window.app.produk);
            } else {
                container.innerHTML = '<p>Data produk belum dimuat. Refresh halaman.</p>';
            }
        } catch (error) {
            console.error('Error loading stok data:', error);
            container.innerHTML = '<p>Error memuat data stok.</p>';
        }
    }

    displayStokList(produkList) {
        const container = document.getElementById('stokList');
        if (!container) {
            console.error('❌ stokList container not found');
            return;
        }

        if (!produkList || produkList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Tidak ada data produk</p>
                    <button class="btn-secondary" onclick="app.tampilkanModalProduk()">
                        <i class="fas fa-plus"></i> Tambah Produk Pertama
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-container">
                <table class="stok-table">
                    <thead>
                        <tr>
                            <th>Nama Produk</th>
                            <th>Harga</th>
                            <th>Stok</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        produkList.forEach(produk => {
            const stok = produk.Stok || 0;
            let status = 'Tersedia';
            let statusClass = 'success';
            
            if (stok <= 0) {
                status = 'Habis';
                statusClass = 'danger';
            } else if (stok <= 5) {
                status = 'Menipis';
                statusClass = 'warning';
            }

            // PERBAIKAN: Handle produk.NamaProduk yang mungkin null/undefined
            const namaProduk = produk.NamaProduk || 'No Name';
            const escapedNamaProduk = namaProduk.replace(/'/g, "\\'");

            html += `
                <tr>
                    <td>${namaProduk}</td>
                    <td>${this.formatCurrency(produk.Harga || 0)}</td>
                    <td>${stok}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="app.editProduk(${produk.ProdukID})" title="Edit Produk">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="app.tampilkanModalHapus(${produk.ProdukID}, '${escapedNamaProduk}')" title="Hapus Produk">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </div>
        `;

        container.innerHTML = html;
        console.log('✅ Tampilan stok diperbarui');
    }

    // TAMBAHKAN METHOD FORMAT CURRENCY
    formatCurrency(amount) {
        if (typeof DataUtils !== 'undefined' && DataUtils.formatCurrency) {
            return DataUtils.formatCurrency(amount);
        }
        
        // Fallback jika DataUtils tidak tersedia
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    setupStokSearch() {
        const searchInput = document.getElementById('searchStok');
        if (searchInput && window.app && window.app.produk) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase();
                const filtered = window.app.produk.filter(produk => 
                    (produk.NamaProduk || '').toLowerCase().includes(keyword)
                );
                this.displayStokList(filtered);
            });
        }
    }

    // Pelanggan Management Content
    loadPelangganManagement() {
        const container = document.querySelector('.pelanggan-management');
        if (!container) return;

        container.innerHTML = `
            <div class="management-header">
                <button class="btn-primary" onclick="app.tampilkanModalPelanggan()">
                    <i class="fas fa-plus"></i> Tambah Pelanggan
                </button>
                <div class="search-bar">
                    <input type="text" id="searchPelanggan" placeholder="Cari pelanggan...">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="pelanggan-list" id="pelangganList">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Memuat data pelanggan...
                </div>
            </div>
        `;

        this.loadPelangganData();
        this.setupPelangganSearch();
    }

    async loadPelangganData() {
        const container = document.getElementById('pelangganList');
        if (!container) return;

        try {
            if (window.app && window.app.pelanggan) {
                this.displayPelangganList(window.app.pelanggan);
            } else {
                container.innerHTML = '<p>Data pelanggan belum dimuat.</p>';
            }
        } catch (error) {
            console.error('Error loading pelanggan data:', error);
            container.innerHTML = '<p>Error memuat data pelanggan.</p>';
        }
    }

    displayPelangganList(pelangganList) {
        const container = document.getElementById('pelangganList');
        if (!container) return;

        if (!pelangganList || pelangganList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Belum ada data pelanggan</p>
                    <button class="btn-secondary" onclick="app.tampilkanModalPelanggan()">
                        <i class="fas fa-plus"></i> Tambah Pelanggan Pertama
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-container">
                <table class="pelanggan-table">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Telepon</th>
                            <th>Alamat</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        pelangganList.forEach(pelanggan => {
            html += `
                <tr>
                    <td>${pelanggan.NamaPelanggan || 'No Name'}</td>
                    <td>${pelanggan.NomorTelepon || '-'}</td>
                    <td>${pelanggan.Alamat || '-'}</td>
                    <td>
                        <button class="btn-small btn-warning">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    setupPelangganSearch() {
        const searchInput = document.getElementById('searchPelanggan');
        if (searchInput && window.app && window.app.pelanggan) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase();
                const filtered = window.app.pelanggan.filter(pelanggan => 
                    (pelanggan.NamaPelanggan || '').toLowerCase().includes(keyword) ||
                    (pelanggan.NomorTelepon || '').includes(keyword)
                );
                this.displayPelangganList(filtered);
            });
        }
    }

    // TAMBAHKAN METHOD LOGOUT
    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize navbar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.navbarManager = new NavbarManager();
});