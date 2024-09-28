const express = require('express');
const puppeteer = require('puppeteer');
const pug = require('pug');

const app = express();
const port = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  next();
});


app.post('/generate-pdf', async (req, res) => {
  const { template, data } = req.body;

  if (!template) {
    return res.status(400).send('Pug template is required');
  }

  try {
    const compiledFunction = pug.compile(template);

    const htmlContent = compiledFunction(data);

    const browser = await puppeteer.launch({
      headless: "shell",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: null,
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.waitForSelector('body');

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="generated.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
