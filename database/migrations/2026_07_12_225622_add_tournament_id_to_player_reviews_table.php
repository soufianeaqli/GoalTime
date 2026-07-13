<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('tournament_id')->nullable()->after('announcement_id');
            $table->foreign('tournament_id')->references('id')->on('smart_tournaments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('player_reviews', function (Blueprint $table) {
            $table->dropForeign(['tournament_id']);
            $table->dropColumn('tournament_id');
        });
    }
};
