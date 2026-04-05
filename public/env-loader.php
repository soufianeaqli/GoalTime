<?php
/**
 * Fonction pour charger les variables d'environnement depuis le fichier .env
 * d'une manière plus tolérante que parse_ini_file()
 * 
 * @return array Les variables d'environnement chargées
 */
function loadEnvVars() {
    $envFile = __DIR__ . '/../.env';
    $env = [];
    
    // Définir les noms des variables essentielles que nous voulons récupérer du système si le .env n'existe pas
    $essentialVars = [
        'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 
        'CORS_ALLOWED_ORIGINS', 'APP_URL', 'APP_ENV', 'APP_KEY'
    ];
    
    // Charger d'abord les variables d'environnement système (utilisées par Railway)
    foreach ($essentialVars as $var) {
        $val = getenv($var);
        if ($val !== false) {
            $env[$var] = $val;
        }
    }
    
    // Si le fichier .env existe, il peut surcharger les variables système (utile pour le local)
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                if (preg_match('/^"(.+)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.+)'$/", $value, $matches)) {
                    $value = $matches[1];
                }
                
                if (preg_match('/\${(.+)}/', $value, $matches)) {
                    $varName = $matches[1];
                    if (isset($env[$varName])) {
                        $value = str_replace('${' . $varName . '}', $env[$varName], $value);
                    }
                }
                
                $env[$name] = $value;
                // Mettre aussi dans $_ENV pour la compatibilité
                $_ENV[$name] = $value;
            }
        }
    }
    
    return $env;
}