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
            $trimmedLine = trim($line);
            if (empty($trimmedLine) || strpos($trimmedLine, '#') === 0) continue;
            
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                // Retirer les guillemets si présents
                if (preg_match('/^"(.+)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.+)'$/", $value, $matches)) {
                    $value = $matches[1];
                }
                
                // Remplacement de variables ${VAR}
                if (preg_match('/\${(.+)}/', $value, $matches)) {
                    $varName = $matches[1];
                    if (isset($env[$varName])) {
                        $value = str_replace('${' . $varName . '}', $env[$varName], $value);
                    }
                }
                
                $env[$name] = $value;
                $_ENV[$name] = $value;
            }
        }
    }

    // Normalisation pour la production (Railway utilise souvent 127.0.0.1 au lieu de localhost sur certaines configs)
    if (isset($env['DB_HOST']) && ($env['DB_HOST'] === 'localhost' || $env['DB_HOST'] === '127.0.0.1')) {
        // En PHP PDO, 'localhost' essaie d'utiliser un socket Unix, '127.0.0.1' utilise TCP/IP.
        // TCP/IP est plus fiable dans les containers.
        $env['DB_HOST'] = '127.0.0.1';
    }
    
    return $env;
}