<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TournamentAward extends Model {
    protected $table = 'tournament_awards';
    protected $fillable = [
        'tournament_id', 'team_id', 'user_id',
        'award_type', 'title', 'icon', 'value',
    ];
    public function tournament() { return $this->belongsTo(SmartTournament::class, 'tournament_id'); }
    public function team() { return $this->belongsTo(TournamentTeam::class, 'team_id'); }
    public function user() { return $this->belongsTo(User::class, 'user_id'); }
}
