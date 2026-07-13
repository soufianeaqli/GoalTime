<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TournamentController extends Controller
{
    public function index()
    {
        $tournaments = Tournament::all();
        return response()->json($tournaments);
    }

    public function show(string $id)
    {
        $tournament = Tournament::findOrFail($id);
        return response()->json($tournament);
    }

    public function store(Request $request)
    {
        $role = $request->input('role');
        if ($role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'max_teams' => 'required|integer',
            'prize_pool' => 'required|string',
            'description' => 'required|string',
            'format' => 'required|string',
            'entry_fee' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tournament = Tournament::create([
            'name' => $request->name,
            'date' => $request->date,
            'max_teams' => $request->max_teams,
            'registered_teams' => 0,
            'prize_pool' => $request->prize_pool,
            'description' => $request->description,
            'format' => $request->format,
            'entry_fee' => $request->entry_fee,
            'teams' => [],
            'image' => $request->input('image'),
        ]);

        return response()->json(['success' => true, 'tournament' => $tournament], 201);
    }

    public function update(Request $request, string $id)
    {
        $role = $request->input('role');
        if ($role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $tournament = Tournament::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'date' => 'date',
            'max_teams' => 'integer',
            'prize_pool' => 'string',
            'description' => 'string',
            'format' => 'string',
            'entry_fee' => 'string',
            'teams' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tournament->update($request->all());
        return response()->json(['success' => true, 'tournament' => $tournament]);
    }

    public function destroy(string $id)
    {
        $tournament = Tournament::findOrFail($id);
        $tournament->delete();
        return response()->json(['success' => true]);
    }

    public function registerTeam(Request $request, string $id)
    {
        $tournament = Tournament::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'team_name' => 'required|string',
            'captain_name' => 'required|string',
            'phone_number' => 'required|string',
            'email' => 'required|email',
            'user_id' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($tournament->registered_teams >= $tournament->max_teams) {
            return response()->json(['success' => false, 'message' => 'Le tournoi est complet'], 422);
        }

        $teams = $tournament->teams ?? [];
        if (collect($teams)->contains('email', $request->email)) {
            return response()->json(['success' => false, 'message' => 'Vous êtes déjà inscrit à ce tournoi'], 422);
        }

        $teams[] = [
            'id' => time(),
            'name' => $request->team_name,
            'captain' => $request->captain_name,
            'phone' => $request->phone_number,
            'email' => $request->email,
            'user_id' => $request->input('user_id'),
            'registration_date' => now()->toDateString(),
        ];

        $tournament->teams = $teams;
        $tournament->registered_teams = count($teams);
        $tournament->save();

        return response()->json(['success' => true, 'tournament' => $tournament]);
    }

    public function unregisterTeam(Request $request, string $id)
    {
        $tournament = Tournament::findOrFail($id);
        $userId = $request->input('user_id');

        $teams = $tournament->teams ?? [];
        $team = collect($teams)->firstWhere('user_id', $userId);

        if (!$team) {
            return response()->json(['success' => false, 'message' => 'Équipe non trouvée'], 404);
        }

        $filteredTeams = array_filter($teams, function ($t) use ($userId) {
            return $t['user_id'] != $userId;
        });

        $tournament->teams = array_values($filteredTeams);
        $tournament->registered_teams = count($filteredTeams);
        $tournament->save();

        return response()->json(['success' => true, 'tournament' => $tournament]);
    }
}
