<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('achievement_type');
            $table->string('title');
            $table->string('icon')->nullable();
            $table->string('color')->default('text-yellow-500');
            $table->text('description')->nullable();
            $table->timestamp('unlocked_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'achievement_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_achievements');
    }
};
