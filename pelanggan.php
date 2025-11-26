<?php
class Pelanggan {
    private $conn;
    private $table_name = "pelanggan";

    public $PelangganID;
    public $NamaPelanggan;
    public $Alamat;
    public $NomorTelepon;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY NamaPelanggan";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $exception) {
            error_log("Error in Pelanggan->read(): " . $exception->getMessage());
            return false;
        }
    }

    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                     SET NamaPelanggan=:NamaPelanggan, Alamat=:Alamat, NomorTelepon=:NomorTelepon";
            
            $stmt = $this->conn->prepare($query);
            
            // sanitize
            $this->NamaPelanggan = htmlspecialchars(strip_tags($this->NamaPelanggan));
            $this->Alamat = htmlspecialchars(strip_tags($this->Alamat));
            $this->NomorTelepon = htmlspecialchars(strip_tags($this->NomorTelepon));
            
            $stmt->bindParam(":NamaPelanggan", $this->NamaPelanggan);
            $stmt->bindParam(":Alamat", $this->Alamat);
            $stmt->bindParam(":NomorTelepon", $this->NomorTelepon);
            
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch (PDOException $exception) {
            error_log("Error in Pelanggan->create(): " . $exception->getMessage());
            return false;
        }
    }
}
?>