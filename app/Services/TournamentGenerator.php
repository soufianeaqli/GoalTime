<?php
namespace App\Services;

use App\Models\SmartTournament;
use App\Models\TournamentTeam;
use App\Models\TournamentGroup;
use App\Models\TournamentMatch;
use App\Models\TournamentStanding;

class TournamentGenerator
{
    public function generateGroups(SmartTournament $tournament)
    {
        $teams = $tournament->teams()->where('status', 'registered')->get();
        $numGroups = $tournament->num_groups;
        
        // Create groups
        $groups = [];
        $letters = ['A','B','C','D','E','F','G','H'];
        for ($i = 0; $i < $numGroups; $i++) {
            $g = TournamentGroup::create([
                'tournament_id' => $tournament->id,
                'name' => 'Groupe ' . $letters[$i],
                'sort_order' => $i,
            ]);
            $groups[] = $g;
        }
        
        // Shuffle teams randomly
        $shuffled = $teams->shuffle()->toArray();
        
        // Distribute teams evenly across groups
        foreach ($shuffled as $index => $teamData) {
            $groupIndex = $index % $numGroups;
            TournamentTeam::where('id', $teamData['id'])->update(['group_id' => $groups[$groupIndex]->id]);
        }
        
        $tournament->update(['groups_generated' => true, 'status' => 'locked']);
        
        return $groups;
    }

