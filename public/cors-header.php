<?php
/**
 * Centralized CORS header management for direct PHP scripts
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://goal-time-fkhb.vercel.app'
];

// Check if the current origin is in the allowed list
// We trim any trailing slashes from the origin to compare correctly
$normalized_origin = rtrim($origin, '/');
$is_allowed = false;

foreach ($allowed_origins as $allowed) {
    if ($normalized_origin === rtrim($allowed, '/')) {
        $is_allowed = true;
        break;
    }
}

if ($is_allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Default to a safe allowed origin if not matched
    header('Access-Control-Allow-Origin: https://goal-time-fkhb.vercel.app');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN, Accept');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
