<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Gestion des CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier que la méthode de requête est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Inclure la fonction de chargement des variables d'environnement
require_once __DIR__ . '/env-loader.php';
$env = loadEnvVars();

try {
    // Récupérer les données JSON
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);
    
    if (!$data) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
        exit;
    }

    // Vérifier les champs requis
    $requiredFields = ['tournoi_id', 'teamName', 'captainName', 'phoneNumber', 'email', 'user_id'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => "Le champ '$field' est requis"]);
            exit;
        }
    }

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
    $stmt->execute([$data['tournoi_id']]);
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

    // Vérifier si l'utilisateur est déjà inscrit
    foreach ($teams as $team) {
        if ($team['user_id'] == $data['user_id'] || $team['email'] == $data['email']) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Vous êtes déjà inscrit à ce tournoi']);
            exit;
        }
    }

    // Vérifier si le tournoi est complet
    if (count($teams) >= $tournament['max_teams']) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Le tournoi est complet']);
        exit;
    }

    // Créer la nouvelle équipe
    $newTeam = [
        'id' => time(),
        'name' => $data['teamName'],
        'captain' => $data['captainName'],
        'email' => $data['email'],
        'phone' => $data['phoneNumber'],
        'user_id' => $data['user_id'],
        'registration_date' => date('Y-m-d')
    ];

    // Ajouter l'équipe à l'array
    $teams[] = $newTeam;
    $registeredTeamsCount = count($teams);

    // Mettre à jour le tournoi dans la base de données
    $stmt = $pdo->prepare("UPDATE tournaments SET teams = ?, registered_teams = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([json_encode($teams), $registeredTeamsCount, $data['tournoi_id']]);
    
    // Renvoyer la réponse
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Équipe inscrite avec succès',
        'tournament' => [
            'id' => (int)$tournament['id'],
            'name' => $tournament['name'],
            'teams' => $teams,
            'registered_teams' => $registeredTeamsCount
        ]
    ]);

} catch (PDOException $e) {
    error_log("Erreur PDO lors de l'inscription: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur lors de l'inscription: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
} 