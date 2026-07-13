<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('smart_tournaments')->onDelete('cascade');
            $table->unsignedBigInteger('group_id')->nullable();
            $table->foreignId('group_id_fk')->nullable()->constrained('tournament_groups')->onDelete('set null');
            $table->string('round');
            $table->integer('round_number')->default(0);
            $table->unsignedBigInteger('home_team_id')->nullable();
            $table->unsignedBigInteger('away_team_id')->nullable();
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->date('match_date')->nullable();
            $table->time('match_time')->nullable();
            $table->string('pitch_name')->nullable();
            $table->enum('status', ['scheduled', 'live', 'finished', 'cancelled'])->default('scheduled');
            $table->unsignedBigInteger('winner_team_id')->nullable();
            $table->boolean('penalties')->default(false);
            $table->integer('home_penalties')->nullable();
            $table->integer('away_penalties')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_matches');
    }
};
