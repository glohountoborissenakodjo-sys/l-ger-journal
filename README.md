# Ledger — Journal de trading

## 1. Tester en local
```bash
npm install
npm run dev
```
Ouvre l'adresse affichée (généralement http://localhost:5173) dans Chrome.

## 2. Mettre en ligne avec une vraie URL (gratuit)

### Option A — Vercel (recommandé, la plus simple)
1. Crée un compte sur https://vercel.com (tu peux te connecter avec GitHub)
2. Mets ce dossier sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Ledger journal de trading"
   ```
   Crée un nouveau repo sur https://github.com/new, puis :
   ```bash
   git remote add origin <URL_DE_TON_REPO>
   git push -u origin main
   ```
3. Sur Vercel : "Add New Project" → sélectionne ton repo → clique "Deploy"
4. Vercel détecte Vite automatiquement. En ~1 minute, tu obtiens une URL du type
   `https://ledger-journal.vercel.app` accessible depuis Chrome, sur mobile, partout.

### Option B — Netlify (sans passer par GitHub)
1. En local : `npm install && npm run build` (crée un dossier `dist/`)
2. Va sur https://app.netlify.com/drop
3. Glisse-dépose le dossier `dist/` — le site est en ligne instantanément avec une URL Netlify

## Important à savoir
- Les données (tes trades) sont stockées dans le navigateur (localStorage) de l'appareil que tu utilises.
  Elles ne se synchronisent pas automatiquement entre ton téléphone et ton PC une fois déployé.
- Si tu veux plus tard une vraie synchro multi-appareils (et la connexion MT5 automatique via webhook),
  il faudra ajouter une base de données (ex: Supabase, gratuit) — on peut le faire quand tu es prêt.
- Pour un nom de domaine perso (ex: monjournal.com), tu peux l'ajouter dans les réglages du projet
  sur Vercel ou Netlify une fois le site en ligne.
