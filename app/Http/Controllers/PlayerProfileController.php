<?php

namespace App\Http\Controllers;

use App\Models\PlayerProfile;
use Illuminate\Http\Request;

class PlayerProfileController extends Controller
{
    public function show($userId)
    {
        $profile = PlayerProfile::with('user')->where('user_id', $userId)->first();

        if (!$profile) {
            $profile = PlayerProfile::create([
                'user_id' => $userId,
                'level' => 'intermediaire',
            ]);
            $profile->load('user');
        }

        return response()->json($profile);
    }

    public function update(Request $request, $userId)
    {
        $profile = PlayerProfile::where('user_id', $userId)->first();

        if (!$profile) {
            $profile = PlayerProfile::create(array_merge(
                ['user_id' => $userId],
                $request->only(['age', 'level', 'preferred_position'])
            ));
        } else {
            $validated = $request->validate([
                'age' => 'nullable|integer|min:10|max:60',
                'level' => 'sometimes|in:debutant,intermediaire,avance',
                'preferred_position' => 'nullable|string|max:50',
            ]);

            $profile->update($validated);
        }

        $profile->load('user');

        return response()->json($profile);
    }

    public function leaderboard()
    {
        $profiles = PlayerProfile::with('user')
            ->orderBy('average_rating', 'desc')
            ->orderBy('matches_played', 'desc')
            ->limit(20)
            ->get();

        return response()->json($profiles);
    }
}
