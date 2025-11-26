<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'config.php';

$action = $_GET['action'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($action === 'login') {
            // Login user
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($username) || empty($password)) {
                echo json_encode(['success' => false, 'message' => 'Username dan password harus diisi']);
                exit;
            }
            
            // Hash password dengan MD5
            $password_hash = md5($password);
            
            $stmt = $pdo->prepare("SELECT UserID, Username, NamaLengkap, Role FROM users WHERE Username = ? AND Password = ?");
            $stmt->execute([$username, $password_hash]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                // Update last login
                $update_stmt = $pdo->prepare("UPDATE users SET TerakhirLogin = NOW() WHERE UserID = ?");
                $update_stmt->execute([$user['UserID']]);
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login berhasil',
                    'user' => $user
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Username atau password salah']);
            }
        }
        elseif ($action === 'create') {
            // Buat user baru
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $nama_lengkap = $input['nama_lengkap'] ?? '';
            $role = $input['role'] ?? 'kasir';
            
            if (empty($username) || empty($password) || empty($nama_lengkap)) {
                echo json_encode(['success' => false, 'message' => 'Semua field harus diisi']);
                exit;
            }
            
            // Hash password dengan MD5
            $password_hash = md5($password);
            
            $stmt = $pdo->prepare("INSERT INTO users (Username, Password, NamaLengkap, Role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $password_hash, $nama_lengkap, $role]);
            
            echo json_encode(['success' => true, 'message' => 'User berhasil dibuat']);
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'getall') {
            // Get semua users (kecuali password)
            $stmt = $pdo->prepare("SELECT UserID, Username, NamaLengkap, Role, TerakhirLogin, DibuatPada FROM users ORDER BY UserID");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'users' => $users]);
        }
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>