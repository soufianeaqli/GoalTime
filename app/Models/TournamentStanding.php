<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TournamentStanding extends Model {
    protected $table = 'tournament_standings';
    protected $fillable = [
        'tournament_id', 'team_id', 'group_id',
        'played', 'wins', 'draws', 'losses',
        'goals_for', 'goals_against', 'goal_difference', 'points',
        'clean_sheets', 'yellow_cards', 'red_cards',
        'win_percentage', 'avg_goals', 'position',
    ];
    protected $casts = [
        'played' => 'integer', 'wins' => 'integer', 'draws' => 'integer', 'losses' => 'integer',
        'goals_for' => 'integer', 'goals_against' => 'integer', 'goal_difference' => 'integer',
        'points' => 'integer', 'clean_sheets' => 'integer',
        'yellow_cards' => 'integer', 'red_cards' => 'integer',
        'win_percentage' => 'float', 'avg_goals' => 'float', 'position' => 'integer',
    ];
    public function tournament() { return $this->belongsTo(SmartTournament::class, 'tournament_id'); }
    public function team() { return $this->belongsTo(TournamentTeam::class, 'team_id'); }
    public function group() { return $this->belongsTo(TournamentGroup::class, 'group_id'); }
}
