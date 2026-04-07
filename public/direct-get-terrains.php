<?php
/**
 * Script direct pour récupérer tous les terrains sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir les en-têtes CORS via le fichier centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier si c'est une requête GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Journaliser la demande
    file_put_contents(__DIR__ . '/get-terrains-log.txt', date('Y-m-d H:i:s') . " - Request received\n", FILE_APPEND);
    
    // Inclure la fonction de chargement des variables d'environnement
    require_once __DIR__ . '/env-loader.php';
    
    // Charger les variables d'environnement
    $env = loadEnvVars();
    
    // Vérifier si les variables essentielles sont présentes
    if (empty($env['DB_HOST']) || empty($env['DB_DATABASE'])) {
        throw new Exception('Impossible de charger les variables d\'environnement essentielles');
    }

    // Connexion à la base de données
    $host = $env['DB_HOST'] ?? '127.0.0.1';
    $port = $env['DB_PORT'] ?? '3306';
    $dbname = $env['DB_DATABASE'] ?? 'laravel';
    $username = $env['DB_USERNAME'] ?? 'root';
    $password = $env['DB_PASSWORD'] ?? '';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupérer tous les terrains
    $stmt = $pdo->query("SELECT * FROM terrains ORDER BY id ASC");
    $terrains = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir les valeurs numériques
    foreach ($terrains as &$terrain) {
        $terrain['id'] = (int)$terrain['id'];
        $terrain['prix'] = (float)$terrain['prix'];
    }
    
    // Journaliser le résultat
    file_put_contents(__DIR__ . '/get-terrains-log.txt', date('Y-m-d H:i:s') . " - Found " . count($terrains) . " terrains\n", FILE_APPEND);
    
    // Renvoyer les terrains
    header('Content-Type: application/json');
    echo json_encode($terrains);
    
} catch (Exception $e) {
    // Journaliser l'erreur
    file_put_contents(__DIR__ . '/get-terrains-errors.txt', date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    // Renvoyer une réponse d'erreur avec le code HTTP approprié
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des terrains: ' . $e->getMessage()
    ]);
} 
?>