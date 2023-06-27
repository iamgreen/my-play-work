const { generateHTMLFromPSD } = require('./htmlGenerator');
const { ensureDirectoryExists } = require('./utils')
const { initializeCanvas, createCanvas } = require('canvas');

initializeCanvas(createCanvas); // 初始化 canvas

async function main() {
  ensureDirectoryExists('outputag');
  const psdPath = '/Users/tmjoe/myProject/psd/psd/PNC邮箱订阅.psd';
  await generateHTMLFromPSD(psdPath);
}

main();