# sohaibelsayyad.github.io

Personal portfolio of **Sohaib Elsayyad**, GIS specialist and land surveyor.

- English: https://sohaibelsayyad.github.io/GIS/
- Arabic: https://sohaibelsayyad.github.io/GIS/ar.html

## Structure

```
index.html              → redirects the site root to /GIS/
GIS/
  index.html            English page
  ar.html               Arabic page (RTL)
  assets/
    css/style.css       shared styles (logical properties handle RTL; light/dark via prefers-color-scheme)
    js/main.js          mobile menu, active nav link, scroll reveal, live role duration, footer year
    img/                illustration, contour background, company logos, certificate thumbnails
    docs/               downloadable CV
```

Plain static HTML/CSS/JS with no build step and no dependencies. Edit the two HTML files and push to `main`.
