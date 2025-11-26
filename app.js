// Aplikasi Kasir UMKM - Main Application
class AplikasiKasir {
    constructor() {
        this.keranjang = [];
        this.produk = [];
        this.pelanggan = [];
        this.api = new KasirAPI();
        this.notification = new NotificationSystem();
        
        console.log('🚀 Aplikasi Kasir Initialized');
        this.initializeApp();
    }

    initializeApp() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.loadProduk();
        this.loadPelanggan();
        this.setupNavigation(); // PERBAIKAN: Panggil setupNavigation
    }

    // PERBAIKAN: Tambahkan method untuk localStorage produk
    async syncProdukToLocalStorage() {
        try {
            StorageManager.set('produk_data', this.produk);
            console.log('💾 Produk disimpan ke localStorage');
        } catch (error) {
            console.error('❌ Gagal menyimpan ke localStorage:', error);
        }
    }

    async loadProdukFromLocalStorage() {
        try {
            const savedProduk = StorageManager.get('produk_data', []);
            if (savedProduk.length > 0) {
                this.produk = savedProduk;
                console.log('📦 Loaded produk from localStorage:', this.produk.length);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            return false;
        }
    }

    // Di dalam class AplikasiKasir, tambahkan method untuk navigation
    setupNavigation() {
        // Pastikan kasir section aktif saat app load
        const kasirSection = document.getElementById('kasir');
        if (kasirSection) {
            kasirSection.classList.add('active');
        }
        
        // Setup tombol tambah produk di navbar stok
        this.setupStokManagement();
    }

    // Method untuk menampilkan modal edit produk
    editProduk(produkID) {
        const produk = this.produk.find(p => p.ProdukID == produkID);
        if (!produk) {
            this.notification.error('Produk tidak ditemukan');
            return;
        }

        // Isi form edit dengan data produk
        document.getElementById('editProdukID').value = produk.ProdukID;
        document.getElementById('editNamaProduk').value = produk.NamaProduk || '';
        document.getElementById('editHargaProduk').value = produk.Harga || 0;
        document.getElementById('editStokProduk').value = produk.Stok || 0;

        // Tampilkan modal
        const modal = document.getElementById('editProdukModal');
        if (modal) {
            modal.style.display = 'block';
            
            // Focus ke input nama
            const namaInput = document.getElementById('editNamaProduk');
            if (namaInput) {
                namaInput.focus();
            }
        }
    }

    // Method untuk menampilkan modal konfirmasi hapus
    tampilkanModalHapus(produkID, namaProduk) {
        document.getElementById('deleteProdukName').textContent = namaProduk;
        
        const modal = document.getElementById('deleteProdukModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        if (modal && confirmBtn) {
            // Hapus event listener sebelumnya
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Tambah event listener baru
            newConfirmBtn.onclick = () => this.hapusProduk(produkID);
            
            modal.style.display = 'block';
        }
    }

    // Method untuk update produk dengan debugging
    async updateProduk() {
        const produkID = document.getElementById('editProdukID').value;
        const namaInput = document.getElementById('editNamaProduk');
        const hargaInput = document.getElementById('editHargaProduk');
        const stokInput = document.getElementById('editStokProduk');
        
        if (!namaInput || !hargaInput || !produkID) {
            this.notification.error('Form tidak lengkap');
            return;
        }

        const formData = {
            ProdukID: parseInt(produkID),
            NamaProduk: namaInput.value.trim(),
            Harga: parseFloat(hargaInput.value) || 0,
            Stok: parseInt(stokInput.value) || 0
        };

        // Validasi
        if (!formData.NamaProduk) {
            this.notification.warning('Nama produk harus diisi');
            namaInput.focus();
            return;
        }

        if (formData.Harga <= 0) {
            this.notification.warning('Harga harus lebih dari 0');
            hargaInput.focus();
            return;
        }

        const submitBtn = document.querySelector('#editProdukForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Tampilkan loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            console.log('🔄 Mengupdate produk:', formData);
            
            // Coba update melalui API
            const result = await this.api.updateProduk(formData);
            console.log('📨 Response update:', result);

            if (result.success) {
                this.notification.success('Produk berhasil diupdate');
                
                // Tutup modal
                const modal = document.getElementById('editProdukModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh data produk
                await this.loadProduk();
                
            } else {
                // Jika API gagal, coba fallback ke update lokal
                console.warn('⚠️ API update gagal, mencoba update lokal');
                await this.updateProdukLokal(formData);
            }
        } catch (error) {
            console.error('❌ Error updating produk:', error);
            
            // Fallback ke update lokal
            try {
                await this.updateProdukLokal(formData);
            } catch (fallbackError) {
                this.notification.error('Gagal mengupdate produk: ' + error.message);
            }
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Fallback: Update produk di data lokal
    async updateProdukLokal(produkData) {
        const index = this.produk.findIndex(p => p.ProdukID == produkData.ProdukID);
        if (index !== -1) {
            // Update data di array lokal
            this.produk[index] = { ...this.produk[index], ...produkData };
            
            // PERBAIKAN: Sync ke localStorage
            await this.syncProdukToLocalStorage();
            
            // Refresh tampilan
            if (window.navbarManager) {
                window.navbarManager.displayStokList(this.produk);
            }
            
            this.notification.success('Produk berhasil diupdate (data lokal)');
            
            // Tutup modal
            const modal = document.getElementById('editProdukModal');
            if (modal) {
                modal.style.display = 'none';
            }
        } else {
            throw new Error('Produk tidak ditemukan di data lokal');
        }
    }

    // Method untuk hapus produk dengan debugging yang lebih detail
    async hapusProduk(produkID) {
        console.log('🗑️ Memulai proses hapus produk ID:', produkID);
        console.log('📊 Data produk saat ini:', this.produk);
        
        try {
            console.log('🔄 Mencoba hapus melalui API...');
            const result = await this.api.deleteProduk(produkID);
            console.log('📨 Response dari API:', result);

            if (result.success) {
                console.log('✅ Berhasil hapus via API');
                this.notification.success('Produk berhasil dihapus');
                
                // Tutup modal
                const modal = document.getElementById('deleteProdukModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh data produk
                await this.loadProduk();
                
            } else {
                console.warn('⚠️ API delete gagal, mencoba hapus lokal. Error:', result.error);
                // Jika API gagal, coba fallback ke hapus lokal
                await this.hapusProdukLokal(produkID);
            }
        } catch (error) {
            console.error('❌ Error deleting produk:', error);
            
            // Fallback ke hapus lokal
            try {
                console.log('🔄 Mencoba fallback ke hapus lokal...');
                await this.hapusProdukLokal(produkID);
            } catch (fallbackError) {
                console.error('❌ Fallback juga gagal:', fallbackError);
                this.notification.error('Gagal menghapus produk: ' + error.message);
            }
        }
    }

    // Fallback: Hapus produk dari data lokal
    async hapusProdukLokal(produkID) {
        console.log('🔄 Menghapus produk lokal dengan ID:', produkID);
        console.log('📦 Data produk sebelum dihapus:', this.produk);
        
        const index = this.produk.findIndex(p => p.ProdukID == produkID);
        console.log('🔍 Index yang ditemukan:', index);
        
        if (index !== -1) {
            const namaProduk = this.produk[index].NamaProduk;
            
            // Hapus dari array lokal
            this.produk.splice(index, 1);
            
            // PERBAIKAN: Sync ke localStorage
            await this.syncProdukToLocalStorage();
            
            // Refresh tampilan stok management
            if (window.navbarManager && window.navbarManager.displayStokList) {
                console.log('🔄 Memperbarui tampilan stok management');
                window.navbarManager.displayStokList(this.produk);
            }
            
            // Refresh tampilan produk di kasir
            this.tampilkanProduk(this.produk);
            
            this.notification.success(`"${namaProduk}" berhasil dihapus (data lokal)`);
            
            // Tutup modal
            const modal = document.getElementById('deleteProdukModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            console.log('✅ Produk berhasil dihapus. Data setelah dihapus:', this.produk);
        } else {
            console.error('❌ Produk tidak ditemukan di data lokal');
            throw new Error('Produk tidak ditemukan di data lokal');
        }
    }

    setupStokManagement() {
        // Tombol tambah produk di manajemen stok
        const tambahProdukBtn = document.createElement('button');
        tambahProdukBtn.className = 'btn-primary';
        tambahProdukBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Produk';
        tambahProdukBtn.onclick = () => this.tampilkanModalProduk();
        
        // Cari management header di section stok
        const stokHeader = document.querySelector('#stok .management-header');
        if (stokHeader) {
            stokHeader.appendChild(tambahProdukBtn);
        }
    }

    loadFromStorage() {
        try {
            const savedKeranjang = StorageManager.get(StorageManager.keys.KERANJANG, []);
            this.keranjang = savedKeranjang;
            console.log('📦 Loaded from storage:', this.keranjang.length, 'items');
            this.updateKeranjang();
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.keranjang = [];
        }
    }

    saveToStorage() {
        try {
            StorageManager.set(StorageManager.keys.KERANJANG, this.keranjang);
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Search produk
        const searchInput = document.getElementById('searchProduk');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProduk(e.target.value);
            });
        }

        // Tambah pelanggan button
        const tambahPelangganBtn = document.getElementById('tambahPelangganBtn');
        if (tambahPelangganBtn) {
            tambahPelangganBtn.addEventListener('click', () => {
                this.tampilkanModalPelanggan();
            });
        }

        // Form pelanggan
        const pelangganForm = document.getElementById('pelangganForm');
        if (pelangganForm) {
            pelangganForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.tambahPelanggan();
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetTransaksi();
            });
        }

        // Tombol tambah produk
        const tambahProdukBtn = document.createElement('button');
        tambahProdukBtn.className = 'btn-add-product';
        tambahProdukBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Produk';
        tambahProdukBtn.onclick = () => this.tampilkanModalProduk();
        
        // Sisipkan tombol di panel produk
        const produkPanel = document.querySelector('.produk-panel');
        if (produkPanel) {
            produkPanel.insertBefore(tambahProdukBtn, produkPanel.querySelector('.search-bar'));
        }
        
        // Form tambah produk
        const produkForm = document.getElementById('produkForm');
        if (produkForm) {
            produkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.tambahProduk();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + R untuk reset
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.resetTransaksi();
            }
            // Escape untuk close modal
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });

        // Form edit produk
        const editProdukForm = document.getElementById('editProdukForm');
        if (editProdukForm) {
            editProdukForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProduk();
            });
        }

        // TAMBAHAN: Event listener untuk modal hapus produk
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                const modal = document.getElementById('deleteProdukModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // TAMBAHAN: Event listener untuk tutup modal edit
        const closeEditModal = document.querySelector('#editProdukModal .close');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                const modal = document.getElementById('editProdukModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    // PERBAIKAN: Update method loadProduk untuk include localStorage fallback
    async loadProduk() {
        console.log('🔄 Loading produk...');
        try {
            this.tampilkanLoadingState('produkList', true);
            
            const result = await this.api.getProduk();
            console.log('📦 Produk API result:', result);
            
            if (result.success) {
                // Handle berbagai format response
                if (result.data && Array.isArray(result.data)) {
                    this.produk = result.data;
                } else if (result.data && result.data.records) {
                    this.produk = result.data.records;
                } else if (result.data && result.data.data) {
                    this.produk = result.data.data;
                } else {
                    this.produk = [];
                }
                
                // PERBAIKAN: Simpan ke localStorage
                await this.syncProdukToLocalStorage();
                
                console.log(`✅ ${this.produk.length} produk loaded:`, this.produk);
                this.tampilkanProduk(this.produk);
                
                if (this.produk.length > 0) {
                    this.notification.success(`Berhasil memuat ${this.produk.length} produk`);
                } else {
                    this.notification.info('Tidak ada data produk');
                }
            } else {
                console.error('❌ API returned error:', result.error);
                // Fallback ke localStorage
                const loaded = await this.loadProdukFromLocalStorage();
                if (loaded) {
                    this.tampilkanProduk(this.produk);
                    this.notification.info('Menggunakan data produk dari cache');
                } else {
                    throw new Error(result.error || 'Gagal memuat data produk');
                }
            }
        } catch (error) {
            console.error('❌ Error loading produk:', error);
            // Fallback ke localStorage
            const loaded = await this.loadProdukFromLocalStorage();
            if (!loaded) {
                this.notification.error('Gagal memuat data produk: ' + error.message);
                this.tampilkanErrorState('produkList', `Gagal memuat data produk: ${error.message}`);
            }
        } finally {
            this.tampilkanLoadingState('produkList', false);
        }
    }

    async loadPelanggan() {
        console.log('🔄 Loading pelanggan...');
        try {
            const result = await this.api.getPelanggan();
            console.log('👥 Pelanggan API result:', result);
            
            if (result.success) {
                // Handle berbagai format response
                if (result.data && Array.isArray(result.data)) {
                    this.pelanggan = result.data;
                } else if (result.data && result.data.records) {
                    this.pelanggan = result.data.records;
                } else if (result.data && result.data.data) {
                    this.pelanggan = result.data.data;
                } else {
                    this.pelanggan = [];
                }
                
                console.log(`✅ ${this.pelanggan.length} pelanggan loaded`);
                this.tampilkanPelanggan();
            } else {
                console.warn('⚠️ No pelanggan data or API error, using default');
                this.pelanggan = [];
                this.tampilkanPelanggan();
            }
        } catch (error) {
            console.error('❌ Error loading pelanggan:', error);
            // Untuk pelanggan, kita gunakan default saja tanpa error
            this.pelanggan = [];
            this.tampilkanPelanggan();
        }
    }

    tampilkanLoadingState(elementId, isLoading) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (isLoading) {
            element.classList.add('loading');
            // Tambah spinner jika belum ada
            if (!element.querySelector('.loading-spinner')) {
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
                spinner.style.cssText = 'text-align: center; padding: 20px; color: #666;';
                element.appendChild(spinner);
            }
        } else {
            element.classList.remove('loading');
            const spinner = element.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    tampilkanErrorState(elementId, message) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 15px;"></i>
                <p style="margin-bottom: 15px; color: #666;">${message}</p>
                <button class="btn-secondary" onclick="app.loadProduk()" style="padding: 10px 20px;">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }

    tampilkanProduk(produkList) {
        const container = document.getElementById('produkList');
        if (!container) {
            console.error('❌ produkList container not found');
            return;
        }

        if (!produkList || produkList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666;">Tidak ada produk tersedia</p>
                    <button class="btn-secondary" onclick="app.loadProduk()" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> Refresh
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        produkList.forEach(produk => {
            const isOutOfStock = (produk.Stok || 0) <= 0;
            const isLowStock = (produk.Stok || 0) > 0 && (produk.Stok || 0) <= 5;
            
            html += `
                <div class="produk-item ${isOutOfStock ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock' : ''}">
                    <h4>${produk.NamaProduk || 'No Name'}</h4>
                    <div class="harga">${DataUtils.formatCurrency(produk.Harga || 0)}</div>
                    <div class="stok ${isOutOfStock ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock' : ''}">
                        Stok: ${produk.Stok || 0}
                        ${isLowStock ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ffc107;"></i>' : ''}
                    </div>
                    <button class="btn-tambah" onclick="app.tambahKeKeranjang(${produk.ProdukID})"
                            ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> 
                        ${isOutOfStock ? 'Stok Habis' : 'Tambah'}
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    filterProduk(keyword) {
        if (!this.produk || this.produk.length === 0) return;
        
        const filtered = keyword 
            ? this.produk.filter(produk => 
                (produk.NamaProduk || '').toLowerCase().includes(keyword.toLowerCase()))
            : this.produk;
        
        this.tampilkanProduk(filtered);
    }

    tampilkanPelanggan() {
        const select = document.getElementById('pelangganSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Pelanggan Umum</option>';
        
        this.pelanggan.forEach(pelanggan => {
            const option = document.createElement('option');
            option.value = pelanggan.PelangganID;
            option.textContent = pelanggan.NamaPelanggan || 'Unknown';
            select.appendChild(option);
        });

        console.log(`✅ ${this.pelanggan.length} pelanggan ditampilkan`);
    }

    tambahKeKeranjang(produkID) {
        console.log('➕ Adding to cart:', produkID);
        
        const produk = this.produk.find(p => p.ProdukID == produkID);
        if (!produk) {
            this.notification.error('Produk tidak ditemukan');
            return;
        }
        
        // Validasi stok
        const stokTersedia = parseInt(produk.Stok) || 0;
        const itemDiKeranjang = this.keranjang.find(item => item.ProdukID == produkID);
        const jumlahDiKeranjang = itemDiKeranjang ? parseInt(itemDiKeranjang.JumlahProduk) : 0;
        
        if (stokTersedia <= 0) {
            this.notification.warning('Stok produk habis');
            return;
        }
        
        if (jumlahDiKeranjang >= stokTersedia) {
            this.notification.warning('Stok tidak mencukupi');
            return;
        }

        // Update atau tambah item ke keranjang
        if (itemDiKeranjang) {
            itemDiKeranjang.JumlahProduk++;
            itemDiKeranjang.Subtotal = itemDiKeranjang.JumlahProduk * (parseFloat(produk.Harga) || 0);
        } else {
            this.keranjang.push({
                ProdukID: parseInt(produk.ProdukID),
                NamaProduk: produk.NamaProduk,
                Harga: parseFloat(produk.Harga) || 0,
                JumlahProduk: 1,
                Subtotal: parseFloat(produk.Harga) || 0
            });
        }

        this.updateKeranjang();
        this.saveToStorage();
        this.notification.success(`"${produk.NamaProduk}" ditambahkan ke keranjang`);
    }

    updateKeranjang() {
        const container = document.getElementById('keranjangItems');
        const totalElement = document.getElementById('totalHarga');
        
        if (!container || !totalElement) {
            console.error('❌ Keranjang elements not found');
            return;
        }

        if (this.keranjang.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Keranjang belanja kosong</p>
                    <small>Pilih produk dari daftar di sebelah kiri</small>
                </div>
            `;
            totalElement.textContent = '0';
            return;
        }

        let html = '';
        let total = 0;
        
        this.keranjang.forEach((item, index) => {
            total += parseFloat(item.Subtotal) || 0;
            
            html += `
                <div class="keranjang-item">
                    <div class="keranjang-item-info">
                        <strong>${item.NamaProduk}</strong>
                        <small>${DataUtils.formatCurrency(item.Harga)}</small>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="app.kurangiQuantity(${index})">-</button>
                            <span class="quantity-display">${item.JumlahProduk}</span>
                            <button class="quantity-btn" onclick="app.tambahQuantity(${index})">+</button>
                        </div>
                    </div>
                    <div class="keranjang-item-actions">
                        <div class="item-total">${DataUtils.formatCurrency(item.Subtotal)}</div>
                        <button class="delete-btn" onclick="app.hapusDariKeranjang(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        totalElement.textContent = DataUtils.formatCurrency(total);
        
        // Update tombol checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.keranjang.length === 0;
        }
    }

    // Tambahkan method untuk mengatur quantity
    tambahQuantity(index) {
        if (index < 0 || index >= this.keranjang.length) return;
        
        const item = this.keranjang[index];
        const produk = this.produk.find(p => p.ProdukID == item.ProdukID);
        
        // Validasi stok
        if ((produk.Stok || 0) <= item.JumlahProduk) {
            this.notification.warning('Stok tidak mencukupi');
            return;
        }
        
        item.JumlahProduk++;
        item.Subtotal = item.JumlahProduk * item.Harga;
        
        this.updateKeranjang();
        this.saveToStorage();
    }

    kurangiQuantity(index) {
        if (index < 0 || index >= this.keranjang.length) return;
        
        const item = this.keranjang[index];
        
        if (item.JumlahProduk > 1) {
            item.JumlahProduk--;
            item.Subtotal = item.JumlahProduk * item.Harga;
        } else {
            // Jika quantity 1, hapus item
            this.hapusDariKeranjang(index);
            return;
        }
        
        this.updateKeranjang();
        this.saveToStorage();
    }

    // PERBAIKAN: Hapus duplikasi method hapusDariKeranjang
    hapusDariKeranjang(index) {
        if (index < 0 || index >= this.keranjang.length) return;
        
        const item = this.keranjang[index];
        this.keranjang.splice(index, 1);
        this.updateKeranjang();
        this.saveToStorage();
        this.notification.info(`"${item.NamaProduk}" dihapus dari keranjang`);
    }

    // PERBAIKAN: Update method checkout untuk menampilkan struk
    async checkout() {
        if (this.keranjang.length === 0) {
            this.notification.warning('Keranjang belanja kosong');
            return;
        }

        // Validasi stok sebelum checkout
        for (const item of this.keranjang) {
            const produk = this.produk.find(p => p.ProdukID == item.ProdukID);
            if (!produk || (produk.Stok || 0) < item.JumlahProduk) {
                this.notification.error(`Stok "${item.NamaProduk}" tidak mencukupi`);
                return;
            }
        }

        const subtotal = this.keranjang.reduce((total, item) => total + (parseFloat(item.Subtotal) || 0), 0);
        const totalHarga = subtotal; // Bisa ditambah pajak/diskon di sini
        
        const pelangganSelect = document.getElementById('pelangganSelect');
        const pelangganID = pelangganSelect && pelangganSelect.value ? parseInt(pelangganSelect.value) : null;
        
        // Dapatkan nama pelanggan
        let namaPelanggan = '';
        if (pelangganID) {
            const pelanggan = this.pelanggan.find(p => p.PelangganID == pelangganID);
            namaPelanggan = pelanggan ? pelanggan.NamaPelanggan : '';
        }

        const transaksiData = {
            TotalHarga: totalHarga,
            PelangganID: pelangganID,
            items: this.keranjang.map(item => ({
                ProdukID: item.ProdukID,
                NamaProduk: item.NamaProduk,
                Harga: item.Harga,
                JumlahProduk: item.JumlahProduk,
                Subtotal: item.Subtotal
            }))
        };

        console.log('💳 Checkout data:', transaksiData);

        try {
            // Tampilkan loading state
            const checkoutBtn = document.getElementById('checkoutBtn');
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            checkoutBtn.disabled = true;

            const result = await this.api.createPenjualan(transaksiData);

            if (result.success) {
                this.notification.success(`Transaksi berhasil! Total: ${DataUtils.formatCurrency(totalHarga)}`);
                
                // Tampilkan struk
                this.tampilkanStruk({
                    items: this.keranjang,
                    subtotal: subtotal,
                    totalHarga: totalHarga,
                    pelanggan: namaPelanggan,
                    // Bisa ditambah pajak, diskon, dll.
                    pajak: 0,
                    diskon: 0,
                    persentasePajak: 0
                });
                
                this.resetTransaksi();
                await this.loadProduk(); // Refresh stok
                
            } else {
                throw new Error(result.error || 'Transaksi gagal');
            }
        } catch (error) {
            console.error('❌ Checkout error:', error);
            this.notification.error('Transaksi gagal: ' + error.message);
        } finally {
            // Reset button state
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Checkout';
                checkoutBtn.disabled = this.keranjang.length === 0;
            }
        }
    }

    resetTransaksi() {
        if (this.keranjang.length === 0) {
            this.notification.info('Keranjang sudah kosong');
            return;
        }

        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            this.keranjang = [];
            this.updateKeranjang();
            this.saveToStorage();
            
            const pelangganSelect = document.getElementById('pelangganSelect');
            if (pelangganSelect) {
                pelangganSelect.value = '';
            }
            
            this.notification.success('Transaksi direset');
        }
    }

    tampilkanModalPelanggan() {
        const modal = document.getElementById('pelangganModal');
        if (modal) {
            modal.style.display = 'block';
            
            const form = document.getElementById('pelangganForm');
            if (form) {
                form.reset();
                // Focus ke input nama
                const namaInput = document.getElementById('namaPelanggan');
                if (namaInput) {
                    namaInput.focus();
                }
            }
        }
    }

    async tambahPelanggan() {
        const namaInput = document.getElementById('namaPelanggan');
        const alamatInput = document.getElementById('alamat');
        const teleponInput = document.getElementById('nomorTelepon');
        
        if (!namaInput) {
            this.notification.error('Form tidak lengkap');
            return;
        }

        const formData = {
            NamaPelanggan: namaInput.value.trim(),
            Alamat: alamatInput ? alamatInput.value.trim() : '',
            NomorTelepon: teleponInput ? teleponInput.value.trim() : ''
        };

        // Validasi
        if (!formData.NamaPelanggan) {
            this.notification.warning('Nama pelanggan harus diisi');
            namaInput.focus();
            return;
        }

        if (formData.NomorTelepon && !/^[0-9+\-\s()]{10,}$/.test(formData.NomorTelepon)) {
            this.notification.warning('Format nomor telepon tidak valid');
            if (teleponInput) teleponInput.focus();
            return;
        }

        try {
            // Tampilkan loading
            const submitBtn = document.querySelector('#pelangganForm button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            const result = await this.api.createPelanggan(formData);

            if (result.success) {
                this.notification.success('Pelanggan berhasil ditambahkan');
                
                // Tutup modal
                const modal = document.getElementById('pelangganModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh data pelanggan
                await this.loadPelanggan();
                
                // Auto-select pelanggan baru jika ada
                if (result.data && result.data.PelangganID) {
                    const select = document.getElementById('pelangganSelect');
                    if (select) {
                        select.value = result.data.PelangganID;
                    }
                }
            } else {
                throw new Error(result.error || 'Gagal menambahkan pelanggan');
            }
        } catch (error) {
            console.error('❌ Error adding pelanggan:', error);
            this.notification.error('Gagal menambahkan pelanggan: ' + error.message);
        } finally {
            // Reset button
            const submitBtn = document.querySelector('#pelangganForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = originalText || 'Simpan Pelanggan';
                submitBtn.disabled = false;
            }
        }
    }

    // Method untuk menampilkan modal tambah produk
    tampilkanModalProduk() {
        const modal = document.getElementById('produkModal');
        if (modal) {
            modal.style.display = 'block';
            
            const form = document.getElementById('produkForm');
            if (form) {
                form.reset();
                // Focus ke input nama
                const namaInput = document.getElementById('namaProduk');
                if (namaInput) {
                    namaInput.focus();
                }
            }
        }
    }

    // ✅ PERBAIKAN: Method tambahProduk yang sudah diperbaiki
    async tambahProduk() {
        const namaInput = document.getElementById('namaProduk');
        const hargaInput = document.getElementById('hargaProduk');
        const stokInput = document.getElementById('stokProduk');
        
        if (!namaInput || !hargaInput) {
            this.notification.error('Form tidak lengkap');
            return;
        }

        const formData = {
            NamaProduk: namaInput.value.trim(),
            Harga: parseFloat(hargaInput.value) || 0,
            Stok: parseInt(stokInput.value) || 0
        };

        // Validasi
        if (!formData.NamaProduk) {
            this.notification.warning('Nama produk harus diisi');
            namaInput.focus();
            return;
        }

        if (formData.Harga <= 0) {
            this.notification.warning('Harga harus lebih dari 0');
            hargaInput.focus();
            return;
        }

        // ✅ PERBAIKAN: Simpan reference button dan text dengan benar
        const submitBtn = document.querySelector('#produkForm button[type="submit"]');
        if (!submitBtn) {
            this.notification.error('Tombol submit tidak ditemukan');
            return;
        }

        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        try {
            // Tampilkan loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            console.log('🔄 Mengirim data produk:', formData);
            
            // ✅ PERBAIKAN: Tambah timeout untuk prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Request terlalu lama')), 10000);
            });

            const apiPromise = this.api.createProduk(formData);
            
            const result = await Promise.race([apiPromise, timeoutPromise]);

            // ✅ PERBAIKAN: Validasi response lebih ketat
            if (!result) {
                throw new Error('Tidak ada response dari server');
            }

            if (result.success && result.data) {
                this.notification.success('Produk berhasil ditambahkan');
                
                // Tutup modal
                const modal = document.getElementById('produkModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Refresh data produk
                await this.loadProduk();
                
            } else {
                // ✅ PERBAIKAN: Handle berbagai jenis error response
                const errorMessage = result.error || 
                                   (result.data && result.data.message) || 
                                   'Gagal menambahkan produk';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ Error adding produk:', error);
            
            // ✅ PERBAIKAN: Tampilkan error yang lebih spesifik
            let userMessage = 'Gagal menambahkan produk: ';
            if (error.message.includes('Timeout')) {
                userMessage += 'Request timeout. Periksa koneksi server.';
            } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
                userMessage += 'Koneksi jaringan terputus. Periksa koneksi internet.';
            } else {
                userMessage += error.message;
            }
            
            this.notification.error(userMessage);
            
        } finally {
            // ✅ PERBAIKAN: Pastikan selalu reset button state
            console.log('🔧 Reset button state');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        }
    }

    // PERBAIKAN: Method untuk menampilkan struk - MASUKKAN DI DALAM CLASS
    tampilkanStruk(transaksiData) {
        const strukContainer = document.getElementById('strukContainer');
        const strukContent = document.getElementById('strukContent');
        
        if (!strukContainer || !strukContent) {
            console.error('❌ Struk elements not found');
            return;
        }

        const now = new Date();
        const tanggal = now.toLocaleDateString('id-ID');
        const jam = now.toLocaleTimeString('id-ID');
        
        // Format nomor transaksi
        const noTransaksi = 'TRX-' + now.getTime();
        
        let html = `
            <div class="struk-header">
                <h2>KASIR UMKM</h2>
                <p>Jl. Contoh No. 123</p>
                <p>Telp: 0812-3456-7890</p>
                <div style="margin: 10px 0; border-top: 1px dashed #000; padding-top: 5px;">
                    <strong>STRUK BELANJA</strong>
                </div>
            </div>
            
            <div class="struk-info">
                <div class="struk-info-row">
                    <span>No. Transaksi:</span>
                    <span>${noTransaksi}</span>
                </div>
                <div class="struk-info-row">
                    <span>Tanggal:</span>
                    <span>${tanggal}</span>
                </div>
                <div class="struk-info-row">
                    <span>Jam:</span>
                    <span>${jam}</span>
                </div>
                <div class="struk-info-row">
                    <span>Kasir:</span>
                    <span>Admin</span>
                </div>
        `;
        
        // Tambah info pelanggan jika ada
        if (transaksiData.pelanggan) {
            html += `
                <div class="struk-info-row">
                    <span>Pelanggan:</span>
                    <span>${transaksiData.pelanggan}</span>
                </div>
            `;
        }
        
        html += `</div>
            
            <div class="struk-items">
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 3px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>ITEM</span>
                        <span style="width: 70px; text-align: right;">SUBTTL</span>
                    </div>
                </div>
        `;
        
        // Tambah items
        transaksiData.items.forEach(item => {
            html += `
                <div class="struk-item">
                    <div class="struk-item-name">
                        ${item.NamaProduk}
                    </div>
                    <div class="struk-item-qty">
                        ${item.JumlahProduk}x
                    </div>
                    <div class="struk-item-price">
                        ${DataUtils.formatCurrency(item.Harga)}
                    </div>
                </div>
                <div style="text-align: right; font-size: 10px; margin-bottom: 5px;">
                    ${DataUtils.formatCurrency(item.Subtotal)}
                </div>
            `;
        });
        
        html += `</div>
            
            <div class="struk-totals">
                <div class="struk-total-row">
                    <span>Subtotal:</span>
                    <span>${DataUtils.formatCurrency(transaksiData.subtotal)}</span>
                </div>
        `;
        
        // Tambah pajak jika ada
        if (transaksiData.pajak && transaksiData.pajak > 0) {
            html += `
                <div class="struk-total-row">
                    <span>Pajak (${transaksiData.persentasePajak}%):</span>
                    <span>${DataUtils.formatCurrency(transaksiData.pajak)}</span>
                </div>
            `;
        }
        
        // Tambah diskon jika ada
        if (transaksiData.diskon && transaksiData.diskon > 0) {
            html += `
                <div class="struk-total-row">
                    <span>Diskon:</span>
                    <span>-${DataUtils.formatCurrency(transaksiData.diskon)}</span>
                </div>
            `;
        }
        
        html += `
                <div class="struk-total-row grand-total">
                    <span>TOTAL:</span>
                    <span>${DataUtils.formatCurrency(transaksiData.totalHarga)}</span>
                </div>
            </div>
            
            <div class="struk-footer">
                <p>*** TERIMA KASIH ***</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                <p>www.kasirumkm.com</p>
            </div>
        `;
        
        strukContent.innerHTML = html;
        strukContainer.style.display = 'block';
        
        // Auto print setelah 1 detik
        setTimeout(() => {
            this.cetakStruk();
        }, 1000);
    }

    // PERBAIKAN: Method untuk mencetak struk - MASUKKAN DI DALAM CLASS
    cetakStruk() {
        window.print();
    }

    // PERBAIKAN: Method untuk menutup struk - MASUKKAN DI DALAM CLASS
    tutupStruk() {
        const strukContainer = document.getElementById('strukContainer');
        if (strukContainer) {
            strukContainer.style.display = 'none';
        }
    }

    // Method untuk menghitung pajak dan diskon (opsional)
    hitungTotalDenganPajakDiskon(subtotal, persentasePajak = 0, diskon = 0) {
        const pajak = subtotal * (persentasePajak / 100);
        const totalSetelahDiskon = subtotal - diskon;
        const totalHarga = totalSetelahDiskon + pajak;
        
        return {
            subtotal: subtotal,
            pajak: pajak,
            diskon: diskon,
            totalHarga: totalHarga,
            persentasePajak: persentasePajak
        };
    }

    // Method untuk test struk (bisa dijalankan di console)
    testStruk() {
        const testData = {
            items: [
                {
                    NamaProduk: 'Minyak Goreng',
                    Harga: 15000,
                    JumlahProduk: 2,
                    Subtotal: 30000
                },
                {
                    NamaProduk: 'Gula Pasir',
                    Harga: 12000,
                    JumlahProduk: 1,
                    Subtotal: 12000
                },
                {
                    NamaProduk: 'Telur',
                    Harga: 25000,
                    JumlahProduk: 1,
                    Subtotal: 25000
                }
            ],
            subtotal: 67000,
            totalHarga: 67000,
            pelanggan: 'Budi Santoso',
            pajak: 0,
            diskon: 0,
            persentasePajak: 0
        };
        
        this.tampilkanStruk(testData);
    }

    // Method untuk debugging
    debugInfo() {
        return {
            produkCount: this.produk.length,
            pelangganCount: this.pelanggan.length,
            keranjangCount: this.keranjang.length,
            keranjangTotal: this.keranjang.reduce((sum, item) => sum + (item.Subtotal || 0), 0)
        };
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Starting Aplikasi Kasir');
    
    // Tunggu sebentar untuk memastikan semua element sudah ter-render
    setTimeout(() => {
        try {
            window.app = new AplikasiKasir();
            console.log('✅ Aplikasi Kasir berhasil diinisialisasi');
        } catch (error) {
            console.error('❌ Gagal menginisialisasi Aplikasi Kasir:', error);
            
            // Fallback: tampilkan error message
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: #dc3545; width: 100%;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px;"></i>
                        <h2>Terjadi Kesalahan</h2>
                        <p>Gagal memuat aplikasi. Silakan refresh halaman.</p>
                        <p style="font-size: 14px; color: #666; margin: 10px 0;">Periksa console browser (F12) untuk detail error.</p>
                        <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                            <i class="fas fa-redo"></i> Refresh Halaman
                        </button>
                    </div>
                `;
            }
        }
    }, 100);
});

// Fallback initialization untuk browser yang sudah load
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(() => {
        if (!window.app) {
            window.app = new AplikasiKasir();
        }
    }, 100);
}

// Export untuk global access (jika diperlukan)
window.AplikasiKasir = AplikasiKasir;