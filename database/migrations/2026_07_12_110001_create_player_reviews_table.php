<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('match_announcements')->onDelete('cascade');
            $table->unsignedBigInteger('reviewer_id');
            $table->unsignedBigInteger('reviewed_id');
            $table->boolean('attended')->default(true);
            $table->integer('punctuality_rating')->default(5);
            $table->boolean('paid')->default(true);
            $table->integer('fair_play_rating')->default(5);
            $table->integer('communication_rating')->default(5);
            $table->enum('would_play_again', ['definitely', 'maybe', 'no'])->default('definitely');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['announcement_id', 'reviewer_id', 'reviewed_id']);
            $table->index('reviewed_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_reviews');
    }
};
