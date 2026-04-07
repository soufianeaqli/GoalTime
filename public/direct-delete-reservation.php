<?php
/**
 * Script direct pour supprimer une réservation sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Gestion des CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier que la méthode de requête est GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Vérifier que l'ID est fourni
if (!isset($_GET['id']) || !is_numeric($_GET['id']) || $_GET['id'] <= 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'ID de réservation invalide']);
    exit;
}

$reservationId = (int)$_GET['id'];
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$isAdmin = isset($_GET['is_admin']) && $_GET['is_admin'] === 'true';

// Inclure la fonction de chargement des variables d'environnement
require_once __DIR__ . '/env-loader.php';
$env = loadEnvVars();

try {
    // Connexion à la base de données
    $host = $env['DB_HOST'] ?? '127.0.0.1';
    $port = $env['DB_PORT'] ?? '3306';
    $dbname = $env['DB_DATABASE'] ?? 'laravel';
    $username = $env['DB_USERNAME'] ?? 'root';
    $password = $env['DB_PASSWORD'] ?? '';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);

    // Vérifier que la réservation existe
    $stmt = $pdo->prepare("SELECT * FROM reservations WHERE id = ?");
    $stmt->execute([$reservationId]);
    $reservation = $stmt->fetch();

    if (!$reservation) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Réservation non trouvée']);
        exit;
    }

    // Si l'utilisateur n'est pas admin, vérifier qu'il est bien le propriétaire de la réservation
    if (!$isAdmin && $userId && $reservation['user_id'] !== $userId) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Vous n\'êtes pas autorisé à supprimer cette réservation']);
        exit;
    }

    // Supprimer la réservation
    $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
    $stmt->execute([$reservationId]);

    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Réservation supprimée avec succès',
            'data' => [
                'id' => $reservationId,
                'deleted' => true
            ]
        ]);
    } else {
        throw new Exception('Échec de la suppression de la réservation');
    }

} catch (PDOException $e) {
    error_log("Erreur PDO lors de la suppression de la réservation: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur lors de la suppression de la réservation: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
} 