    public function generateFixtures(SmartTournament $tournament)
    {
        $groups = $tournament->groups()->with('teams')->get();
        $matches = [];
        $matchDate = $tournament->start_date->copy();
        $matchTime = $tournament->match_start_time;
        $dailyLimit = $tournament->daily_match_limit;
        $breakMinutes = $tournament->break_minutes;
        $matchCount = 0;
        $dailyCount = 0;
        
        // Group stage: round-robin within each group
        foreach ($groups as $group) {
            $teams = $group->teams->toArray();
            $n = count($teams);
            if ($n < 2) continue;
            
            // Round-robin algorithm
            $roundRobin = $this->roundRobin($teams);
            $roundNum = 1;
            
            foreach ($roundRobin as $round) {
                foreach ($round as $pair) {
                    if ($dailyCount >= $dailyLimit) {
                        $matchDate->addDay();
                        $dailyCount = 0;
                        $matchTime = $tournament->match_start_time;
                    }
                    
                    $matches[] = TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'group_id' => $group->id,
                        'round' => 'group_' . $roundNum,
                        'round_number' => $roundNum,
                        'home_team_id' => $pair[0]['id'],
                        'away_team_id' => $pair[1]['id'],
                        'match_date' => $matchDate->toDateString(),
                        'match_time' => $matchTime,
                        'pitch_name' => $tournament->pitch_name,
                        'status' => 'scheduled',
                    ]);
                    
                    // Advance time
                    $totalMinutes = intval(substr($matchTime, 0, 2)) * 60 + intval(substr($matchTime, 3, 2));
                    $totalMinutes += $tournament->match_duration + $breakMinutes;
                    $hours = intdiv($totalMinutes, 60);
                    $mins = $totalMinutes % 60;
                    $matchTime = sprintf('%02d:%02d', $hours, $mins);
                    
                    $matchCount++;
                    $dailyCount++;
                }
                $roundNum++;
            }
        }
        
        // Create standings for each team
        foreach ($groups as $group) {
            foreach ($group->teams as $team) {
                TournamentStanding::create([
                    'tournament_id' => $tournament->id,
                    'team_id' => $team->id,
                    'group_id' => $group->id,
                ]);
            }
        }
        
        $tournament->update([
            'total_matches' => $matchCount,
        ]);
        
        return $matches;
    }

    public function generateKnockout(SmartTournament $tournament)
    {
        $groups = $tournament->groups()->with('standings')->get();
        
        // Get top N teams from each group (top 2)
        $qualified = [];
        foreach ($groups as $group) {
            $topTeams = $group->standings()
                ->orderByDesc('points')
                ->orderByDesc('goal_difference')
                ->orderByDesc('goals_for')
                ->take(2)
                ->get();
            foreach ($topTeams as $s) {
                $qualified[] = TournamentTeam::find($s->team_id);
            }
        }
        
        $n = count($qualified);
        if ($n < 2) return [];
        
        // Determine bracket rounds
        $bracketRounds = [];
        if ($n <= 2) {
            $bracketRounds = ['final'];
        } elseif ($n <= 4) {
            $bracketRounds = ['semi', 'final'];
        } elseif ($n <= 8) {
            $bracketRounds = ['quarter', 'semi', 'final'];
        } else {
            $bracketRounds = ['round_of_16', 'quarter', 'semi', 'final'];
        }
        
        // Generate knockout matches
        $knockoutTeams = $qualified;
        $matchDate = $tournament->start_date->copy()->addDays($tournament->num_groups * 2);
        $roundNum = 1;
        $dailyCount = 0;
        $matchTime = $tournament->match_start_time;
        
        for ($r = 0; $r < count($bracketRounds); $r++) {
            $roundName = $bracketRounds[$r];
            $nextRound = [];
            
            for ($i = 0; $i < count($knockoutTeams); $i += 2) {
                if ($i + 1 >= count($knockoutTeams)) {
                    // Bye
                    $nextRound[] = $knockoutTeams[$i];
                    continue;
                }
                
                if ($dailyCount >= $dailyLimit) {
                    $matchDate->addDay();
                    $dailyCount = 0;
                    $matchTime = $tournament->match_start_time;
                }
                
                TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round' => $roundName,
                    'round_number' => $roundNum,
                    'home_team_id' => $knockoutTeams[$i]->id,
                    'away_team_id' => $knockoutTeams[$i + 1]->id,
                    'match_date' => $matchDate->toDateString(),
                    'match_time' => $matchTime,
                    'pitch_name' => $tournament->pitch_name,
                    'status' => 'scheduled',
                ]);
                
                // Placeholder winners
                $nextRound[] = null;
                
                $totalMinutes = intval(substr($matchTime, 0, 2)) * 60 + intval(substr($matchTime, 3, 2));
                $totalMinutes += $tournament->match_duration + $breakMinutes;
                $hours = intdiv($totalMinutes, 60);
                $mins = $totalMinutes % 60;
                $matchTime = sprintf('%02d:%02d', $hours, $mins);
                
                $dailyCount++;
            }
            
            $knockoutTeams = $nextRound;
            $roundNum++;
        }
        
        $tournament->update(['bracket_generated' => true]);
    }

    public function updateStandings(SmartTournament $tournament, TournamentMatch $match)
    {
        if ($match->status !== 'finished' || $match->home_score === null || $match->away_score === null) return;
        
        $homeStanding = TournamentStanding::where('tournament_id', $tournament->id)
            ->where('team_id', $match->home_team_id)->first();
        $awayStanding = TournamentStanding::where('tournament_id', $tournament->id)
            ->where('team_id', $match->away_team_id)->first();
        
        if (!$homeStanding || !$awayStanding) return;
        
        $homeScore = $match->home_score;
        $awayScore = $match->away_score;
        
        // Update played
        $homeStanding->increment('played');
        $awayStanding->increment('played');
        
        // Goals
        $homeStanding->goals_for += $homeScore;
        $homeStanding->goals_against += $awayScore;
        $homeStanding->goal_difference = $homeStanding->goals_for - $homeStanding->goals_against;
        
        $awayStanding->goals_for += $awayScore;
        $awayStanding->goals_against += $homeScore;
        $awayStanding->goal_difference = $awayStanding->goals_for - $awayStanding->goals_against;
        
        // Clean sheets
        if ($awayScore === 0) $homeStanding->clean_sheets++;
        if ($homeScore === 0) $awayStanding->clean_sheets++;
        
        // Points and win/draw/loss
        $pointsW = $tournament->points_win;
        $pointsD = $tournament->points_draw;
        $pointsL = $tournament->points_loss;
        
        if ($homeScore > $awayScore) {
            $homeStanding->wins++;
            $homeStanding->points += $pointsW;
            $awayStanding->losses++;
            $awayStanding->points += $pointsL;
            $match->update('winner_team_id', $match->home_team_id);
        } elseif ($homeScore < $awayScore) {
            $awayStanding->wins++;
            $awayStanding->points += $pointsW;
            $homeStanding->losses++;
            $homeStanding->points += $pointsL;
            $match->update('winner_team_id', $match->away_team_id);
        } else {
            $homeStanding->draws++;
            $homeStanding->points += $pointsD;
            $awayStanding->draws++;
            $awayStanding->points += $pointsD;
        }
        
        // Win percentage
        $homeStanding->win_percentage = $homeStanding->played > 0 ? round(($homeStanding->wins / $homeStanding->played) * 100, 1) : 0;
        $awayStanding->win_percentage = $awayStanding->played > 0 ? round(($awayStanding->wins / $awayStanding->played) * 100, 1) : 0;
        
        // Avg goals
        $homeStanding->avg_goals = $homeStanding->played > 0 ? round($homeStanding->goals_for / $homeStanding->played, 1) : 0;
        $awayStanding->avg_goals = $awayStanding->played > 0 ? round($awayStanding->goals_for / $awayStanding->played, 1) : 0;
        
        $homeStanding->save();
        $awayStanding->save();
        
        // Sort standings within group
        $this->sortStandings($tournament, $match->group_id);
        
        // Update tournament stats
        $tournament->increment('completed_matches');
        $tournament->total_goals += $homeScore + $awayScore;
        $tournament->save();
        
        // If group match, check if knockout should be generated
        if ($match->group_id && !$tournament->bracket_generated) {
            $totalGroupMatches = TournamentMatch::where('tournament_id', $tournament->id)
                ->whereNotNull('group_id')->count();
            $finishedGroupMatches = TournamentMatch::where('tournament_id', $tournament->id)
                ->whereNotNull('group_id')->where('status', 'finished')->count();
            
            if ($finishedGroupMatches >= $totalGroupMatches && $tournament->format === 'group_knockout') {
                $this->generateKnockout($tournament);
            }
        }
        
        // If knockout match, advance winner
        if (!$match->group_id && $match->winner_team_id) {
            $this->advanceKnockoutWinner($tournament, $match);
        }
        
        // Check if tournament is finished
        $this->checkTournamentComplete($tournament);
    }

    public function advanceKnockoutWinner(SmartTournament $tournament, TournamentMatch $completedMatch)
    {
        $winnerId = $completedMatch->winner_team_id;
        if (!$winnerId) return;
        
        // Find next match where this team should play (winner of this match goes to next round)
        $nextRound = $this->getNextRound($completedMatch->round);
        if (!$nextRound) {
            // This was the final
            $tournament->update(['champion_team_id' => $winnerId, 'status' => 'finished']);
            $this->generateAwards($tournament);
            return;
        }
        
        // Find the next match in that round that needs a team
        $nextMatch = TournamentMatch::where('tournament_id', $tournament->id)
            ->where('round', $nextRound)
            ->where(function ($q) use ($winnerId) {
                $q->whereNull('home_team_id')->orWhereNull('away_team_id');
            })
            ->first();
        
        if ($nextMatch) {
            if (!$nextMatch->home_team_id) {
                $nextMatch->update('home_team_id', $winnerId);
            } else {
                $nextMatch->update('away_team_id', $winnerId);
            }
        }
    }

    public function generateAwards(SmartTournament $tournament)
    {
        $standings = $tournament->standings()->get();
        $matches = $tournament->matches()->where('status', 'finished')->get();
        
        // Champion
        if ($tournament->champion_team_id) {
            $champion = TournamentTeam::find($tournament->champion_team_id);
            TournamentAward::create([
                'tournament_id' => $tournament->id,
                'team_id' => $tournament->champion_team_id,
                'award_type' => 'champion',
                'title' => 'Champion',
                'icon' => '🏆',
            ]);
        }
        
        // Runner-up (final loser)
        $final = TournamentMatch::where('tournament_id', $tournament->id)
            ->where('round', 'final')->where('status', 'finished')->first();
        if ($final) {
            $runnerUpId = $final->home_team_id == $tournament->champion_team_id ? $final->away_team_id : $final->home_team_id;
            TournamentAward::create([
                'tournament_id' => $tournament->id,
                'team_id' => $runnerUpId,
                'award_type' => 'runner_up',
                'title' => 'Finaliste',
                'icon' => '🥈',
            ]);
        }
        
        // Best Fair Play (fewest cards)
        $bestFP = $standings->sortBy('yellow_cards')->sortBy('red_cards')->first();
        if ($bestFP) {
            TournamentAward::create([
                'tournament_id' => $tournament->id,
                'team_id' => $bestFP->team_id,
                'award_type' => 'fair_play',
                'title' => 'Fair Play',
                'icon' => '🤝',
            ]);
        }
    }

    private function sortStandings(SmartTournament $tournament, $groupId)
    {
        $standings = TournamentStanding::where('tournament_id', $tournament->id)
            ->where('group_id', $groupId)
            ->orderByDesc('points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();
        
        foreach ($standings as $index => $s) {
            $s->update(['position' => $index + 1]);
        }
    }

    private function roundRobin(array $teams): array
    {
        $n = count($teams);
        $list = array_values($teams);
        $rounds = [];
        
        if ($n % 2 !== 0) {
            $list[] = null;
            $n++;
        }
        
        $half = $n / 2;
        
        for ($round = 0; $round < $n - 1; $round++) {
            $roundPairs = [];
            for ($i = 0; $i < $half; $i++) {
                $home = $list[$i];
                $away = $list[$n - 1 - $i];
                if ($home && $away) {
                    $roundPairs[] = [$home, $away];
                }
            }
            $rounds[] = $roundPairs;
            
            // Rotate (keep first fixed)
            $last = array_pop($list);
            array_splice($list, 1, 0, [$last]);
        }
        
        return $rounds;
    }

    private function getNextRound(string $currentRound): ?string
    {
        $order = ['quarter' => 1, 'semi' => 2, 'final' => 3];
        $current = $order[$currentRound] ?? 0;
        foreach ($order as $name => $pos) {
            if ($pos === $current + 1) return $name;
        }
        return null;
    }

    private function checkTournamentComplete(SmartTournament $tournament)
    {
        $total = $tournament->total_matches;
        $completed = $tournament->completed_matches;
        
        if ($completed >= $total && $total > 0) {
            if ($tournament->format !== 'group_knockout' || $tournament->champion_team_id) {
                $tournament->update(['status' => 'finished']);
            }
        }
    }
}
