const express = require('express');
const request = require('request');
const urlModule = require('url');
const app = express();
const PORT = 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Route to display the form where users can enter a URL
app.get('/', (req, res) => {
    res.render('index'); // Render the form from `index.ejs`
});

// Route to fetch and display a webpage
app.get('/browse', (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    // Fetch the requested URL's content
    request(targetUrl, { followRedirect: true }, (error, response, body) => {
        if (error) {
            return res.status(500).send('Error fetching the URL');
        }

        // Rewrite asset URLs to go through our proxy
        const rewrittenContent = rewriteAssetUrls(body, targetUrl);
        res.render('browser', { content: rewrittenContent, url: targetUrl });
    });
});

// Proxy route for fetching assets (CSS, JS, Images)
app.get('/asset', (req, res) => {
    const assetUrl = req.query.url;
    if (!assetUrl) {
        return res.status(400).send('Asset URL is required');
    }

    request(assetUrl)
        .on('error', () => res.status(500).send('Error fetching the asset'))
        .pipe(res);
});

// Function to rewrite asset URLs in HTML content
function rewriteAssetUrls(html, baseUrl) {
    return html.replace(/(href|src)="([^"]+)"/g, (match, attr, assetPath) => {
        const assetUrl = urlModule.resolve(baseUrl, assetPath);
        const proxiedUrl = `/asset?url=${encodeURIComponent(assetUrl)}`;
        return `${attr}="${proxiedUrl}"`;
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
