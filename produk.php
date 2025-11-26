<?php
class Produk {
    private $conn;
    private $table_name = "produk";

    public $ProdukID;
    public $NamaProduk;
    public $Harga;
    public $Stok;
    public $JumlahProduk;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Method yang sudah ada...
    public function read() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY NamaProduk";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $exception) {
            error_log("Error in Produk->read(): " . $exception->getMessage());
            return false;
        }
    }

    // TAMBAH METHOD CREATE UNTUK TAMBAH PRODUK BARU
    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                     SET NamaProduk=:NamaProduk, Harga=:Harga, Stok=:Stok";
            
            $stmt = $this->conn->prepare($query);
            
            // sanitize
            $this->NamaProduk = htmlspecialchars(strip_tags($this->NamaProduk));
            $this->Harga = htmlspecialchars(strip_tags($this->Harga));
            $this->Stok = htmlspecialchars(strip_tags($this->Stok));
            
            $stmt->bindParam(":NamaProduk", $this->NamaProduk);
            $stmt->bindParam(":Harga", $this->Harga);
            $stmt->bindParam(":Stok", $this->Stok);
            
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch (PDOException $exception) {
            error_log("Error in Produk->create(): " . $exception->getMessage());
            return false;
        }
    }

    // Method yang sudah ada...
    public function updateStok() {
        try {
            $query = "UPDATE " . $this->table_name . " SET Stok = Stok - :JumlahProduk WHERE ProdukID = :ProdukID AND Stok >= :JumlahProduk";
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(":JumlahProduk", $this->JumlahProduk);
            $stmt->bindParam(":ProdukID", $this->ProdukID);
            
            return $stmt->execute();
        } catch (PDOException $exception) {
            error_log("Error in Produk->updateStok(): " . $exception->getMessage());
            return false;
        }
    }

    public function getStok($produkID) {
        try {
            $query = "SELECT Stok FROM " . $this->table_name . " WHERE ProdukID = :ProdukID";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":ProdukID", $produkID);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['Stok'] : 0;
        } catch (PDOException $exception) {
            error_log("Error in Produk->getStok(): " . $exception->getMessage());
            return 0;
        }
    }
}
?>