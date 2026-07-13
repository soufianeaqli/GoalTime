<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('smart_tournaments')->onDelete('cascade');
            $table->foreignId('captain_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('team_name');
            $table->string('team_logo')->nullable();
            $table->string('captain_name')->nullable();
            $table->string('captain_phone')->nullable();
            $table->unsignedBigInteger('group_id')->nullable();
            $table->enum('status', ['registered', 'confirmed', 'disqualified'])->default('registered');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_teams');
    }
};
