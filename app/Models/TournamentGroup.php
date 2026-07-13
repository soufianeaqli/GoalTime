<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TournamentGroup extends Model {
    protected $table = 'tournament_groups';
    protected $fillable = ['tournament_id', 'name', 'sort_order'];
    public function tournament() { return $this->belongsTo(SmartTournament::class, 'tournament_id'); }
    public function teams() { return $this->hasMany(TournamentTeam::class, 'group_id'); }
    public function standings() { return $this->hasMany(TournamentStanding::class, 'group_id'); }
}
