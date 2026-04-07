<?php

/**
 * Script direct pour gérer l'authentification sans CSRF
 */

// Définir les en-têtes CORS
// Définir les en-têtes CORS via le fichier centralisé
require_once __DIR__ . '/cors-header.php';

// Inclure le bootstrap de Laravel pour avoir accès à l'application
require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Déterminer l'action à exécuter en fonction du paramètre 'action'
$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'login':
        // Connecter un utilisateur
        $controller = new App\Http\Controllers\NoCSRFController();
        $response = $controller->login($request);
        echo $response->getContent();
        break;

    case 'register':
        // Inscrire un utilisateur
        $controller = new App\Http\Controllers\NoCSRFController();
        $response = $controller->register($request);
        echo $response->getContent();
        break;

    case 'check-username':
        // Vérifier la disponibilité d'un nom d'utilisateur
        $controller = new App\Http\Controllers\NoCSRFController();
        $response = $controller->checkUsername($request);
        echo $response->getContent();
        break;
        
    case 'update-profile':
        // Mettre à jour le profil utilisateur
        $controller = new App\Http\Controllers\NoCSRFController();
        $response = $controller->updateUserProfile($request);
        echo $response->getContent();
        break;
        
    case 'update-password':
        // Mettre à jour le mot de passe utilisateur
        $controller = new App\Http\Controllers\NoCSRFController();
        $response = $controller->updateUserPassword($request);
        echo $response->getContent();
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
        break;
}

$kernel->terminate($request, $response); 