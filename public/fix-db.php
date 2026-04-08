<?php
/**
 * Script de réparation de la base de données
 * Ajoute la colonne 'image' manquante à la table 'tournaments'
 */

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS
require_once __DIR__ . '/cors-header.php';

// Env loader
require_once __DIR__ . '/env-loader.php';

try {
    $env = loadEnvVars();
    
    // Connexion
    $host = $env['DB_HOST'] ?? '127.0.0.1';
    $port = $env['DB_PORT'] ?? '3306';
    $dbname = $env['DB_DATABASE'] ?? 'laravel';
    $username = $env['DB_USERNAME'] ?? 'root';
    $password = $env['DB_PASSWORD'] ?? '';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>Réparation de la base de données</h1>";
    
    // 1. Vérifier si la colonne 'image' existe dans 'tournaments'
    $stmt = $pdo->query("SHOW COLUMNS FROM tournaments LIKE 'image'");
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        echo "<p>La colonne 'image' est manquante dans la table 'tournaments'. Ajout en cours...</p>";
        $pdo->exec("ALTER TABLE tournaments ADD COLUMN image VARCHAR(255) NULL AFTER entry_fee");
        echo "<p style='color: green;'><strong>Succès :</strong> La colonne 'image' a été ajoutée à la table 'tournaments'.</p>";
    } else {
        echo "<p style='color: blue;'>La colonne 'image' existe déjà dans la table 'tournaments'.</p>";
    }
    
    // 2. Vérifier d'autres colonnes potentiellement manquantes (par précaution)
    $stmt = $pdo->query("SHOW COLUMNS FROM tournaments LIKE 'prize_pool'");
    if (!$stmt->fetch()) {
        echo "<p>La colonne 'prize_pool' est manquante. Ajout en cours...</p>";
        $pdo->exec("ALTER TABLE tournaments ADD COLUMN prize_pool VARCHAR(255) NULL AFTER registered_teams");
        echo "<p style='color: green;'><strong>Succès :</strong> La colonne 'prize_pool' a été ajoutée.</p>";
    }

    echo "<p><a href='/'>Retour à l'accueil</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>Erreur :</strong> " . $e->getMessage() . "</p>";
}
?>
