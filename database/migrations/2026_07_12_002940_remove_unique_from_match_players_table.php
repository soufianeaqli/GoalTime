<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('match_players');

        Schema::create('match_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('match_announcements')->onDelete('cascade');
            $table->unsignedBigInteger('user_id');
            $table->string('full_name');
            $table->string('phone');
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->string('position')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_players');

        Schema::create('match_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('match_announcements')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->string('position')->nullable();
            $table->timestamps();
            $table->unique(['announcement_id', 'user_id']);
        });
    }
};
