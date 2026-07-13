<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchPlayer extends Model
{
    use HasFactory;

    protected $table = 'match_players';

    protected $fillable = [
        'announcement_id',
        'user_id',
        'full_name',
        'phone',
        'status',
        'position',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function announcement()
    {
        return $this->belongsTo(MatchAnnouncement::class, 'announcement_id');
    }

    public function user()
    {
        return $this->belongsTo(AppUser::class, 'user_id');
    }
}
