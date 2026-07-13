<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TournamentMatch extends Model {
    protected $table = 'tournament_matches';
    protected $fillable = [
        'tournament_id', 'group_id', 'round', 'round_number',
        'home_team_id', 'away_team_id', 'home_score', 'away_score',
        'match_date', 'match_time', 'pitch_name', 'status',
        'winner_team_id', 'penalties', 'home_penalties', 'away_penalties',
    ];
    protected $casts = [
        'home_score' => 'integer', 'away_score' => 'integer',
        'match_date' => 'date', 'round_number' => 'integer',
        'penalties' => 'boolean', 'home_penalties' => 'integer', 'away_penalties' => 'integer',
    ];
    public function tournament() { return $this->belongsTo(SmartTournament::class, 'tournament_id'); }
    public function group() { return $this->belongsTo(TournamentGroup::class, 'group_id'); }
    public function homeTeam() { return $this->belongsTo(TournamentTeam::class, 'home_team_id'); }
    public function awayTeam() { return $this->belongsTo(TournamentTeam::class, 'away_team_id'); }
    public function winner() { return $this->belongsTo(TournamentTeam::class, 'winner_team_id'); }
}
