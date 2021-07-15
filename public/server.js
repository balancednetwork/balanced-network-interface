const express = require('express');
const fs = require('fs');
const path = require('path');

const seo = require('./seo');

const app = new express();
app.use('/static', express.static(path.join(__dirname, 'build/static')));
app.get('*', (req, res) => {
  console.log(req);
  let pathname = req.pathname || req.originalUrl;
  let page = seo.find(item => item.path === pathname);
  if (page) {
    let html = fs.readFileSync(path.join(__dirname, '../build', 'index.html'));
    let htmlWithSeo = html
      .toString()
      .replace(/__SEO_TITLE__/gm, page.title)
      .replace(/__SEO_DESCRIPTION__/gm, page.description)
      .replace(/__SEO_IMAGE__/gm, page.image)
      .replace(/__SEO_URL__/gm, page.path);

    return res.send(htmlWithSeo);
  }
  return res.sendFile(path.join(__dirname, '../build', 'index.html'));
});
app.listen(3000, () => {
  console.log('listened on 3000');
});
