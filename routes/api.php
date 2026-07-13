<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TerrainController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\MatchAnnouncementController;
use App\Http\Controllers\MatchMessageController;
use App\Http\Controllers\MatchNotificationController;
use App\Http\Controllers\PlayerProfileController;
use App\Http\Controllers\ReputationController;
use App\Http\Controllers\SmartTournamentController;

Route::middleware(['api'])->group(function () {

    // Auth
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/check-username', [AuthController::class, 'checkUsername']);

    // User profile
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/password', [AuthController::class, 'updatePassword']);

    // Terrains
    Route::get('/terrains', [TerrainController::class, 'index']);
    Route::get('/terrains/{terrain}', [TerrainController::class, 'show']);
    Route::post('/terrains', [TerrainController::class, 'store']);
    Route::post('/terrains/{terrain}', [TerrainController::class, 'update']);
    Route::delete('/terrains/{terrain}', [TerrainController::class, 'destroy']);

    // Image upload
    Route::post('/upload-image', [ImageController::class, 'upload']);

    // Reservations
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'index']);
        Route::get('/user/{username}', [ReservationController::class, 'getUserReservations']);
        Route::post('/', [ReservationController::class, 'store']);
        Route::post('/check-availability', [ReservationController::class, 'checkAvailability']);
        Route::put('/{id}', [ReservationController::class, 'update']);
        Route::delete('/{id}', [ReservationController::class, 'destroy']);
        Route::put('/{id}/pay', [ReservationController::class, 'markAsPaid']);
    });

    // Contacts
    Route::post('/contacts', [ContactController::class, 'store']);
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::put('/contacts/{id}/read', [ContactController::class, 'markAsRead']);
    Route::delete('/contacts/{id}', [ContactController::class, 'destroy']);

    // Match Announcements (Trouver des joueurs)
    Route::get('/announcements', [MatchAnnouncementController::class, 'index']);
    Route::get('/announcements/my', [MatchAnnouncementController::class, 'myAnnouncements']);
    Route::post('/announcements', [MatchAnnouncementController::class, 'store']);
    Route::get('/announcements/{id}', [MatchAnnouncementController::class, 'show']);
    Route::put('/announcements/{id}', [MatchAnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [MatchAnnouncementController::class, 'destroy']);
    Route::post('/announcements/{id}/join', [MatchAnnouncementController::class, 'join']);
    Route::post('/announcements/{id}/leave', [MatchAnnouncementController::class, 'leave']);
    Route::post('/announcements/{id}/kick', [MatchAnnouncementController::class, 'kick']);

    // Match Messages
    Route::get('/announcements/{announcementId}/messages', [MatchMessageController::class, 'index']);
    Route::post('/announcements/{announcementId}/messages', [MatchMessageController::class, 'store']);
    Route::post('/announcements/{announcementId}/messages/read', [MatchMessageController::class, 'markRead']);

    // Notifications
    Route::get('/notifications', [MatchNotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [MatchNotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [MatchNotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [MatchNotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [MatchNotificationController::class, 'destroy']);

    // Player Profiles
    Route::get('/players/{userId}/profile', [PlayerProfileController::class, 'show']);
    Route::put('/players/{userId}/profile', [PlayerProfileController::class, 'update']);
    Route::get('/players/leaderboard', [PlayerProfileController::class, 'leaderboard']);

    // Reputation System
    Route::post('/reputation/review', [ReputationController::class, 'storeReview']);
    Route::get('/reputation/pending-reviews', [ReputationController::class, 'getPendingReviews']);
    Route::get('/reputation/leaderboard', [ReputationController::class, 'getLeaderboard']);
    Route::post('/reputation/complete-match', [ReputationController::class, 'completeMatch']);
    Route::get('/reputation/{userId}', [ReputationController::class, 'show']);
    Route::get('/reputation/{userId}/reviews', [ReputationController::class, 'getReviews']);

    // Smart Tournaments
    Route::get('/smart-tournaments', [SmartTournamentController::class, 'index']);
    Route::get('/smart-tournaments/{id}', [SmartTournamentController::class, 'show']);
    Route::post('/smart-tournaments', [SmartTournamentController::class, 'store']);
    Route::put('/smart-tournaments/{id}', [SmartTournamentController::class, 'update']);
    Route::delete('/smart-tournaments/{id}', [SmartTournamentController::class, 'destroy']);
    Route::post('/smart-tournaments/{id}/register-team', [SmartTournamentController::class, 'registerTeam']);
    Route::post('/smart-tournaments/{id}/generate-groups', [SmartTournamentController::class, 'generateGroups']);
    Route::post('/smart-tournaments/{id}/generate-fixtures', [SmartTournamentController::class, 'generateFixtures']);
    Route::post('/smart-tournaments/{id}/generate-knockout', [SmartTournamentController::class, 'generateKnockout']);
    Route::put('/smart-tournaments/{id}/status', [SmartTournamentController::class, 'updateTournamentStatus']);
    Route::post('/smart-tournaments/{id}/close-registration', [SmartTournamentController::class, 'closeRegistration']);
    Route::put('/smart-tournaments/{tournamentId}/matches/{matchId}/result', [SmartTournamentController::class, 'updateMatchResult']);
    Route::get('/smart-tournaments/{id}/standings', [SmartTournamentController::class, 'getStandings']);
    Route::get('/smart-tournaments/{id}/matches', [SmartTournamentController::class, 'getMatches']);
    Route::post('/smart-tournaments/{id}/groups', [SmartTournamentController::class, 'storeGroup']);
    Route::delete('/smart-tournaments/{id}/groups/{groupId}', [SmartTournamentController::class, 'destroyGroup']);
    Route::post('/smart-tournaments/{id}/matches', [SmartTournamentController::class, 'storeMatch']);
    Route::delete('/smart-tournaments/{id}/matches/{matchId}', [SmartTournamentController::class, 'destroyMatch']);
    Route::post('/smart-tournaments/{id}/standings', [SmartTournamentController::class, 'storeStanding']);
    Route::post('/smart-tournaments/{id}/generate-round', [SmartTournamentController::class, 'generateKnockoutRound']);
});
