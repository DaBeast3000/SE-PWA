# SunCard TCG Store Starter (Vanilla JS PWA)

What this is
- A runnable vanilla-JS Progressive Web App starter for a multi-TCG store.
- Includes global search, TCG tabs with recent-set flyouts, filterable catalogue, client cart, web app manifest, and service worker.

How to run locally
1. Place the project folder on your machine.
2. Ensure the `public` folder contains the files listed in the Project Structure, including placeholder icons and images.
3. Serve the `public` directory over HTTPS for full PWA features or for development you can use a simple static server:
   - Python 3: `python -m http.server 8000` from inside `public` then open `http://localhost:8000`
   - Node: install any static server (for example `npm i -g serve`) then `serve .` inside `public`
4. Open the site in a modern browser and use DevTools Lighthouse to inspect PWA status.

Notes
- Replace mock data in `app.js` with real API endpoints for production.
- Add real icons in `public/icons/` and product images in `public/images/`.
- Configure payment processing on a secure backend for checkout.

Files included below. Create the files exactly as shown into the `public` folder.
