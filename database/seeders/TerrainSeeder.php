<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Terrain;

class TerrainSeeder extends Seeder
{
    public function run(): void
    {
        if (Terrain::count() > 0) return;

        $terrains = [
            [
                'titre' => 'Terrain Principal',
                'description' => 'Grand terrain en gazon synthétique de dernière génération. Éclairage LED, vestiaires modernes et tribunes pour 200 spectateurs.',
                'prix' => 300,
                'image' => 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=500&fit=crop'
            ],
            [
                'titre' => 'Terrain Couvert Indoor',
                'description' => 'Terrain couvert idéal pour jouer par tous les temps. Surface parfaite, climatisation, et café attenant.',
                'prix' => 400,
                'image' => 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=500&fit=crop'
            ],
            [
                'titre' => 'Mini-Terrain 5v5',
                'description' => 'Parfait pour les matchs à 5 contre 5. Gazon synthétique de qualité professionnelle. Parking disponible.',
                'prix' => 200,
                'image' => 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=500&fit=crop'
            ],
            [
                'titre' => 'Terrain Extérieur Premium',
                'description' => 'Terrain grand format en plein air avec éclairage nocturne. Barrière de sécurité et vestiaires équipés.',
                'prix' => 350,
                'image' => 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop'
            ],
            [
                'titre' => 'Terrain Scolaire',
                'description' => 'Terrain accessible et abordable, idéal pour les groupes d\'amis et les parties conviviales.',
                'prix' => 150,
                'image' => 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=500&fit=crop'
            ],
            [
                'titre' => 'Arena Football',
                'description' => 'Complexe sportif haut de gamme avec 2 terrains, salle de musculation et espaces VIP.',
                'prix' => 500,
                'image' => 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=800&h=500&fit=crop'
            ],
        ];

        foreach ($terrains as $terrain) {
            Terrain::create($terrain);
        }
    }
}
