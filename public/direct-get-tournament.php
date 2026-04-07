<?php
/**
 * Script direct pour récupérer un tournoi spécifique par son ID sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser les requêtes CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier si c'est une requête GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Vérifier si l'ID est fourni
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'ID de tournoi non valide']);
    exit;
}

$tournoiId = (int)$_GET['id'];

try {
    // Inclure la fonction de chargement des variables d'environnement
    require_once __DIR__ . '/env-loader.php';
    
    // Charger les variables d'environnement
    $env = loadEnvVars();
    
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
    
    // Récupérer le tournoi spécifique
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = ?");
    $stmt->execute([$tournoiId]);
    $tournament = $stmt->fetch();
    
    if (!$tournament) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Tournoi non trouvé']);
        exit;
    }
    
    // Traiter les données (décodage JSON pour teams et conversion types)
    $tournament['id'] = (int)$tournament['id'];
    $tournament['max_teams'] = (int)$tournament['max_teams'];
    $tournament['registered_teams'] = (int)$tournament['registered_teams'];
    
    // Décoder le champ JSON 'teams'
    if (!empty($tournament['teams'])) {
        $decodedTeams = json_decode($tournament['teams'], true);
        $tournament['teams'] = is_array($decodedTeams) ? $decodedTeams : [];
    } else {
        $tournament['teams'] = [];
    }
    
    // Renvoyer le tournoi
    header('Content-Type: application/json');
    echo json_encode($tournament);
    
} catch (PDOException $e) {
    error_log("Erreur PDO lors de la récupération du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur lors de la récupération du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
