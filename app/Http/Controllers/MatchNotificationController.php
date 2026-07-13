<?php

namespace App\Http\Controllers;

use App\Models\MatchNotification;
use Illuminate\Http\Request;

class MatchNotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = MatchNotification::where('user_id', $request->user_id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        $count = MatchNotification::where('user_id', $request->user_id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, $id)
    {
        $notification = MatchNotification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification lue']);
    }

    public function markAllRead(Request $request)
    {
        MatchNotification::where('user_id', $request->user_id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Toutes les notifications marquées comme lues']);
    }

    public function destroy(Request $request, $id)
    {
        $notification = MatchNotification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification supprimée']);
    }
}
