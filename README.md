# Révisia — Fiches de révision pour tes élèves

Ce dossier contient un site complet :
- `index.html` — le site que voient tes élèves (connexion, prise de photos, inventaire).
- `api/generate.js` — une petite fonction serveur qui appelle l'IA (Claude) pour générer
  la fiche de révision, en gardant ta clé API secrète (jamais visible par les élèves).

## ⚠️ Pourquoi pas juste "GitHub Pages" ?

GitHub Pages héberge uniquement des fichiers statiques (HTML/CSS/JS) : il ne peut pas
exécuter la fonction `api/generate.js`, qui doit tourner sur un serveur pour protéger ta
clé API. Il faut donc un hébergeur qui exécute aussi du code serveur.

La solution la plus simple et gratuite : **Vercel**, qui se connecte directement à ton
dépôt GitHub et déploie automatiquement le site ET la fonction ensemble, à chaque fois
que tu modifies le code sur GitHub.

## Étapes de mise en ligne

### 1. Mettre le code sur GitHub
1. Crée un nouveau dépôt sur [github.com](https://github.com) (par exemple `revisia`).
2. Mets-y les fichiers de ce dossier (`index.html`, `api/generate.js`, `package.json`,
   ce `README.md`) — soit en les glissant-déposant dans l'interface web de GitHub, soit
   avec `git` si tu es à l'aise avec.

### 2. Obtenir une clé API Anthropic
1. Va sur [console.anthropic.com](https://console.anthropic.com), crée un compte si besoin.
2. Crée une clé API (section "API Keys").
3. Ajoute des crédits sur le compte (l'utilisation de l'IA a un coût, mais très faible
   pour un usage de classe — quelques centimes par fiche générée).
4. **Garde cette clé secrète** : ne la mets jamais dans le code ni sur GitHub.

### 3. Déployer sur Vercel
1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec ton compte GitHub.
2. Clique sur "Add New… → Project", puis choisis ton dépôt `revisia`.
3. Avant de cliquer sur "Deploy", ouvre "Environment Variables" et ajoute :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : ta clé API copiée à l'étape précédente
4. Clique sur "Deploy". Après une minute, Vercel te donne une adresse du type
   `https://revisia-xxxx.vercel.app` — c'est le site que tu peux donner à tes élèves.

### 4. Mettre à jour le site plus tard
À chaque fois que tu modifies un fichier sur GitHub (directement dans l'interface web,
ou avec `git push`), Vercel redéploie automatiquement le site en 1 à 2 minutes.

## Limites à connaître

- **Comptes élèves** : stockés uniquement dans le navigateur de chaque élève
  (localStorage). Pas de synchronisation entre appareils, et si un élève vide les
  données de son navigateur, ses fiches sont perdues. Pour un vrai système de comptes
  partagé entre appareils, il faudrait ajouter une vraie base de données (par exemple
  Firebase ou Supabase) — possible, mais plus de travail.
- **Taille des photos** : les photos sont redimensionnées automatiquement dans le
  navigateur avant l'envoi pour rester rapides et économiques. 12 photos maximum par
  fiche (l'élève peut créer plusieurs fiches pour un cours très long).
- **Coût** : chaque génération de fiche appelle l'API Anthropic avec ta clé, donc chaque
  fiche générée a un (petit) coût facturé sur ton compte Anthropic.
