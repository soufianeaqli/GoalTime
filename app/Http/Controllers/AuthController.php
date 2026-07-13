<?php

namespace App\Http\Controllers;

use App\Models\AppUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Connecte un utilisateur.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors()
                ], 422);
            }

            $username = $request->input('username');
            $password = $request->input('password');

            // Rechercher l'utilisateur par nom d'utilisateur (insensible à la casse)
            $user = AppUser::whereRaw('LOWER(username) = ?', [strtolower($username)])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nom d\'utilisateur ou mot de passe incorrect'
                ], 401);
            }

            // Vérifier le mot de passe
            if (!$user->checkPassword($password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nom d\'utilisateur ou mot de passe incorrect'
                ], 401);
            }

            // Préparer les données utilisateur à retourner (sans le mot de passe)
            $userData = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'position' => $user->position,
                'city' => $user->city,
                'skill_level' => $user->skill_level,
                'role' => $user->role,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => $userData
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la connexion:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Inscrit un nouvel utilisateur.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string|unique:users,username',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'phone' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Créer l'utilisateur
            $user = AppUser::create([
                'name' => $request->input('name', $request->input('username')),
                'username' => $request->input('username'),
                'email' => $request->input('email'),
                'password' => $request->input('password'),
                'phone' => $request->input('phone'),
                'position' => $request->input('position'),
                'city' => $request->input('city'),
                'skill_level' => $request->input('skill_level'),
                'role' => 'user',
            ]);

            // Préparer les données utilisateur à retourner (sans le mot de passe)
            $userData = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'position' => $user->position,
                'city' => $user->city,
                'skill_level' => $user->skill_level,
                'role' => $user->role,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'user' => $userData
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'inscription:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifie si un nom d'utilisateur est disponible.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkUsername(Request $request)
    {
        try {
            $username = $request->input('username');

            if (!$username) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nom d\'utilisateur non fourni'
                ], 400);
            }

            $exists = AppUser::whereRaw('LOWER(username) = ?', [strtolower($username)])->exists();

            return response()->json([
                'success' => true,
                'available' => !$exists
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification du nom d\'utilisateur:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du nom d\'utilisateur: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $userId = $request->input('id');
            $user = AppUser::find($userId);

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
            }

            $user->update($request->only(['name', 'username', 'email', 'phone']));

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour profil: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        try {
            $userId = $request->input('id');
            $user = AppUser::find($userId);

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Utilisateur non trouvé'], 404);
            }

            if (!$user->checkPassword($request->input('current_password'))) {
                return response()->json(['success' => false, 'message' => 'Mot de passe actuel incorrect'], 401);
            }

            $user->password = $request->input('new_password');
            $user->save();

            return response()->json(['success' => true, 'message' => 'Mot de passe mis à jour']);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour mdp: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $email = $googleUser->getEmail();

            if (!$email) {
                return redirect(config('app.frontend_url', 'http://localhost:3000') . '/login?error=google_no_email');
            }

            $user = AppUser::where('email', $email)->first();

            if (!$user) {
                $baseUsername = Str::slug(explode('@', $email)[0]);
                $username = $baseUsername;
                $counter = 1;
                while (AppUser::whereRaw('LOWER(username) = ?', [strtolower($username)])->exists()) {
                    $username = $baseUsername . $counter;
                    $counter++;
                }

                $user = AppUser::create([
                    'name' => $googleUser->getName() ?? $username,
                    'username' => $username,
                    'email' => $email,
                    'password' => Str::random(32),
                    'phone' => '',
                    'role' => 'user',
                ]);
            }

            $userData = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];

            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $params = http_build_query(['user' => json_encode($userData)]);

            return redirect($frontendUrl . '/auth/google/callback?' . $params);
        } catch (\Exception $e) {
            Log::error('Erreur Google OAuth: ' . $e->getMessage(), [
                'class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect($frontendUrl . '/login?error=google_failed&detail=' . urlencode($e->getMessage() ?: get_class($e)));
        }
    }
}
