# spotify_api_G

Application web (Vite + TypeScript) qui se connecte à Spotify et affiche :

- le profil utilisateur
- les top artistes et top titres (avec choix de la période)
- les artistes suivis
- une recherche de musique avec pagination et lecture

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://127.0.0.1:5173

L'URI de redirection `http://127.0.0.1:5173/callback` doit être déclarée dans l'application Spotify Developer.
