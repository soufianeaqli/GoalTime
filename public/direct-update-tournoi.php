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
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

    // Charger les variables d'environnement via le script centralisé
    require_once __DIR__ . '/env-loader.php';
    $env = loadEnvVars();
    
    try {
        // Récupérer les données JSON
        $jsonInput = file_get_contents('php://input');
        $data = json_decode($jsonInput, true);
        
        if (!$data || empty($data['id'])) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Données invalides ou ID manquant']);
            exit;
        }

        $tournoiId = $data['id'];

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
        if (!$stmt->fetch()) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Tournoi non trouvé']);
            exit;
        }

    // Préparer les données à mettre à jour
    $updates = [];
    $params = [];

    // Mapper les champs du frontend vers les noms de colonnes de la base de données
    $fieldMappings = [
        'name' => 'name',
        'date' => 'date',
        'maxTeams' => 'max_teams',
        'prizePool' => 'prize_pool',
        'description' => 'description',
        'format' => 'format',
        'entryFee' => 'entry_fee',
        'image' => 'image'
    ];

    foreach ($fieldMappings as $frontendField => $dbField) {
        if (isset($data[$frontendField])) {
            $updates[] = "$dbField = ?";
            $params[] = $data[$frontendField];
        }
    }

    // Ajouter la date de mise à jour
    $updates[] = "updated_at = NOW()";

    // Ajouter l'ID à la fin des paramètres
    $params[] = $tournoiId;

    // Mettre à jour le tournoi
    $sql = "UPDATE tournaments SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Récupérer le tournoi mis à jour
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = ?");
    $stmt->execute([$tournoiId]);
    $tournamentData = $stmt->fetch();

    // Renvoyer le tournoi mis à jour (On l'appelle 'tournament' pour correspondre au frontend)
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Tournoi mis à jour avec succès',
        'tournament' => $tournamentData
    ]);

} catch (PDOException $e) {
    error_log("Erreur PDO lors de la mise à jour du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur lors de la mise à jour du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
} 