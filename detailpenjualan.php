<?php
class DetailPenjualan {
    private $conn;
    private $table_name = "detailpenjualan";

    public $DetailID;
    public $PenjualanID;
    public $ProdukID;
    public $JumlahProduk;
    public $Subtotal;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                     SET PenjualanID=:PenjualanID, ProdukID=:ProdukID, JumlahProduk=:JumlahProduk, Subtotal=:Subtotal";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(":PenjualanID", $this->PenjualanID);
            $stmt->bindParam(":ProdukID", $this->ProdukID);
            $stmt->bindParam(":JumlahProduk", $this->JumlahProduk);
            $stmt->bindParam(":Subtotal", $this->Subtotal);
            
            return $stmt->execute();
        } catch (PDOException $exception) {
            error_log("Error in DetailPenjualan->create(): " . $exception->getMessage());
            return false;
        }
    }
}
?>