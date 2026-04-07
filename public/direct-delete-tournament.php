<?php
/**
 * Script direct pour la suppression de tournois sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser les requêtes CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier si c'est une requête GET avec un ID
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$id = intval($_GET['id'] ?? $_POST['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'ID de tournoi non valide']);
    exit;
}

try {
    // Charger le fichier .env via le script centralisé
    require_once __DIR__ . '/env-loader.php';
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
    
    // Récupérer le chemin de l'image avant de supprimer le tournoi
    $stmt = $pdo->prepare("SELECT image FROM tournaments WHERE id = ?");
    $stmt->execute([$id]);
    $tournament = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tournament) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => "Tournoi avec ID $id non trouvé"]);
        exit;
    }
    
    // Supprimer le tournoi de la base de données
    $stmt = $pdo->prepare("DELETE FROM tournaments WHERE id = ?");
    $success = $stmt->execute([$id]);
    
    if (!$success) {
        throw new Exception("Échec de la suppression du tournoi avec ID $id");
    }
    
    // Supprimer l'image associée si elle existe et si elle est locale
    if (!empty($tournament['image']) && strpos($tournament['image'], '/storage/images/') !== false) {
        $imagePath = __DIR__ . $tournament['image'];
        if (file_exists($imagePath)) {
            @unlink($imagePath);
        }
    }
    
    // Renvoyer une réponse de succès
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Tournoi supprimé avec succès'
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la suppression du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la suppression du tournoi: ' . $e->getMessage()
    ]);
}
?>
