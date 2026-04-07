<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Gestion des CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier que la méthode de requête est GET ou POST (le frontend peut utiliser les deux selon les cas)
$method = $_SERVER['REQUEST_METHOD'];

// Récupérer les données selon la méthode
if ($method === 'POST') {
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);
    $tournoiId = $data['tournoi_id'] ?? null;
    $userId = $data['user_id'] ?? null;
} else {
    $tournoiId = $_GET['tournoi_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;
}

// Vérifier que les paramètres nécessaires sont fournis
if (!$tournoiId || !$userId) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants: tournoi_id et user_id sont requis']);
    exit;
}

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

    // Vérifier que le tournoi existe (La table Laravel est 'tournaments')
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = ?");
    $stmt->execute([$tournoiId]);
    $tournament = $stmt->fetch();
    
    if (!$tournament) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Tournoi non trouvé']);
        exit;
    }

    // Décoder les équipes existantes (stockées en JSON dans la colonne 'teams')
    $teams = !empty($tournament['teams']) ? json_decode($tournament['teams'], true) : [];
    if (!is_array($teams)) $teams = [];

    // Trouver et supprimer l'équipe de l'utilisateur
    $found = false;
    $newTeams = [];
    foreach ($teams as $team) {
        if ($team['user_id'] == $userId) {
            $found = true;
            continue; // On saute cette équipe pour la supprimer
        }
        $newTeams[] = $team;
    }
    
    if (!$found) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Vous n\'êtes pas inscrit à ce tournoi']);
        exit;
    }

    $registeredTeamsCount = count($newTeams);

    // Mettre à jour le tournoi dans la base de données
    $stmt = $pdo->prepare("UPDATE tournaments SET teams = ?, registered_teams = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([json_encode($newTeams), $registeredTeamsCount, $tournoiId]);
    
    // Renvoyer la réponse
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Désinscription réussie',
        'tournament' => [
            'id' => (int)$tournament['id'],
            'name' => $tournament['name'],
            'teams' => $newTeams,
            'registered_teams' => $registeredTeamsCount
        ]
    ]);

} catch (PDOException $e) {
    error_log("Erreur PDO lors de la désinscription: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur lors de la désinscription: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
} 