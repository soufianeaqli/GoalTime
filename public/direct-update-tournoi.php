<?php
/**
 * Script direct pour la mise à jour de tournois sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

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

    $tournoiId = (int)$data['id'];

    // Charger les variables d'environnement via le script centralisé
    require_once __DIR__ . '/env-loader.php';
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

    // AUTO-RÉPARATION DE LA BASE DE DONNÉES
    // Vérifier si la colonne 'image' existe, sinon l'ajouter
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM tournaments LIKE 'image'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE tournaments ADD COLUMN image VARCHAR(255) NULL AFTER entry_fee");
        }
        
        // Vérifier également prize_pool (juste au cas où)
        $stmt = $pdo->query("SHOW COLUMNS FROM tournaments LIKE 'prize_pool'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE tournaments ADD COLUMN prize_pool VARCHAR(255) NULL AFTER registered_teams");
        }
    } catch (Exception $e) {
        // On journalise mais on ne bloque pas si l'auto-réparation échoue
        error_log("Tentative d'auto-réparation échouée : " . $e->getMessage());
    }

    // Vérifier que le tournoi existe
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = ?");
    $stmt->execute([$tournoiId]);
    $tournoi = $stmt->fetch();
    
    if (!$tournoi) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Tournoi non trouvé']);
        exit;
    }

    // Préparer les données à mettre à jour
    $updates = [];
    $params = [];

    // Table de correspondance (Mapping) flexible pour les champs frontend
    $fieldMappings = [
        'name' => 'name',
        'date' => 'date',
        'description' => 'description',
        'format' => 'format',
        'entry_fee' => 'entry_fee',
        'entryFee' => 'entry_fee',
        'max_teams' => 'max_teams',
        'maxTeams' => 'max_teams',
        'prize_pool' => 'prize_pool',
        'prizePool' => 'prize_pool',
        'image' => 'image'
    ];

    foreach ($fieldMappings as $frontendField => $dbField) {
        if (isset($data[$frontendField])) {
            // Éviter de rajouter deux fois le même champ DB si les deux noms sont présents
            if (!in_array("$dbField = ?", $updates)) {
                $updates[] = "$dbField = ?";
                $params[] = $data[$frontendField];
            }
        }
    }

    if (empty($updates)) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Aucune donnée à mettre à jour']);
        exit;
    }

    // Ajouter la date de mise à jour
    $updates[] = "updated_at = NOW()";

    // Ajouter l'ID à la fin des paramètres pour la clause WHERE
    $params[] = $tournoiId;

    // Mettre à jour le tournoi
    $sql = "UPDATE tournaments SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Récupérer le tournoi mis à jour
    $stmt = $pdo->prepare("SELECT * FROM tournaments WHERE id = ?");
    $stmt->execute([$tournoiId]);
    $updatedTournament = $stmt->fetch();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Tournoi mis à jour avec succès',
        'tournament' => $updatedTournament
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
?>