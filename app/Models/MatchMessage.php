<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchMessage extends Model
{
    use HasFactory;

    protected $table = 'match_messages';

    protected $fillable = [
        'announcement_id',
        'user_id',
        'message',
        'image',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
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
