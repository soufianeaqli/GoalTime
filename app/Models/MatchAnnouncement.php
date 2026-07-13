<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchAnnouncement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'terrain_id',
        'title',
        'description',
        'match_date',
        'match_time',
        'duration',
        'level',
        'players_needed',
        'players_joined',
        'price_per_player',
        'match_type',
        'allow_comments',
        'photo',
        'status',
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'string',
        'duration' => 'integer',
        'players_needed' => 'integer',
        'players_joined' => 'integer',
        'price_per_player' => 'float',
        'allow_comments' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(AppUser::class, 'user_id');
    }

    public function terrain()
    {
        return $this->belongsTo(Terrain::class);
    }

    public function players()
    {
        return $this->hasMany(MatchPlayer::class, 'announcement_id');
    }

    public function acceptedPlayers()
    {
        return $this->hasMany(MatchPlayer::class, 'announcement_id')->where('status', 'accepted');
    }

    public function messages()
    {
        return $this->hasMany(MatchMessage::class, 'announcement_id');
    }
}
