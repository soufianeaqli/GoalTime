<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlayerProfile extends Model
{
    use HasFactory;

    protected $table = 'player_profiles';

    protected $fillable = [
        'user_id',
        'age',
        'level',
        'preferred_position',
        'matches_played',
        'average_rating',
    ];

    protected $casts = [
        'age' => 'integer',
        'matches_played' => 'integer',
        'average_rating' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(AppUser::class, 'user_id');
    }
}
