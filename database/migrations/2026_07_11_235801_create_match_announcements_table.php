<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('terrain_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('match_date');
            $table->time('match_time');
            $table->integer('duration')->default(60);
            $table->enum('level', ['debutant', 'intermediaire', 'avance'])->default('intermediaire');
            $table->integer('players_needed')->default(1);
            $table->integer('players_joined')->default(0);
            $table->float('price_per_player')->nullable();
            $table->enum('match_type', ['amical', 'competitif'])->default('amical');
            $table->boolean('allow_comments')->default(true);
            $table->string('photo')->nullable();
            $table->enum('status', ['open', 'full', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_announcements');
    }
};
