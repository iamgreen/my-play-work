const fs = require('fs');
const PSD = require('psd');
const path = require('path');

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
ensureDirectoryExists('output');

async function generateHTMLFromPSD(psdPath) {
  try {
    // 读取 PSD 文件
    const psd = await PSD.open(psdPath);

    // 解析并提取图层结构
    const tree = psd.tree();

    // 初始化 HTML 代码
    let html = '<!DOCTYPE html><html><head><style>';
    let style = '';

    // 递归处理图层
    async function processNode(node, parentNode) {
      if (node.isGroup()) {
        const groupName = node.get('name');
        html += `<div class="group-${groupName}">`;

        for (const childNode of node.children()) {
          await processNode(childNode, node);
        }

        html += `</div>`;
      } else {
        // 提取图层名、尺寸、位置等信息
        const layerName = node.get('name');
        const layerDimensions = node.get('dimensions');
        const layerPosition = node.get('coords');
        const layerOpacity = node.get('opacity') / 255;

        // 提取图层图像并保存为 PNG 文件
        await node.saveAsPng(`output/${layerName}.png`);

        // 生成对应的 div 和样式
        html += `<div class="layer-${layerName}"></div>`;
        style += `
.layer-${layerName} {
  position: absolute;
  width: ${layerDimensions?.width}px;
  height: ${layerDimensions?.height}px;
  left: ${layerPosition?.left}px;
  top: ${layerPosition?.top}px;
  background-image: url('output/${layerName}.png');
  background-size: cover;
  opacity: ${layerOpacity};
}
`;
      }
    }

    // 遍历图层，处理每个图层
    for (const node of tree.children()) {
      await processNode(node, tree);
    }

    // 结束 HTML 代码
    html += `</style></head><body>${style}</body></html>`;

    // 将生成的 HTML 代码保存到文件
    fs.writeFileSync('output/index.html', html);
    console.log('HTML file generated.');    
} catch (err) {console.error('Error:', err);}}

generateHTMLFromPSD('/Users/tmjoe/myProject/psd/psd/PNC邮箱订阅.psd');