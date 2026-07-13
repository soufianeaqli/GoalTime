<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerReputation extends Model
{
    protected $table = 'player_reputations';

    protected $fillable = [
        'user_id', 'score', 'level', 'total_matches',
        'attendance_rate', 'punctuality_rate', 'payment_rate',
        'fair_play_rating', 'communication_rating',
        'total_reviews', 'positive_reviews', 'negative_reviews',
        'is_elite', 'is_verified', 'is_captain',
    ];

    protected $casts = [
        'score' => 'float',
        'attendance_rate' => 'float',
        'punctuality_rate' => 'float',
        'payment_rate' => 'float',
        'fair_play_rating' => 'float',
        'communication_rating' => 'float',
        'total_matches' => 'integer',
        'total_reviews' => 'integer',
        'positive_reviews' => 'integer',
        'negative_reviews' => 'integer',
        'is_elite' => 'boolean',
        'is_verified' => 'boolean',
        'is_captain' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviews()
    {
        return $this->hasMany(PlayerReview::class, 'reviewed_id', 'user_id');
    }

    public function achievements()
    {
        return $this->hasMany(PlayerAchievement::class, 'user_id');
    }

    public static function getLevel($score)
    {
        if ($score === 0 || $score === null) return ['level' => 'New Player', 'badge' => '🆕', 'color' => 'from-slate-400 to-slate-500'];
        if ($score >= 95) return ['level' => 'Elite Player', 'badge' => '🏆', 'color' => 'from-yellow-400 to-amber-500'];
        if ($score >= 85) return ['level' => 'Trusted Player', 'badge' => '⭐', 'color' => 'from-emerald-400 to-emerald-600'];
        if ($score >= 70) return ['level' => 'Regular Player', 'badge' => '👍', 'color' => 'from-blue-400 to-blue-600'];
        if ($score >= 50) return ['level' => 'Needs Improvement', 'badge' => '⚠️', 'color' => 'from-orange-400 to-orange-600'];
        return ['level' => 'Low Reputation', 'badge' => '🚫', 'color' => 'from-red-400 to-red-600'];
    }

    public static function calculateScore($reputation)
    {
        $attendance = ($reputation->attendance_rate / 100) * 35;
        $payment = ($reputation->payment_rate / 100) * 25;
        $punctuality = ($reputation->punctuality_rate / 100) * 15;
        $fairPlay = (min($reputation->fair_play_rating, 5) / 5) * 15;
        $comm = (min($reputation->communication_rating, 5) / 5) * 10;

        $score = $attendance + $payment + $punctuality + $fairPlay + $comm;
        return max(0, min(100, round($score, 1)));
    }
}
