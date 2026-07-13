<?php

namespace App\Http\Controllers;

use App\Models\MatchMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MatchMessageController extends Controller
{
    public function index(Request $request, $announcementId)
    {
        $messages = MatchMessage::with('user')
            ->where('announcement_id', $announcementId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, $announcementId)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'message' => 'required|string|max:1000',
            'image' => 'nullable|string',
        ]);

        $validated['announcement_id'] = $announcementId;

        $msg = MatchMessage::create($validated);
        $msg->load('user');

        return response()->json($msg, 201);
    }

    public function markRead(Request $request, $announcementId, $userId)
    {
        MatchMessage::where('announcement_id', $announcementId)
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Messages marqués comme lus']);
    }
}
