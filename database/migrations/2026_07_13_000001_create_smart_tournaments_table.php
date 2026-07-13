<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smart_tournaments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->text('description')->nullable();
            $table->string('city')->nullable();
            $table->string('pitch_name')->nullable();
            $table->integer('num_teams')->default(8);
            $table->integer('num_groups')->default(2);
            $table->integer('teams_per_group')->default(4);
            $table->integer('match_duration')->default(60);
            $table->integer('points_win')->default(3);
            $table->integer('points_draw')->default(1);
            $table->integer('points_loss')->default(0);
            $table->enum('format', ['group_knockout', 'knockout', 'round_robin', 'league', 'friendly'])->default('group_knockout');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('match_start_time')->default('10:00');
            $table->integer('daily_match_limit')->default(4);
            $table->integer('break_minutes')->default(15);
            $table->enum('status', ['draft', 'registering', 'locked', 'in_progress', 'finished'])->default('draft');
            $table->boolean('registration_open')->default(true);
            $table->boolean('groups_generated')->default(false);
            $table->boolean('bracket_generated')->default(false);
            $table->boolean('is_public')->default(true);
            $table->integer('registered_teams_count')->default(0);
            $table->integer('total_matches')->default(0);
            $table->integer('completed_matches')->default(0);
            $table->integer('total_goals')->default(0);
            $table->unsignedBigInteger('champion_team_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smart_tournaments');
    }
};
