<?php

namespace Database\Seeders;

use App\Models\Tournament;
use Illuminate\Database\Seeder;

class TournamentsTableSeeder extends Seeder
{
    public function run(): void
    {
        if (Tournament::count() > 0) return;

        Tournament::create([
            'name' => 'Coupe de la Ville 2026',
            'date' => '2026-08-15',
            'max_teams' => 16,
            'registered_teams' => 8,
            'prize_pool' => '10000 DH',
            'description' => 'Le tournoi annuel le plus prestigieux de la ville. Les 16 meilleures équipes s\'affrontent pour le titre de champion.',
            'format' => 'Élimination directe',
            'entry_fee' => '500 DH',
            'image' => 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop',
            'teams' => [
                [
                    'id' => 1,
                    'name' => 'Les Champions',
                    'captain' => 'Mohammed Ali',
                    'phone' => '0600000001',
                    'email' => 'champions@example.com',
                    'registration_date' => now()->toDateString(),
                ],
                [
                    'id' => 2,
                    'name' => 'Les Aigles',
                    'captain' => 'Hassan Ahmed',
                    'phone' => '0600000002',
                    'email' => 'aigles@example.com',
                    'registration_date' => now()->toDateString(),
                ],
            ],
        ]);

        Tournament::create([
            'name' => 'Championnat Amateur',
            'date' => '2026-09-01',
            'max_teams' => 12,
            'registered_teams' => 6,
            'prize_pool' => '5000 DH',
            'description' => 'Tournoi réservé aux équipes amateurs. Phase de groupes suivie d\'une finale à élimination directe.',
            'format' => 'Phase de groupes + Élimination directe',
            'entry_fee' => '300 DH',
            'image' => 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=500&fit=crop',
            'teams' => [
                [
                    'id' => 3,
                    'name' => 'Les Étoiles',
                    'captain' => 'Karim Benali',
                    'phone' => '0600000003',
                    'email' => 'etoiles@example.com',
                    'registration_date' => now()->toDateString(),
                ],
            ],
        ]);

        Tournament::create([
            'name' => 'Tournoi Ramadan 2026',
            'date' => '2026-10-20',
            'max_teams' => 20,
            'registered_teams' => 12,
            'prize_pool' => '15000 DH',
            'description' => 'Grand tournoi nocturne pendant le mois de Ramadan. Ambiance festive, prix exceptionnels et spectacle garanti.',
            'format' => 'Phase de groupes + Élimination directe',
            'entry_fee' => '600 DH',
            'image' => 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=500&fit=crop',
            'teams' => [],
        ]);

        Tournament::create([
            'name' => 'Ligue des Quartiers',
            'date' => '2026-11-05',
            'max_teams' => 8,
            'registered_teams' => 4,
            'prize_pool' => '3000 DH',
            'description' => 'Compétition entre les quartiers de la ville. Esprit fair-play et bonne humeur au rendez-vous.',
            'format' => 'Élimination directe',
            'entry_fee' => '200 DH',
            'image' => 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=800&h=500&fit=crop',
            'teams' => [],
        ]);
    }
}
