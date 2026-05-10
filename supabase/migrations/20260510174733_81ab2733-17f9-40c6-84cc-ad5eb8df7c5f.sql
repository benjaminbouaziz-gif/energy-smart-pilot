UPDATE public.pricing_constants
SET date_debut = '2020-01-01',
    date_fin = NULL,
    notes = 'Grille tarifaire Sobry au 14 avril 2026. Appliquée comme grille de référence pour les simulations sur conso historique (projection ''et si vous passiez chez Sobry maintenant ?''). Ne reconstitue PAS la facturation historique exacte. Pour des factures d''époque précises, ajouter des lignes datées avec les grilles en vigueur à ces périodes.';