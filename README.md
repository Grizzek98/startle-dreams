# Startle Dreams

A small dream journal: a React + Vite site hosted on GitHub Pages, with posts stored in Firebase Firestore.

Live: https://grizzek98.github.io/startle-dreams/

## Features

- Public, searchable list of dreams, newest first by dream date
- Admin login (Firebase Auth email/password) to create, edit, and delete posts
- Light/dark theme that follows your system and remembers your choice

## Development

```sh
npm install
npm run dev       # local dev server at http://localhost:5173/startle-dreams/
npm run build     # production build into build/
npm run preview   # serve the production build locally
```

## Deploying

```sh
npm run deploy
```

This builds the site and pushes `build/` to the `gh-pages` branch, which GitHub Pages serves.
The `base` in `vite.config.js` must match the repository name.

## Project layout

| File | Purpose |
| --- | --- |
| `src/firebase.js` | Firebase config and all Firestore/Auth calls |
| `src/App.jsx` | Header, theme toggle, login modal |
| `src/Editor.jsx` | New post form (logged in only) |
| `src/PostList.jsx` | Live post feed and search |
| `src/Post.jsx` | Single post with inline edit/delete |
| `src/Toast.jsx` | Error popup |

## Security note

The Firebase web config in `src/firebase.js` is public by design. Who can write posts is controlled by
**Firestore security rules** in the Firebase console, so make sure they only allow writes from your admin account.
