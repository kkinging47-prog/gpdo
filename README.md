# GPDO Website

A responsive static website for Global Passion Development Organization (GPDO), designed for institutional credibility and international donor engagement.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository (for example `gpdo-website`).
2. Upload all files in this folder to the repository root.
3. In Vercel, choose **Add New > Project** and import the GitHub repository.
4. Framework preset: **Other** (Vercel will serve the static site automatically).
5. No build command is required.
6. Deploy.

## Recommended edits before public launch

- Replace the placeholder Facebook link with the exact page URL.
- Add an official GPDO email address when available.
- Add the organization's registration/company number if you want it public.
- Replace stock photography with GPDO's own high-resolution field photos as programmes begin.
- Add audited/verified impact metrics only when they are available.
- Connect a real donation/payment route (bank, Paystack, Flutterwave, donor portal, etc.) when ready.
- Add privacy, safeguarding, anti-fraud, and other institutional policies as downloadable documents when available.

## Main files

- `index.html` — Home
- `about.html` — About / Vision / Mission / Why GPDO Exists
- `programs.html` — Focus areas and programme model
- `get-involved.html` — Partnership, sponsorship, volunteering, donations
- `contact.html` — Contact page + WhatsApp enquiry form
- `styles.css` — Brand and responsive styles
- `script.js` — Mobile menu, animations, WhatsApp form
- `assets/logo.svg` — Editable GPDO identity mark
- `assets/og-cover.svg` — Social sharing artwork

## Contact links used

- Primary WhatsApp / phone: +233 25 607 3403
- Secondary phone: +233 59 736 5695
- Instagram: @globalpassiondevelopment
- TikTok: @globalpassiondevelopment


## Using your new transparent logo

The site now uses `assets/gpdo-logo.png` as the main logo in the header, footer, and browser tab icon.

## How to upload your own images

### Replace images already on the site
1. Put your photo files inside `assets/` or `assets/gallery/`.
2. Use simple file names, for example:
   - `community-training.jpg`
   - `women-empowerment.jpg`
   - `health-outreach.jpg`
3. Open the HTML file where you want the image.
4. Replace the current image path with your own file path.

Example:
```html
<img src="assets/gallery/community-training.jpg" alt="Community training programme">
```

### Add a gallery section
Create a section like this in any page:

```html
<section class="section">
  <div class="container">
    <h2>Gallery</h2>
    <div class="gallery-grid">
      <img src="assets/gallery/photo1.jpg" alt="GPDO programme photo 1">
      <img src="assets/gallery/photo2.jpg" alt="GPDO programme photo 2">
      <img src="assets/gallery/photo3.jpg" alt="GPDO programme photo 3">
      <img src="assets/gallery/photo4.jpg" alt="GPDO programme photo 4">
    </div>
  </div>
</section>
```

Then add this to `styles.css`:

```css
.gallery-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:18px;
}
.gallery-grid img{
  width:100%;
  height:240px;
  object-fit:cover;
  border-radius:18px;
  box-shadow:0 12px 30px rgba(7,28,53,.08);
}
```

### Uploading updated files to GitHub
1. Open your GitHub repository.
2. Open the `assets` folder.
3. Click **Add file** > **Upload files**.
4. Drag your images into GitHub.
5. Commit the changes.
6. Vercel will automatically redeploy the site.
