<?php
/**
 * Script direct pour l'ajout de terrains sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser les requêtes CORS via le script centralisé
require_once 'cors-header.php';

// Répondre immédiatement aux requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier si c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupérer et décoder les données JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Valider les données obligatoires
    if (empty($data['titre']) || empty($data['description']) || !isset($data['prix'])) {
        throw new Exception('Données manquantes: titre, description et prix sont requis');
    }
    
    // Charger les variables d'environnement via le script centralisé
    require_once 'env-loader.php';
    $env = loadEnvVars();
    
    // Connexion à la base de données
    $host = $env['DB_HOST'] ?? '127.0.0.1';
    $port = $env['DB_PORT'] ?? '3306';
    $dbname = $env['DB_DATABASE'] ?? 'laravel';
    $username = $env['DB_USERNAME'] ?? 'root';
    $password = $env['DB_PASSWORD'] ?? '';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Préparer les données pour l'insertion
    $titre = htmlspecialchars(trim($data['titre']));
    $description = htmlspecialchars(trim($data['description']));
    $prix = floatval($data['prix']);
    $image = !empty($data['image']) ? $data['image'] : null;
    $dateCreation = date('Y-m-d H:i:s');
    
    // Insérer le terrain dans la base de données
    $stmt = $pdo->prepare("INSERT INTO terrains (titre, description, prix, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([$titre, $description, $prix, $image, $dateCreation, $dateCreation]);
    
    if (!$success) {
        throw new Exception("Échec de l'ajout du terrain dans la base de données");
    }
    
    // Récupérer l'ID du terrain nouvellement inséré
    $terrainId = $pdo->lastInsertId();
    
    // Journaliser l'ajout
    file_put_contents(__DIR__ . '/add-log.txt', date('Y-m-d H:i:s') . " - Added terrain ID: $terrainId\n", FILE_APPEND);
    
    // Créer l'objet terrain à renvoyer
    $terrain = [
        'id' => (int)$terrainId,
        'titre' => $titre,
        'description' => $description,
        'prix' => $prix,
        'image' => $image,
        'created_at' => $dateCreation,
        'updated_at' => $dateCreation
    ];
    
    // Renvoyer une réponse de succès
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Terrain ajouté avec succès',
        'terrain' => $terrain
    ]);
    
} catch (Exception $e) {
    // Journaliser l'erreur
    file_put_contents(__DIR__ . '/add-errors.txt', date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    // Renvoyer une réponse d'erreur avec le code HTTP approprié
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de l\'ajout du terrain: ' . $e->getMessage()
    ]);
}