<?php

namespace App\Http\Controllers;

use App\Models\SmartTournament;
use App\Models\TournamentTeam;
use App\Models\TournamentGroup;
use App\Models\TournamentMatch;
use App\Models\TournamentStanding;
use App\Services\TournamentGenerator;
use Illuminate\Http\Request;

class SmartTournamentController extends Controller
{
    protected $generator;

    public function __construct(TournamentGenerator $generator)
    {
        $this->generator = $generator;
    }

    public function index()
    {
        $tournaments = SmartTournament::with(['teams', 'groups', 'champion'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($tournaments);
    }

    public function show($id)
    {
        $tournament = SmartTournament::with([
            'organizer', 'teams', 'groups.teams', 'groups.standings.team',
            'matches.homeTeam', 'matches.awayTeam', 'matches.winner',
            'standings.team', 'awards.team', 'awards.user', 'champion',
        ])->findOrFail($id);
        return response()->json($tournament);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'city' => 'nullable|string',
            'pitch_name' => 'nullable|string',
            'num_teams' => 'required|integer|min:2|max:32',
            'num_groups' => 'required|integer|min:1|max:8',
            'teams_per_group' => 'required|integer|min:2|max:16',
            'match_duration' => 'required|integer|min:30|max:120',
            'points_win' => 'required|integer',
            'points_draw' => 'required|integer',
            'points_loss' => 'required|integer',
            'format' => 'required|in:group_knockout,knockout,round_robin,league,friendly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'match_start_time' => 'required|string',
            'daily_match_limit' => 'required|integer|min:1',
            'break_minutes' => 'required|integer|min:0',
            'logo' => 'nullable|string',
            'banner' => 'nullable|string',
            'organizer_id' => 'nullable|exists:users,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if (empty($validated['organizer_id']) && !empty($validated['user_id'])) {
            $validated['organizer_id'] = $validated['user_id'];
        }
        unset($validated['user_id']);

        $tournament = SmartTournament::create($validated);

        return response()->json([
            'success' => true,
            'tournament' => $tournament,
        ]);
    }

    public function registerTeam(Request $request, $id)
    {
        $tournament = SmartTournament::findOrFail($id);

        if (!$tournament->registration_open || $tournament->status === 'draft') {
            return response()->json(['error' => 'Les inscriptions ne sont pas ouvertes.'], 422);
        }

        if ($tournament->registered_teams_count >= $tournament->num_teams) {
            return response()->json(['error' => 'Le tournoi est complet.'], 422);
        }

        $validated = $request->validate([
            'team_name' => 'required|string|max:255',
            'captain_name' => 'required|string|max:255',
            'captain_phone' => 'nullable|string',
            'captain_id' => 'nullable|exists:users,id',
        ]);

        $team = TournamentTeam::create(array_merge($validated, [
            'tournament_id' => $id,
            'status' => 'registered',
        ]));

        $tournament->increment('registered_teams_count');

        return response()->json([
            'success' => true,
            'team' => $team,
        ]);
    }

    public function generateGroups($id)
    {
        $tournament = SmartTournament::findOrFail($id);

        if ($tournament->registered_teams_count < $tournament->num_teams) {
            return response()->json(['error' => "Il faut {$tournament->num_teams} équipes. Actuellement: {$tournament->registered_teams_count}"], 422);
        }

        $groups = $this->generator->generateGroups($tournament);

        return response()->json([
            'success' => true,
            'message' => 'Groupes générés avec succès.',
            'groups' => $groups,
        ]);
    }

    public function generateFixtures($id)
    {
        $tournament = SmartTournament::findOrFail($id);

        if (!$tournament->groups_generated) {
            return response()->json(['error' => 'Générez les groupes d\'abord.'], 422);
        }

        $matches = $this->generator->generateFixtures($tournament);

        return response()->json([
            'success' => true,
            'message' => 'Calendrier généré.',
            'matches_count' => count($matches),
        ]);
    }

    public function generateKnockout($id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $this->generator->generateKnockout($tournament);

        return response()->json([
            'success' => true,
            'message' => 'Phase finale générée.',
        ]);
    }

    public function updateMatchResult(Request $request, $tournamentId, $matchId)
    {
        $tournament = SmartTournament::findOrFail($tournamentId);
        $match = TournamentMatch::findOrFail($matchId);

        $validated = $request->validate([
            'home_score' => 'required|integer|min:0',
            'away_score' => 'required|integer|min:0',
        ]);

        $homeScore = $validated['home_score'];
        $awayScore = $validated['away_score'];

        if ($homeScore > $awayScore) {
            $validated['winner_team_id'] = $match->home_team_id;
        } elseif ($awayScore > $homeScore) {
            $validated['winner_team_id'] = $match->away_team_id;
        } else {
            return response()->json(['error' => 'Pas de match nul en knockout.'], 422);
        }

        $validated['status'] = 'finished';
        $match->update($validated);

        $loserTeamId = $validated['winner_team_id'] == $match->home_team_id ? $match->away_team_id : $match->home_team_id;
        TournamentTeam::where('id', $loserTeamId)->update(['is_eliminated' => true]);

        $tournament->increment('completed_matches');

        $remainingTeams = TournamentTeam::where('tournament_id', $tournamentId)
            ->where('is_eliminated', false)
            ->count();

        if ($remainingTeams <= 1 && $remainingTeams > 0) {
            $champion = TournamentTeam::where('tournament_id', $tournamentId)->where('is_eliminated', false)->first();
            $tournament->update(['status' => 'finished', 'champion_team_id' => $champion->id]);
            return response()->json(['success' => true, 'match' => $match->fresh(['homeTeam', 'awayTeam', 'winner']), 'champion' => $champion]);
        }

        return response()->json(['success' => true, 'match' => $match->fresh(['homeTeam', 'awayTeam', 'winner']), 'remaining_teams' => $remainingTeams]);
    }

    public function updateTournamentStatus(Request $request, $id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $validated = $request->validate(['status' => 'required|in:draft,registering,locked,in_progress,finished']);
        $tournament->update($validated);
        return response()->json(['success' => true, 'status' => $tournament->status]);
    }

    public function closeRegistration($id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $tournament->update(['registration_open' => false, 'status' => 'locked']);
        return response()->json(['success' => true]);
    }

    public function getStandings($id)
    {
        $standings = TournamentStanding::where('tournament_id', $id)
            ->with('team')
            ->orderBy('group_id')
            ->orderBy('position')
            ->get()
            ->groupBy('group_id');

        return response()->json($standings);
    }

    public function getMatches($id)
    {
        $matches = TournamentMatch::where('tournament_id', $id)
            ->with(['homeTeam', 'awayTeam', 'winner', 'group'])
            ->orderBy('match_date')
            ->orderBy('match_time')
            ->get();

        return response()->json($matches);
    }

    public function update(Request $request, $id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'city' => 'sometimes|nullable|string|max:100',
            'location' => 'sometimes|nullable|string|max:255',
            'pitch_name' => 'sometimes|nullable|string|max:255',
            'format' => 'sometimes|in:group_knockout,knockout,round_robin,league,friendly',
            'num_teams' => 'sometimes|integer|min:2',
            'start_date' => 'sometimes|nullable|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:draft,registering,locked,in_progress,finished',
        ]);
        $tournament->update($validated);
        return response()->json($tournament);
    }

    public function destroy($id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $tournament->delete();
        return response()->json(['success' => true]);
    }

    public function storeGroup(Request $request, $id)
    {
        $tournament = SmartTournament::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'team_ids' => 'required|array|min:2',
            'team_ids.*' => 'exists:tournament_teams,id',
        ]);

        $group = TournamentGroup::create([
            'tournament_id' => $id,
            'name' => $validated['name'],
            'sort_order' => $tournament->groups()->count(),
        ]);

        TournamentTeam::whereIn('id', $validated['team_ids'])->update(['group_id' => $group->id]);

        $tournament->update(['groups_generated' => true, 'status' => 'locked']);

        return response()->json(['success' => true, 'group' => $group->load('teams')]);
    }

    public function destroyGroup($id, $groupId)
    {
        TournamentTeam::where('group_id', $groupId)->update(['group_id' => null]);
        TournamentGroup::where('id', $groupId)->where('tournament_id', $id)->delete();

        $tournament = SmartTournament::findOrFail($id);
        if ($tournament->groups()->count() === 0) {
            $tournament->update(['groups_generated' => false]);
        }

        return response()->json(['success' => true]);
    }

    public function storeMatch(Request $request, $id)
    {
        $tournament = SmartTournament::findOrFail($id);

        $data = $request->all();
        if (empty($data['group_id'])) $data['group_id'] = null;

        $validated = \Validator::make($data, [
            'home_team_id' => 'required|exists:tournament_teams,id',
            'away_team_id' => 'required|exists:tournament_teams,id',
            'group_id' => 'nullable|exists:tournament_groups,id',
            'match_date' => 'required|date',
            'match_time' => 'required|string',
            'round' => 'nullable|string|max:255',
        ])->validate();

        if ($validated['home_team_id'] == $validated['away_team_id']) {
            return response()->json(['error' => 'Les deux équipes doivent être différentes.'], 422);
        }

        $match = TournamentMatch::create([
            'tournament_id' => $id,
            'home_team_id' => $validated['home_team_id'],
            'away_team_id' => $validated['away_team_id'],
            'group_id' => $validated['group_id'] ?? null,
            'match_date' => $validated['match_date'],
            'match_time' => $validated['match_time'],
            'round' => $validated['round'] ?: 'Général',
            'status' => 'scheduled',
        ]);

        $tournament->increment('total_matches');

        return response()->json(['success' => true, 'match' => $match->load(['homeTeam', 'awayTeam', 'group'])]);
    }

    public function destroyMatch($id, $matchId)
    {
        $match = TournamentMatch::where('id', $matchId)->where('tournament_id', $id)->firstOrFail();
        $tournament = SmartTournament::findOrFail($id);
        $tournament->decrement('total_matches');
        if ($match->status === 'finished') {
            $tournament->decrement('completed_matches');
        }
        $match->delete();
        return response()->json(['success' => true]);
    }

    public function storeStanding(Request $request, $id)
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:tournament_teams,id',
            'group_id' => 'required|exists:tournament_groups,id',
            'played' => 'required|integer|min:0',
            'won' => 'required|integer|min:0',
            'drawn' => 'required|integer|min:0',
            'lost' => 'required|integer|min:0',
            'goals_for' => 'required|integer|min:0',
            'goals_against' => 'required|integer|min:0',
            'points' => 'required|integer|min:0',
            'position' => 'nullable|integer|min:1',
        ]);

        $standing = TournamentStanding::updateOrCreate(
            ['tournament_id' => $id, 'team_id' => $validated['team_id'], 'group_id' => $validated['group_id']],
            [
                'played' => $validated['played'],
                'won' => $validated['won'],
                'drawn' => $validated['drawn'],
                'lost' => $validated['lost'],
                'goals_for' => $validated['goals_for'],
                'goals_against' => $validated['goals_against'],
                'goal_difference' => $validated['goals_for'] - $validated['goals_against'],
                'points' => $validated['points'],
                'position' => $validated['position'] ?? 0,
            ]
        );

        return response()->json(['success' => true, 'standing' => $standing->load('team')]);
    }

    public function generateKnockoutRound($id)
    {
        $tournament = SmartTournament::findOrFail($id);

        $availableTeams = TournamentTeam::where('tournament_id', $id)
            ->where('is_eliminated', false)
            ->where('status', 'registered')
            ->get();

        if ($availableTeams->count() < 2) {
            return response()->json(['error' => 'Il faut au moins 2 équipes non éliminées.'], 422);
        }

        $unfinishedMatches = TournamentMatch::where('tournament_id', $id)
            ->where('status', '!=', 'finished')
            ->count();

        if ($unfinishedMatches > 0) {
            return response()->json(['error' => 'Terminez tous les matchs du tour actuel d\'abord.'], 422);
        }

        $roundNumber = TournamentMatch::where('tournament_id', $id)->max('round_number') + 1;
        $totalTeams = $availableTeams->count();

        if ($totalTeams === 1) {
            $tournament->update(['status' => 'finished', 'champion_team_id' => $availableTeams->first()->id]);
            return response()->json(['success' => true, 'champion' => $availableTeams->first(), 'message' => 'Champion désigné !']);
        }

        if ($totalTeams % 2 !== 0) {
            $bye = $availableTeams->pop();
            $bye->update(['is_eliminated' => false]);
        }

        $shuffled = $availableTeams->shuffle()->toArray();
        $matches = [];

        for ($i = 0; $i < count($shuffled); $i += 2) {
            $roundLabel = $this->getRoundLabel($totalTeams, $roundNumber);
            $match = TournamentMatch::create([
                'tournament_id' => $id,
                'home_team_id' => $shuffled[$i]['id'],
                'away_team_id' => $shuffled[$i + 1]['id'],
                'round' => $roundLabel,
                'round_number' => $roundNumber,
                'match_date' => $tournament->start_date,
                'match_time' => $tournament->match_start_time,
                'status' => 'scheduled',
            ]);
            $matches[] = $match->load(['homeTeam', 'awayTeam']);
        }

        $tournament->increment('total_matches', count($matches));

        return response()->json(['success' => true, 'matches' => $matches, 'round' => $roundLabel ?? 'Tour ' . $roundNumber]);
    }

    private function getRoundLabel($totalTeams, $roundNumber)
    {
        if ($totalTeams <= 2) return 'Finale';
        if ($totalTeams <= 4) return 'Demi-finale';
        if ($totalTeams <= 8) return 'Quart de finale';
        if ($totalTeams <= 16) return 'Huitième de finale';
        return 'Tour ' . $roundNumber;
    }
}
