# ASCENT: Break the Silence — v1

Jeu 2D de steering behaviours pour le Master IA2 UNICA. Une guitare vivante traverse des formations de particules et affronte Vesper, Harm Onyx, Nova et Cadence.

## Jouer

Depuis la racine du dépôt, lancer un serveur local (Python 3) :

```sh
python -m http.server 8765
```

Ouvrir http://127.0.0.1:8765/ dans un navigateur moderne. Déplacer la souris ou toucher l'écran pour diriger la guitare, maintenir puis relâcher pour lancer une onde. Les touches 1, 2, 3 choisissent LOW, MID, HIGH ; Espace déclenche le dash. Le microphone est facultatif : un claquement lance MID et un son tenu charge HIGH. Le tutoriel du menu illustre ces commandes.

La démo autonome est accessible depuis le menu ou avec `?demo=1`. Pour capturer directement un boss : `?demo=HUSH`, `?demo=MUTE`, `?demo=ECHO` ou `?demo=MEASURE`.

Le jeu inclut ses images, sa police et p5.js. La musique et les effets sonores sont synthétisés à l'exécution. `vehicle.js` est le code de cours protégé et ne doit pas être modifié.