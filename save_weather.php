<?php
// ====================================
// 1. CORS Headers Configuration
// ====================================
// Allow any origin to connect to this API (use specific domain in production for security)
header('Access-Control-Allow-Origin: *');

// Specify which HTTP methods are allowed (POST for data submission, OPTIONS for preflight)
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Allow Content-Type header in requests (required for sending JSON data)
header('Access-Control-Allow-Headers: Content-Type');

// Set response format to JSON
header('Content-Type: application/json');

// Handle preflight OPTIONS request sent by browsers before actual POST request
// This is part of CORS protocol - just exit without processing
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// ====================================
// 2. Database Connection Configuration
// ====================================
// Database server address (localhost means same machine)
$host = 'localhost';

// Name of the database we want to connect to
$dbname = 'search';

// Database username (default XAMPP/WAMP user)
$username = 'root';

// Database password (empty by default in XAMPP/WAMP)
$password = '';

// ====================================
// 3. Verify Request Method
// ====================================
// Only accept POST requests, reject everything else
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST method is allowed'
    ]);
    exit();
}

// ====================================
// 4. Read and Parse JSON Data from Request Body
// ====================================
// Read raw JSON data from request body (sent from React)
$jsonData = file_get_contents('php://input');

// Convert JSON string to PHP associative array
// Second parameter 'true' makes it return array instead of object
$data = json_decode($jsonData, true);

// ====================================
// 5. Validate Required Fields
// ====================================
// Check if all required fields are present and not empty
// If any field is missing, return error response and stop execution
if (empty($data['humidity']) || empty($data['location']) || 
    empty($data['temperature']) || empty($data['windSpeed'])) {
    
    echo json_encode([
        'success' => false,
        'message' => 'Missing data! Make sure to send all required fields'
    ]);
    exit();
}

// ====================================
// 6. Database Connection and Data Insertion
// ====================================
try {
    // Create PDO database connection object
    // PDO is PHP Data Objects - a secure way to interact with databases
    // charset=utf8mb4 ensures proper handling of all characters including emojis
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Set error mode to throw exceptions on database errors
    // This allows us to catch errors with try-catch block
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Prepare SQL INSERT query
    // :placeholders are used for security (prevents SQL injection)
    // NOW() function automatically inserts current date and time
    $sql = "INSERT INTO history (humidity, location, temperature, windSpeed, time_search) 
            VALUES (:humidity, :location, :temperature, :windSpeed, NOW())";
    
    // Prepare the SQL statement for execution
    // This separates SQL code from data for security
    $stmt = $db->prepare($sql);
    
    // Bind actual values to placeholders in the SQL query
    // This is the secure way to insert user data into database
    $stmt->bindValue(':humidity', $data['humidity']);
    $stmt->bindValue(':location', $data['location']);
    $stmt->bindValue(':temperature', $data['temperature']);
    $stmt->bindValue(':windSpeed', $data['windSpeed']);
    
    // Execute the prepared statement (actually insert data into database)
    $stmt->execute();
    
    // Send success response back to React
    echo json_encode([
        'success' => true,
        'message' => 'Data saved successfully! ✅',
        'id' => $db->lastInsertId(),  // Return auto-generated ID of inserted record
        'data' => $data  // Echo back the data that was saved
    ]);
    
} catch (PDOException $e) {
    // Catch any database errors that occur during connection or query execution
    // PDOException is thrown when database operation fails
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>