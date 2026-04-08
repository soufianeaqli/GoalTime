<?php
/**
 * Script direct pour gérer les messages de contact sans CSRF
 * Connexion directe à la base de données (sans passer par Laravel)
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir les en-têtes CORS via le fichier centralisé
require_once __DIR__ . '/cors-header.php';

// Charger les variables d'environnement
require_once __DIR__ . '/env-loader.php';
$env = loadEnvVars();

// Connexion à la base de données
function getDB($env) {
    $host   = $env['DB_HOST']     ?? '127.0.0.1';
    $port   = $env['DB_PORT']     ?? '3306';
    $dbname = $env['DB_DATABASE'] ?? 'laravel';
    $user   = $env['DB_USERNAME'] ?? 'root';
    $pass   = $env['DB_PASSWORD'] ?? '';

    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    return new PDO($dsn, $user, $pass, $options);
}

$action = $_REQUEST['action'] ?? '';

try {
    $pdo = getDB($env);

    switch ($action) {

        // ── Ajouter un message de contact ───────────────────────────────────
        case 'add':
            $jsonData = $_GET['data'] ?? null;
            if (!$jsonData) {
                // Essayer de lire depuis le body JSON
                $jsonData = file_get_contents('php://input');
                $data = json_decode($jsonData, true);
            } else {
                $data = json_decode(urldecode($jsonData), true);
            }

            if (empty($data)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Données manquantes']);
                exit;
            }

            $name    = trim($data['name']    ?? '');
            $email   = trim($data['email']   ?? '');
            $subject = trim($data['subject'] ?? '');
            $message = trim($data['message'] ?? '');

            if (!$name || !$email || !$message) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Champs requis manquants (name, email, message)']);
                exit;
            }

            $stmt = $pdo->prepare(
                "INSERT INTO contact_messages (name, email, subject, message, is_read, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 0, NOW(), NOW())"
            );
            $stmt->execute([$name, $email, $subject, $message]);
            $newId = $pdo->lastInsertId();

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Message envoyé avec succès',
                'data'    => ['id' => $newId]
            ]);
            break;

        // ── Récupérer tous les messages ─────────────────────────────────────
        case 'get':
            $stmt = $pdo->query(
                "SELECT id, name, email, subject, message, is_read, created_at
                 FROM contact_messages
                 ORDER BY created_at DESC"
            );
            $messages = $stmt->fetchAll();

            // Convertir les types
            foreach ($messages as &$msg) {
                $msg['id']      = (int)$msg['id'];
                $msg['is_read'] = (bool)$msg['is_read'];
            }
            unset($msg);

            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'data' => $messages]);
            break;

        // ── Marquer un message comme lu ─────────────────────────────────────
        case 'mark-read':
            $id = (int)($_REQUEST['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID non fourni']);
                exit;
            }

            $stmt = $pdo->prepare(
                "UPDATE contact_messages SET is_read = 1, updated_at = NOW() WHERE id = ?"
            );
            $stmt->execute([$id]);

            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Message marqué comme lu']);
            break;

        // ── Supprimer un message ─────────────────────────────────────────────
        case 'delete':
            $id = (int)($_REQUEST['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID non fourni']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM contact_messages WHERE id = ?");
            $stmt->execute([$id]);

            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Message supprimé']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
            break;
    }

} catch (PDOException $e) {
    error_log('PDO Error in direct-contact.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in direct-contact.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}