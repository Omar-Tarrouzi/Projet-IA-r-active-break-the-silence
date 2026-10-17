# ASCENT — Break the Silence 🎸

**Une guitare vivante. Quatre souverains. Une mélodie qu'il n'aurait jamais fallu jouer.**

Un soir, un guitariste joue une mélodie maudite dans sa chambre. La lumière éclate, le ciel s'ouvre et des puissances venues d'ailleurs l'enlèvent. Son instrument, lui, reste derrière… mais la musique lui a donné vie. La guitare s'élance à sa rescousse, armée du pouvoir du ~~rock~~ **steering behaviour**.

*ASCENT* est un jeu d'action 2D où l'on esquive, charge des ondes soniques et disperse des essaims de particules. Ces ennemis se regroupent en mains, marteaux, ciseaux et autres constructions avant d'attaquer. On peut jouer entièrement à la souris, ou laisser ses sons et claquements de mains entrer dans la partie.

> Projet de **Master IA2 UNICA — IA réactive**, inspiré des comportements de pilotage de Craig Reynolds. Le jeu fonctionne directement dans le navigateur.

## Lancer le jeu

Dans un terminal ouvert à la racine du dépôt :

```sh
python -m http.server 8765
```

Ouvrez ensuite **[http://127.0.0.1:8765/](http://127.0.0.1:8765/)**. Python 3 et un navigateur moderne suffisent ; les images, la police et p5.js sont inclus. La musique et les effets sonores sont générés pendant la partie.

## Comment jouer ?

| Action | Commande |
| --- | --- |
| Diriger la guitare | Déplacer la **souris** ; sur écran tactile, **glisser** le doigt |
| Charger puis lancer une onde | **Maintenir le clic gauche**, puis **relâcher** ; sur mobile, maintenir puis relâcher dans l'arène |
| Choisir la fréquence | **1** = LOW (onde circulaire), **2** = MID (cône), **3** = HIGH (rayon concentré) |
| Esquiver avec un dash | **Espace** ou **clic droit** ; bouton **DASH** sur mobile |
| Pause / reprise | **P** ou **Échap** |
| Recommencer | **R** |

**Envie de jouer avec le son ?** Activez le microphone dans le menu ou avec **M**, puis autorisez son accès dans le navigateur. Un **claquement bref** déclenche une attaque MID ; **chanter ou maintenir un son** charge une attaque HIGH, libérée quand le son s'arrête. Le réglage **Sensitivity** aide à adapter la détection à votre micro et à votre pièce. Le micro reste facultatif : toutes les actions essentielles sont disponibles sans lui.

Les fréquences ont chacune leur utilité : **LOW** repousse autour de vous, **MID** couvre une zone en cône, **HIGH** perce loin devant. Observez la forme et la couleur des attaques, puis choisissez le bon moment pour riposter. Le jeu affiche aussi des indications pendant les combats.

## Les souverains

Chaque rencontre change la façon de jouer. Les souverains ne se contentent pas de lancer des projectiles : leurs constructions de particules ont leurs propres mouvements et contre-attaques.

| Rencontre | Domaine et défi |
| --- | --- |
| **Vesper — 1 000 m** | Maître du silence. Son essaim devient un **trône**, une **main**, des anneaux presque fermés et des missiles. Trouvez l'ouverture, renvoyez ses attaques ; quand ses particules s'épuisent, attention à sa **lance**. |
| **Harm Onyx — 2 000 m** | Reine de la discorde. Des **fléchettes triangulaires** traînent des chaînes rouges. Brisez les maillons ou retenez la pointe en chargeant, puis relâchez pour lui retourner son arme. |
| **Nova — 3 000 m** | Duc de l'écho. Ses impulsions reprennent la fréquence de votre dernière attaque : reconnaissez-la, sélectionnez la même et **parez l'écho**. |
| **Cadence — 4 000 m** | Souveraine de la mesure. Lisez le rythme, choisissez LOW ou HIGH selon la phase et **relâchez sur le flash** pour ouvrir une fenêtre d'attaque. |

Pour s'entraîner, le menu propose **Practice a Ruler**. La **démo autonome** (`?demo=1`) joue seule et explique les mécaniques en français : pratique pour découvrir le projet ou préparer une présentation.

## Les steering behaviours, concrètement

Le principe commun : chaque agent calcule une **vitesse désirée**, la compare à sa vitesse actuelle, limite la force obtenue, puis l'applique. C'est ainsi que les formations bougent et se déforment sans téléporter leurs particules. Le fichier de cours [`vehicle.js`](vehicle.js) sert de base et reste inchangé ; les calculs complémentaires se trouvent dans [`behaviors/`](behaviors/).

| Algorithme | Où le voir dans le jeu |
| --- | --- |
| **Seek** — aller vers une cible | Les notes et les pointes d'attaque foncent vers leur objectif ; les formations quittent l'arène. |
| **Arrive** — ralentir près de la cible | La guitare suit le curseur en douceur ; les particules prennent leur place dans une forme ; les boss se repositionnent. |
| **Pursue** — anticiper une cible mobile | Des notes poursuivent les ennemis ; des formations et particules cherchent à intercepter la guitare. |
| **Evade** — anticiper et éviter une menace | Les particules dispersées s'écartent de la guitare. |
| **Wander** — errance contrôlée | Des particules libres et certains objets dérivent sans trajectoire rigide. |
| **Separation, Alignment, Cohesion** — *flocking* | Les particules gardent leurs distances, accordent leur direction et restent en groupe lorsqu'elles essaiment. |
| **Containment / Boundaries** — respecter l'arène | La guitare et les essaims sont guidés près des limites de la zone de jeu. |
| **Formation steering** — rejoindre un emplacement mobile | Les particules convergent vers des positions transformées pour dessiner armes, anneaux et constructions des boss. |
| **Orbit slotting** — répartir sur une orbite | Les notes alliées se placent autour de la guitare ; des particules occupent des anneaux mouvants. |
| **Blast / knockback** — fuir une onde | Les ondes soniques appliquent une force de dispersion aux particules touchées. |
| **Retour de boomerang et freinage** | Certaines notes passent de la poursuite au retour, puis ralentissent pour rejoindre la guitare. |

La grille spatiale dans [`systems/SpatialGrid.js`](systems/SpatialGrid.js) limite les voisins à examiner pour les essaims. Les contrôleurs combinent les forces, tandis que chaque entité reste un `Vehicle` : c'est ce qui relie l'IA réactive au mouvement visible à l'écran.

**Bonne ascension — et faites du bruit.** 🎶
