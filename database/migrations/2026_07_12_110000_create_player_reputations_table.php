<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_reputations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->unique();
            $table->float('score')->default(0);
            $table->string('level')->default('Low Reputation');
            $table->integer('total_matches')->default(0);
            $table->float('attendance_rate')->default(0);
            $table->float('punctuality_rate')->default(0);
            $table->float('payment_rate')->default(0);
            $table->float('fair_play_rating')->default(0);
            $table->float('communication_rating')->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('positive_reviews')->default(0);
            $table->integer('negative_reviews')->default(0);
            $table->boolean('is_elite')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_captain')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_reputations');
    }
};
