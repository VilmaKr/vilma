# Elena · Learn Macedonian (app)

L'app web d'apprentissage du macédonien, destinée à `app.macedonianwithvilma.com`.
Site statique, sans étape de build : HTML, CSS et JavaScript (modules ES).

## Lancer en local

Les modules JavaScript ne marchent pas en ouvrant le fichier directement, il faut un petit serveur :

```bash
python -m http.server 8000 --directory app
```

Puis ouvrir http://localhost:8000.

## Organisation

- `index.html` : la page.
- `css/app.css` : le style (mêmes couleurs et polices que le jeu d'origine).
- `js/art.js` : Elena (modèle classique, 6 expressions) et les illustrations des villes.
- `js/exercises.js` : les types d'exercices (choix, associer, phrase à reconstruire, écrire, trier, vrai/faux, souligner, dialogue…).
- `js/store.js` : progression, révisions espacées (1, 2, 4, 7, 15, 30 jours) et série de jours. Sauvegardé dans le navigateur pour l'instant.
- `js/app.js` : les écrans (parcours, leçon, révision, carnet, test de niveau).
- `content/` : le contenu. Une ville = un fichier (`skopje.js`, `ohrid.js`, `bitola.js`), listé dans `course.js`.
- `archive/elena-in-macedonia.html` : le premier jeu, gardé tel quel.

## Ajouter du contenu

Dans un fichier de ville, chaque leçon a une liste `steps`. Dans un exercice `mc`, la première option est toujours la bonne : elles sont mélangées à l'écran.
Les histoires et les personnes sont inventées : aucun vrai nom d'élève, rien de leur vie privée.
