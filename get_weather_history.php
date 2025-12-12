<?php
// ====================================
// 1. Headers Setup (Allow connection from React)
// ====================================
header('Access-Control-Allow-Origin: *');  // Allow any site to connect
header('Access-Control-Allow-Methods: GET, OPTIONS');  // Allow GET and OPTIONS
header('Access-Control-Allow-Headers: Content-Type');  // Allow sending JSON
header('Content-Type: application/json');  // Response will be JSON

// If the request is OPTIONS (preflight request from browser), respond and exit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// ====================================
// 2. Database Connection Settings
// ====================================
$host = 'localhost';
$dbname = 'search';
$username = 'root';
$password = '';

// ====================================
// 3. Make sure the request is GET
// ====================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        'success' => false,
        'message' => 'Only GET method is allowed'
    ]);
    exit();
}

// ====================================
// 4. Connect to database and fetch history
// ====================================
try {
    // Connect to database
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // SQL query to get the last 10 searches ordered by most recent
    $sql = "SELECT id, humidity, location, temperature, windSpeed, time_search 
            FROM history 
            ORDER BY time_search DESC 
            LIMIT 10";
    
    // Prepare and execute the query
    $stmt = $db->prepare($sql);
    $stmt->execute();
    
    // Fetch all results as associative array
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Send success response with data
    echo json_encode([
        'success' => true,
        'count' => count($history),  // Number of records returned
        'data' => $history  // The history data
    ]);
    
} catch (PDOException $e) {
    // In case of database error
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>