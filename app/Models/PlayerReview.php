<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerReview extends Model
{
    protected $table = 'player_reviews';

    protected $fillable = [
        'announcement_id', 'tournament_id', 'reviewer_id', 'reviewed_id',
        'attended', 'punctuality_rating', 'paid',
        'fair_play_rating', 'communication_rating',
        'would_play_again', 'comment',
    ];

    protected $casts = [
        'attended' => 'boolean',
        'paid' => 'boolean',
        'punctuality_rating' => 'integer',
        'fair_play_rating' => 'integer',
        'communication_rating' => 'integer',
    ];

    public function announcement()
    {
        return $this->belongsTo(MatchAnnouncement::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(AppUser::class, 'reviewer_id');
    }

    public function reviewed()
    {
        return $this->belongsTo(AppUser::class, 'reviewed_id');
    }
}
