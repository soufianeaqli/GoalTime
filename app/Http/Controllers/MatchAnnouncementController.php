<?php

namespace App\Http\Controllers;

use App\Models\MatchAnnouncement;
use App\Models\MatchPlayer;
use App\Models\MatchMessage;
use Illuminate\Http\Request;

class MatchAnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = MatchAnnouncement::with(['creator', 'terrain', 'acceptedPlayers.user'])
            ->where('status', '!=', 'closed');

        if ($request->has('level') && $request->level !== '') {
            $query->where('level', $request->level);
        }

        if ($request->has('match_type') && $request->match_type !== '') {
            $query->where('match_type', $request->match_type);
        }

        if ($request->has('terrain_id') && $request->terrain_id !== '') {
            $query->where('terrain_id', $request->terrain_id);
        }

        if ($request->has('date') && $request->date !== '') {
            $query->where('match_date', $request->date);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $announcements = $query->orderBy('match_date', 'desc')
            ->orderBy('match_time', 'desc')
            ->paginate(12);

        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'terrain_id' => 'required|exists:terrains,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'match_date' => 'required|date|after_or_equal:today',
            'match_time' => 'required',
            'duration' => 'nullable|integer|min:30|max:180',
            'level' => 'required|in:debutant,intermediaire,avance',
            'players_needed' => 'required|integer|min:1|max:30',
            'price_per_player' => 'nullable|numeric|min:0',
            'match_type' => 'required|in:amical,competitif',
            'allow_comments' => 'nullable|boolean',
        ]);

        $validated['players_joined'] = 0;
        $validated['status'] = 'open';

        $announcement = MatchAnnouncement::create($validated);
        $announcement->load('creator', 'terrain');

        return response()->json($announcement, 201);
    }

    public function show(Request $request, $id)
    {
        $announcement = MatchAnnouncement::with(['creator', 'terrain', 'players.user', 'acceptedPlayers.user', 'messages.user'])
            ->findOrFail($id);

        $viewerId = $request->query('user_id');
        $isCaptain = $viewerId && $announcement->user_id == $viewerId;

        if (!$isCaptain) {
            $announcement->setRelation('acceptedPlayers', $announcement->acceptedPlayers->map(function ($player) {
                return [
                    'id' => $player->id,
                    'full_name' => $player->full_name ? substr($player->full_name, 0, 1) . '***' : null,
                    'position' => $player->position,
                    'user_id' => $player->user_id,
                    'status' => $player->status,
                    'user' => $player->user ? ['id' => $player->user->id, 'username' => $player->user->username] : null,
                ];
            }));
        }

        return response()->json($announcement);
    }

    public function update(Request $request, $id)
    {
        $announcement = MatchAnnouncement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'match_date' => 'sometimes|date',
            'match_time' => 'sometimes',
            'duration' => 'nullable|integer|min:30|max:180',
            'level' => 'sometimes|in:debutant,intermediaire,avance',
            'players_needed' => 'sometimes|integer|min:1|max:30',
            'price_per_player' => 'nullable|numeric|min:0',
            'match_type' => 'sometimes|in:amical,competitif',
            'allow_comments' => 'nullable|boolean',
            'status' => 'sometimes|in:open,full,closed',
        ]);

        $announcement->update($validated);
        $announcement->load('creator', 'terrain');

        return response()->json($announcement);
    }

    public function destroy($id)
    {
        $announcement = MatchAnnouncement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Annonce supprimée']);
    }

    public function join(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'position' => 'nullable|string|max:50',
        ]);

        $announcement = MatchAnnouncement::findOrFail($id);

        if ($announcement->user_id == $validated['user_id']) {
            return response()->json(['message' => 'Vous êtes le capitaine de cette annonce'], 422);
        }

        if ($announcement->players_joined >= $announcement->players_needed) {
            return response()->json(['message' => 'Annonce complète'], 422);
        }

        $existing = MatchPlayer::where('announcement_id', $id)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Vous êtes déjà inscrit dans cette annonce'], 422);
        }

        $player = MatchPlayer::create([
            'announcement_id' => $id,
            'user_id' => $validated['user_id'],
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'],
            'status' => 'accepted',
            'position' => $validated['position'] ?? null,
        ]);

        $announcement->increment('players_joined');

        if ($announcement->players_joined >= $announcement->players_needed) {
            $announcement->update(['status' => 'full']);
        }

        $player->load('user');

        return response()->json($player, 201);
    }

    public function leave(Request $request, $id)
    {
        $player = null;

        if ($request->player_id) {
            $player = MatchPlayer::where('announcement_id', $id)
                ->where('id', $request->player_id)
                ->where('user_id', $request->user_id)
                ->first();
        } else {
            $player = MatchPlayer::where('announcement_id', $id)
                ->where('user_id', $request->user_id)
                ->first();
        }

        if (!$player) {
            return response()->json(['message' => 'Joueur non trouvé'], 404);
        }

        $player->delete();

        $announcement = MatchAnnouncement::findOrFail($id);
        $announcement->decrement('players_joined');

        if ($announcement->status === 'full') {
            $announcement->update(['status' => 'open']);
        }

        return response()->json(['message' => 'Joueur retiré de l\'annonce']);
    }

    public function kick(Request $request, $id)
    {
        $announcement = MatchAnnouncement::findOrFail($id);

        if ($announcement->user_id != $request->user_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $player = MatchPlayer::where('announcement_id', $id)
            ->where('id', $request->player_id)
            ->first();

        if (!$player) {
            return response()->json(['message' => 'Joueur non trouvé'], 404);
        }

        $player->delete();
        $announcement->decrement('players_joined');

        if ($announcement->status === 'full') {
            $announcement->update(['status' => 'open']);
        }

        return response()->json(['message' => 'Joueur retiré de l\'annonce']);
    }

    public function myAnnouncements(Request $request)
    {
        $userId = $request->user_id;

        $created = MatchAnnouncement::with(['terrain', 'acceptedPlayers.user'])
            ->where('user_id', $userId)
            ->orderBy('match_date', 'desc')
            ->get();

        $joined = MatchAnnouncement::with(['creator', 'terrain'])
            ->whereHas('acceptedPlayers', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('user_id', '!=', $userId)
            ->orderBy('match_date', 'desc')
            ->get();

        return response()->json([
            'created' => $created,
            'joined' => $joined,
        ]);
    }
}
