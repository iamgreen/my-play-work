const fs = require('fs');
const { readPsd } = require('ag-psd');
const { processNode } = require('./utils');

async function generateHTMLFromPSD(psdPath) {
  try {
    const buffer = fs.readFileSync(psdPath);
    const psd = readPsd(buffer, { skipLayerImageData: false });

    let html = '<!DOCTYPE html><html><head><style>';
    let style = '';

    for (const node of psd.children) {
      const { html: nodeHtml, style: nodeStyle } = await processNode(node, psd);
      html += nodeHtml;
      style += nodeStyle;
    }

    html += `</style></head><body>${style}</body></html>`;
    fs.writeFileSync('outputag/index.html', html);
    console.log('HTML file generated.');
  } catch (err) {
    console.error('Error:', err);
  }
}

module.exports = {
  generateHTMLFromPSD,
};