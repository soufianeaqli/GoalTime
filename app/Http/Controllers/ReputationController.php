<?php

namespace App\Http\Controllers;

use App\Models\PlayerReputation;
use App\Models\PlayerReview;
use App\Models\PlayerAchievement;
use App\Models\MatchAnnouncement;
use App\Models\MatchPlayer;
use App\Models\SmartTournament;
use App\Models\TournamentMatch;
use App\Models\TournamentTeam;
use Illuminate\Http\Request;

class ReputationController extends Controller
{
    public function getOrCreate($userId)
    {
        return PlayerReputation::firstOrCreate(
            ['user_id' => $userId],
            [
                'score' => 0,
                'level' => 'Low Reputation',
                'total_matches' => 0,
                'attendance_rate' => 0,
                'punctuality_rate' => 0,
                'payment_rate' => 0,
                'fair_play_rating' => 0,
                'communication_rating' => 0,
            ]
        );
    }

    public function show(Request $request, $userId)
    {
        $rep = $this->getOrCreate($userId);
        $user = \App\Models\User::find($userId);
        $achievements = PlayerAchievement::where('user_id', $userId)->orderByDesc('unlocked_at')->get();
        $recentReviews = PlayerReview::where('reviewed_id', $userId)
            ->with('reviewer')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'user' => $user ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone ?? null] : null,
            'reputation' => $rep,
            'achievements' => $achievements,
            'recent_reviews' => $recentReviews,
        ]);
    }

    public function storeReview(Request $request)
    {
        $validated = $request->validate([
            'announcement_id' => 'nullable|exists:match_announcements,id',
            'tournament_id' => 'nullable|exists:smart_tournaments,id',
            'reviewed_id' => 'required|exists:users,id',
            'attended' => 'required|boolean',
            'punctuality_rating' => 'required|integer|min:1|max:5',
            'paid' => 'required|boolean',
            'fair_play_rating' => 'required|integer|min:1|max:5',
            'communication_rating' => 'required|integer|min:1|max:5',
            'would_play_again' => 'required|in:definitely,maybe,no',
            'comment' => 'nullable|string|max:500',
        ]);

        if (empty($validated['announcement_id']) && empty($validated['tournament_id'])) {
            $validated['announcement_id'] = null;
        }

        $reviewerId = $request->input('reviewer_id');

        if ($reviewerId == $validated['reviewed_id']) {
            return response()->json(['error' => 'Vous ne pouvez pas vous évaluer vous-même.'], 422);
        }

        if (!empty($validated['announcement_id'])) {
            $announcement = MatchAnnouncement::findOrFail($validated['announcement_id']);
            $isParticipant = MatchPlayer::where('announcement_id', $validated['announcement_id'])
                ->where('user_id', $reviewerId)
                ->where('status', 'accepted')
                ->exists();
            $isCaptain = $announcement->user_id == $reviewerId;
            if (!$isParticipant && !$isCaptain) {
                return response()->json(['error' => 'Seuls les participants du match peuvent laisser un avis.'], 403);
            }
        }

        if (!empty($validated['tournament_id'])) {
            $hasCommonMatch = TournamentMatch::where('tournament_id', $validated['tournament_id'])
                ->where('status', 'finished')
                ->where(function ($q) use ($reviewerId) {
                    $q->whereHas('homeTeam', fn($q) => $q->where('captain_id', $reviewerId))
                      ->orWhereHas('awayTeam', fn($q) => $q->where('captain_id', $reviewerId));
                })
                ->where(function ($q) use ($validated) {
                    $q->whereHas('homeTeam', fn($q) => $q->where('captain_id', $validated['reviewed_id']))
                      ->orWhereHas('awayTeam', fn($q) => $q->where('captain_id', $validated['reviewed_id']));
                })
                ->exists();
            if (!$hasCommonMatch) {
                return response()->json(['error' => 'Vous devez avoir joué contre ce capitaine dans ce tournoi.'], 403);
            }
        }

        $dupCheck = PlayerReview::where('reviewer_id', $reviewerId)
            ->where('reviewed_id', $validated['reviewed_id']);
        if (!empty($validated['announcement_id'])) {
            $dupCheck->where('announcement_id', $validated['announcement_id']);
        } elseif (!empty($validated['tournament_id'])) {
            $dupCheck->where('tournament_id', $validated['tournament_id']);
        }
        if ($dupCheck->exists()) {
            return response()->json(['error' => 'Vous avez déjà évalué ce joueur pour ce match.'], 422);
        }

        $review = PlayerReview::create(array_merge($validated, [
            'reviewer_id' => $reviewerId,
        ]));

        $this->recalculate($validated['reviewed_id']);

        return response()->json([
            'success' => true,
            'review' => $review,
        ]);
    }

    public function getReviews(Request $request, $userId)
    {
        $reviews = PlayerReview::where('reviewed_id', $userId)
            ->with('reviewer')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($reviews);
    }

    public function getPendingReviews(Request $request)
    {
        $userId = $request->input('user_id');
        $reviewedIds = PlayerReview::where('reviewer_id', $userId)
            ->pluck('reviewed_id')
            ->toArray();

        $tournamentReviewedIds = PlayerReview::where('reviewer_id', $userId)
            ->whereNotNull('tournament_id')
            ->pluck('reviewed_id')
            ->toArray();

        $matches = MatchPlayer::where('user_id', $userId)
            ->where('status', 'accepted')
            ->whereHas('announcement', function ($q) {
                $q->where('match_date', '<', now()->toDateString());
            })
            ->with('announcement')
            ->get();

        $pending = [];
        foreach ($matches as $mp) {
            $announcementId = $mp->announcement_id;
            $peers = MatchPlayer::where('announcement_id', $announcementId)
                ->where('status', 'accepted')
                ->where('user_id', '!=', $userId)
                ->get();

            $captain = MatchAnnouncement::where('id', $announcementId)
                ->where('user_id', '!=', $userId)
                ->first();

            foreach ($peers as $peer) {
                if (!in_array($peer->user_id, $reviewedIds)) {
                    $pending[] = [
                        'announcement_id' => $announcementId,
                        'announcement_title' => $mp->announcement->title ?? 'Match',
                        'match_date' => $mp->announcement->match_date,
                        'user_id' => $peer->user_id,
                        'user_name' => $peer->full_name,
                    ];
                }
            }

            if ($captain && !in_array($captain->user_id, $reviewedIds)) {
                $pending[] = [
                    'announcement_id' => $announcementId,
                    'announcement_title' => $mp->announcement->title ?? 'Match',
                    'match_date' => $mp->announcement->match_date,
                    'user_id' => $captain->user_id,
                    'user_name' => $captain->creator->name ?? 'Capitaine',
                ];
            }
        }

        $myTeams = TournamentTeam::where('captain_id', $userId)->get();
        foreach ($myTeams as $team) {
            $finishedMatches = TournamentMatch::where('tournament_id', $team->tournament_id)
                ->where('status', 'finished')
                ->where(function ($q) use ($team) {
                    $q->where('home_team_id', $team->id)
                      ->orWhere('away_team_id', $team->id);
                })
                ->get();

            $tournament = $team->tournament;
            foreach ($finishedMatches as $tm) {
                $opponentTeamId = $tm->home_team_id == $team->id ? $tm->away_team_id : $tm->home_team_id;
                $opponentTeam = TournamentTeam::find($opponentTeamId);
                if ($opponentTeam && $opponentTeam->captain_id && !in_array($opponentTeam->captain_id, $tournamentReviewedIds)) {
                    $pending[] = [
                        'tournament_id' => $tm->tournament_id,
                        'announcement_title' => 'Tournoi: ' . ($tournament->name ?? 'Tournoi'),
                        'match_date' => $tm->match_date,
                        'user_id' => $opponentTeam->captain_id,
                        'user_name' => $opponentTeam->captain_name ?? 'Capitaine',
                    ];
                }
            }
        }

        $unique = [];
        $seen = [];
        foreach ($pending as $p) {
            $key = ($p['announcement_id'] ?? $p['tournament_id'] ?? '') . '-' . $p['user_id'];
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $p;
            }
        }

        return response()->json(['pending' => $unique]);
    }

    public function getLeaderboard()
    {
        $top = PlayerReputation::orderByDesc('score')
            ->limit(20)
            ->get()
            ->map(function ($rep) {
                $levelInfo = PlayerReputation::getLevel($rep->score);
                return [
                    'user_id' => $rep->user_id,
                    'score' => $rep->score,
                    'level' => $levelInfo['level'],
                    'badge' => $levelInfo['badge'],
                    'total_matches' => $rep->total_matches,
                    'attendance_rate' => $rep->attendance_rate,
                ];
            });

        return response()->json(['leaderboard' => $top]);
    }

    public function completeMatch(Request $request)
    {
        $validated = $request->validate([
            'announcement_id' => 'required|exists:match_announcements,id',
            'present_user_ids' => 'required|array',
            'absent_user_ids' => 'nullable|array',
        ]);

        $announcement = MatchAnnouncement::findOrFail($validated['announcement_id']);
        $allPlayers = MatchPlayer::where('announcement_id', $validated['announcement_id'])
            ->where('status', 'accepted')
            ->pluck('user_id')
            ->toArray();

        array_push($allPlayers, $announcement->user_id);

        foreach ($allPlayers as $uid) {
            $rep = $this->getOrCreate($uid);
            $rep->increment('total_matches');

            if (in_array($uid, $validated['present_user_ids'])) {
                $total = $rep->total_matches;
                $currentRate = $rep->attendance_rate;
                if ($total <= 1) {
                    $rep->attendance_rate = 100;
                } else {
                    $newRate = (($currentRate * ($total - 1)) + 100) / $total;
                    $rep->attendance_rate = round($newRate, 1);
                }

                $rep->punctuality_rate = min(100, $rep->punctuality_rate + 0.5);
                $rep->payment_rate = min(100, $rep->payment_rate + 0.3);
            } elseif (in_array($uid, $validated['absent_user_ids'] ?? [])) {
                $total = $rep->total_matches;
                $currentRate = $rep->attendance_rate;
                if ($total <= 1) {
                    $rep->attendance_rate = 0;
                } else {
                    $newRate = (($currentRate * ($total - 1))) / $total;
                    $rep->attendance_rate = round($newRate, 1);
                }
                $rep->punctuality_rate = max(0, $rep->punctuality_rate - 5);
            }

            $rep->score = PlayerReputation::calculateScore($rep);
            $levelInfo = PlayerReputation::getLevel($rep->score);
            $rep->level = $levelInfo['level'];
            $rep->is_elite = $rep->score >= 95;
            $rep->save();

            $this->checkAchievements($uid, $rep);
        }

        return response()->json(['success' => true, 'message' => 'Match terminé. Réputations mises à jour.']);
    }

    public function recalculate($userId)
    {
        $rep = $this->getOrCreate($userId);

        $reviews = PlayerReview::where('reviewed_id', $userId)->get();

        if ($reviews->count() > 0) {
            $rep->total_reviews = $reviews->count();
            $rep->positive_reviews = $reviews->filter(fn($r) => $r->would_play_again === 'definitely')->count();
            $rep->negative_reviews = $reviews->filter(fn($r) => $r->would_play_again === 'no')->count();

            $rep->fair_play_rating = round($reviews->avg('fair_play_rating'), 1);
            $rep->communication_rating = round($reviews->avg('communication_rating'), 1);

            foreach ($reviews as $review) {
                if (!$review->attended) {
                    $rep->attendance_rate = max(0, $rep->attendance_rate - 3);
                }
                if (!$review->paid) {
                    $rep->payment_rate = max(0, $rep->payment_rate - 5);
                }
            }
        }

        $rep->score = PlayerReputation::calculateScore($rep);
        $levelInfo = PlayerReputation::getLevel($rep->score);
        $rep->level = $levelInfo['level'];
        $rep->is_elite = $rep->score >= 95;
        $rep->save();

        $this->checkAchievements($userId, $rep);

        return $rep;
    }

    private function checkAchievements($userId, $rep)
    {
        $achievements = [
            'elite_player' => [
                'title' => 'Elite Player',
                'icon' => '🏆',
                'color' => 'text-yellow-500',
                'description' => 'Atteint un score de réputation de 95+',
                'condition' => $rep->score >= 95,
            ],
            'always_pays' => [
                'title' => 'Always Pays',
                'icon' => '💰',
                'color' => 'text-emerald-500',
                'description' => 'Toujours à jour sur les paiements',
                'condition' => $rep->payment_rate >= 98 && $rep->total_matches >= 3,
            ],
            'always_on_time' => [
                'title' => 'Always On Time',
                'icon' => '⏰',
                'color' => 'text-blue-500',
                'description' => 'Toujours ponctuel',
                'condition' => $rep->punctuality_rate >= 98 && $rep->total_matches >= 3,
            ],
            'fair_play' => [
                'title' => 'Fair Play',
                'icon' => '🤝',
                'color' => 'text-purple-500',
                'description' => 'Excellente conduite sur le terrain',
                'condition' => $rep->fair_play_rating >= 4.5 && $rep->total_reviews >= 3,
            ],
            'matches_100' => [
                'title' => '100 Matches',
                'icon' => '🔥',
                'color' => 'text-orange-500',
                'description' => 'A participé à 100 matchs',
                'condition' => $rep->total_matches >= 100,
            ],
            'team_player' => [
                'title' => 'Team Player',
                'icon' => '⚽',
                'color' => 'text-cyan-500',
                'description' => 'Joueur d\'équipe respecté',
                'condition' => $rep->positive_reviews >= 10 && $rep->negative_reviews === 0,
            ],
            'captain' => [
                'title' => 'Captain',
                'icon' => '👑',
                'color' => 'text-amber-500',
                'description' => 'Capitaine de match',
                'condition' => $rep->is_captain,
            ],
            'community_favorite' => [
                'title' => 'Community Favorite',
                'icon' => '⭐',
                'color' => 'text-pink-500',
                'description' => 'Adoré par la communauté',
                'condition' => $rep->positive_reviews >= 20,
            ],
        ];

        foreach ($achievements as $type => $ach) {
            if ($ach['condition']) {
                PlayerAchievement::updateOrCreate(
                    ['user_id' => $userId, 'achievement_type' => $type],
                    [
                        'title' => $ach['title'],
                        'icon' => $ach['icon'],
                        'color' => $ach['color'],
                        'description' => $ach['description'],
                        'unlocked_at' => now(),
                    ]
                );
            }
        }
    }
}
