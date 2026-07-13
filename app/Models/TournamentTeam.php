<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TournamentTeam extends Model {
    protected $table = 'tournament_teams';
    protected $fillable = [
        'tournament_id', 'captain_id', 'team_name', 'team_logo',
        'captain_name', 'captain_phone', 'group_id', 'status', 'is_eliminated',
    ];
    protected $casts = ['is_eliminated' => 'boolean'];
    public function tournament() { return $this->belongsTo(SmartTournament::class, 'tournament_id'); }
    public function captain() { return $this->belongsTo(User::class, 'captain_id'); }
    public function group() { return $this->belongsTo(TournamentGroup::class, 'group_id'); }
}
