<?php
class Penjualan {
    private $conn;
    private $table_name = "penjualan";

    public $PenjualanID;
    public $TanggalPenjualan;
    public $TotalHarga;
    public $PelangganID;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                     SET TanggalPenjualan=:TanggalPenjualan, TotalHarga=:TotalHarga, PelangganID=:PelangganID";
            
            $stmt = $this->conn->prepare($query);
            
            $this->TanggalPenjualan = date('Y-m-d H:i:s');
            $stmt->bindParam(":TanggalPenjualan", $this->TanggalPenjualan);
            $stmt->bindParam(":TotalHarga", $this->TotalHarga);
            $stmt->bindParam(":PelangganID", $this->PelangganID);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch (PDOException $exception) {
            error_log("Error in Penjualan->create(): " . $exception->getMessage());
            return false;
        }
    }
}
?>