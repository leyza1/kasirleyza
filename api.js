// API Handler untuk Aplikasi Kasir UMKM
class KasirAPI {
    constructor() {
        this.baseUrl = '../backend/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = {
            ...defaultOptions,
            ...options,
        };

        try {
            console.log(`🔄 API Request: ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ API Request failed:', error);
            return { 
                success: false, 
                error: error.message,
                data: null 
            };
        }
    }

    // Produk API
    async getProduk() {
        return await this.request('produk.php');
    }

    async createProduk(produkData) {
        return await this.request('produk.php', {
            method: 'POST',
            body: JSON.stringify(produkData)
        });
    }

    // Update produk - menggunakan POST dengan parameter update
    async updateProduk(produkData) {
        return await this.request('produk.php?action=update', {
            method: 'POST',
            body: JSON.stringify(produkData)
        });
    }

    // Hapus produk - menggunakan POST dengan parameter delete
    async deleteProduk(produkID) {
        return await this.request('produk.php?action=delete', {
            method: 'POST',
            body: JSON.stringify({ ProdukID: produkID })
        });
    }

    // Alternatif menggunakan GET parameters untuk delete
    async deleteProdukGet(produkID) {
        return await this.request(`produk.php?action=delete&id=${produkID}`, {
            method: 'GET'
        });
    }

    // Pelanggan API
    async getPelanggan() {
        return await this.request('pelanggan.php');
    }

    async createPelanggan(pelangganData) {
        return await this.request('pelanggan.php', {
            method: 'POST',
            body: JSON.stringify(pelangganData)
        });
    }

    // Penjualan API
    async createPenjualan(penjualanData) {
        return await this.request('penjualan.php', {
            method: 'POST',
            body: JSON.stringify(penjualanData)
        });
    }

    // Test connection
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/produk.php`);
            return {
                success: response.ok,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Simple Notification System
class NotificationSystem {
    show(message, type = 'info', duration = 5000) {
        // Buat notifikasi sederhana
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#28a745' : 
                        type === 'error' ? '#dc3545' : 
                        type === 'warning' ? '#ffc107' : '#17a2b8';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            min-width: 300px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <strong style="display: block; margin-bottom: 5px; font-size: 14px;">
                        ${type.toUpperCase()}
                    </strong>
                    <div style="font-size: 13px;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; margin-left: 10px;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Storage Manager
class StorageManager {
    static set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    static keys = {
        KERANJANG: 'kasir_keranjang'
    };
}

// Data Utilities
class DataUtils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(date) {
        if (!date) return '-';
        return new Intl.DateTimeFormat('id-ID').format(new Date(date));
    }
}

// Export untuk global use
window.KasirAPI = KasirAPI;
window.NotificationSystem = NotificationSystem;
window.StorageManager = StorageManager;
window.DataUtils = DataUtils;