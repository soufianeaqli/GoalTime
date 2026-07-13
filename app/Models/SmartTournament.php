<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SmartTournament extends Model {
    protected $table = 'smart_tournaments';
    protected $fillable = [
        'organizer_id', 'name', 'logo', 'banner', 'description', 'city', 'pitch_name',
        'num_teams', 'num_groups', 'teams_per_group', 'match_duration',
        'points_win', 'points_draw', 'points_loss',
        'format', 'start_date', 'end_date', 'match_start_time',
        'daily_match_limit', 'break_minutes',
        'status', 'registration_open', 'groups_generated', 'bracket_generated', 'is_public',
        'registered_teams_count', 'total_matches', 'completed_matches', 'total_goals',
        'champion_team_id',
    ];
    protected $casts = [
        'start_date' => 'date', 'end_date' => 'date',
        'match_start_time' => 'string',
        'num_teams' => 'integer', 'num_groups' => 'integer', 'teams_per_group' => 'integer',
        'match_duration' => 'integer', 'daily_match_limit' => 'integer', 'break_minutes' => 'integer',
        'points_win' => 'integer', 'points_draw' => 'integer', 'points_loss' => 'integer',
        'registration_open' => 'boolean', 'groups_generated' => 'boolean',
        'bracket_generated' => 'boolean', 'is_public' => 'boolean',
        'registered_teams_count' => 'integer', 'total_matches' => 'integer',
        'completed_matches' => 'integer', 'total_goals' => 'integer',
    ];
    public function organizer() { return $this->belongsTo(User::class, 'organizer_id'); }
    public function teams() { return $this->hasMany(TournamentTeam::class, 'tournament_id'); }
    public function groups() { return $this->hasMany(TournamentGroup::class, 'tournament_id'); }
    public function matches() { return $this->hasMany(TournamentMatch::class, 'tournament_id'); }
    public function standings() { return $this->hasMany(TournamentStanding::class, 'tournament_id'); }
    public function awards() { return $this->hasMany(TournamentAward::class, 'tournament_id'); }
    public function champion() { return $this->belongsTo(TournamentTeam::class, 'champion_team_id'); }
}
