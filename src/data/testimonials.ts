export type Testimonial = { author: string; rating: 4 | 5; quote: string };

// Placeholder client reviews (French). Replace with real Google reviews later.
export const testimonials: readonly Testimonial[] = [
  { author: "Marie-Ève L.", rating: 5, quote: "Service impeccable et personnel très chaleureux. Mes ongles n'ont jamais été aussi beaux !" },
  { author: "Sophie T.", rating: 5, quote: "Salon propre et relaxant. La pédicure spa est un vrai bonheur, je recommande à 100 %." },
  { author: "Jessica R.", rating: 5, quote: "Plus de 1 000 couleurs de gel, j'ai enfin trouvé ma teinte parfaite. Équipe à l'écoute." },
  { author: "Nadia B.", rating: 5, quote: "Mes extensions de cils sont naturelles et tiennent super longtemps. Merci beaucoup !" },
  { author: "Caroline M.", rating: 4, quote: "Très bon service, accueil souriant. Petite attente mais ça en valait la peine." },
  { author: "Amélie D.", rating: 5, quote: "Toujours satisfaite ! Le souci du détail fait toute la différence. Mon salon attitré." },
  { author: "Valérie P.", rating: 5, quote: "Hygiène irréprochable et résultat magnifique. On se sent comme en famille." },
  { author: "Karine S.", rating: 5, quote: "L'épilation était rapide et presque sans douleur. Personnel professionnel et gentil." },
  { author: "Mélanie G.", rating: 4, quote: "Beau travail sur mes ongles, je reviendrai assurément. Bon rapport qualité-prix." },
  { author: "Isabelle F.", rating: 5, quote: "Une expérience spa complète. Je ressors toujours détendue et avec de superbes ongles." },
];
