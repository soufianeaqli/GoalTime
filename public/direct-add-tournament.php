<?php
/**
 * Script direct pour la création de tournois sans protection CSRF
 * Ce script ne passe pas par le framework Laravel mais se connecte directement à la base de données
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser les requêtes CORS via le script centralisé
require_once __DIR__ . '/cors-header.php';

// Vérifier si c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupérer les données (soit via JSON POST, soit via paramètre GET 'data')
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
    } else {
        $json = $_GET['data'] ?? '';
        $data = json_decode($json, true);
    }
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Valider les données obligatoires
    if (empty($data['name']) || empty($data['date'])) {
        throw new Exception('Données manquantes: name et date sont requis');
    }
    
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
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
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
        // On journalise mais on ne bloque pas si l'auto-réparation échoue (peut-être déjà fixée par un autre process)
        error_log("Tentative d'auto-réparation échouée : " . $e->getMessage());
    }
    
    // Préparer les données pour l'insertion
    $name = htmlspecialchars(trim($data['name']));
    $date = $data['date'];
    $description = isset($data['description']) ? htmlspecialchars(trim($data['description'])) : '';
    $format = isset($data['format']) ? htmlspecialchars(trim($data['format'])) : '';
    $entry_fee = isset($data['entry_fee']) ? htmlspecialchars(trim($data['entry_fee'])) : '';
    $max_teams = isset($data['max_teams']) ? (int)$data['max_teams'] : 16;
    if (isset($data['maxTeams'])) $max_teams = (int)$data['maxTeams']; // Support frontend alias
    
    $prize_pool = isset($data['prize_pool']) ? htmlspecialchars(trim($data['prize_pool'])) : '';
    if (isset($data['prizePool'])) $prize_pool = htmlspecialchars(trim($data['prizePool'])); // Support frontend alias
    
    $image = !empty($data['image']) ? $data['image'] : null;
    $registered_teams = 0;
    $teams = json_encode([]);
    $dateNow = date('Y-m-d H:i:s');
    
    // Insérer le tournoi dans la base de données
    $sql = "INSERT INTO tournaments (
        name, date, description, format, entry_fee, max_teams, prize_pool, image, registered_teams, teams, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        $name, $date, $description, $format, $entry_fee, $max_teams, $prize_pool, $image, $registered_teams, $teams, $dateNow, $dateNow
    ]);
    
    if (!$success) {
        throw new Exception("Échec de l'ajout du tournoi dans la base de données");
    }
    
    // Récupérer l'ID du tournoi nouvellement inséré
    $tournamentId = $pdo->lastInsertId();
    
    // Créer l'objet tournoi à renvoyer
    $tournament = [
        'id' => (int)$tournamentId,
        'name' => $name,
        'date' => $date,
        'description' => $description,
        'format' => $format,
        'entry_fee' => $entry_fee,
        'max_teams' => $max_teams,
        'prize_pool' => $prize_pool,
        'image' => $image,
        'registered_teams' => $registered_teams,
        'teams' => [],
        'created_at' => $dateNow,
        'updated_at' => $dateNow
    ];
    
    // Renvoyer une réponse de succès
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Tournoi créé avec succès',
        'tournament' => $tournament
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la création du tournoi: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la création du tournoi: ' . $e->getMessage()
    ]);
}
?>
