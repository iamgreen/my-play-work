const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');

async function processNode(node, parentNode) {
  let html = '';
  let style = '';

  if (node.children) {
    const groupName = node.name;
    html += `<div class="group-${groupName}">`;

    for (const childNode of node.children) {
      const { html: childHtml, style: childStyle } = await processNode(childNode, node);
      html += childHtml;
      style += childStyle;
    }

    html += `</div>`;
  } else {
    // ... 提取图层信息、处理图层图像、处理文字图层等逻辑 ...
    // 提取图层名、尺寸、位置等信息
    const layerName = node.name;
    const layerDimensions = {
        width: node.width,
        height: node.height,
    };
    const layerPosition = {
        left: node.left,
        top: node.top,
    };
    const layerOpacity = node.opacity / 255;

    // 处理图层图像
    if (node.canvas) {
        const imageData = node.canvas.toBuffer();
        fs.writeFileSync(`output/${layerName}.png`, imageData);
    }

    // 生成对应的 div 和样式
    html += `<div class="layer-${layerName}"></div>`;
    style += `
.layer-${layerName} {
position: absolute;
width: ${layerDimensions.width}px;
height: ${layerDimensions.height}px;
left: ${layerPosition.left}px;
top: ${layerPosition.top}px;
background-image: url('output/${layerName}.png');
background-size: cover;
opacity: ${layerOpacity};
}
`;

    // 处理文字图层
    if (node.text) {
        const textInfo = node.text;
        const fontPath = 'path/to/your/font.ttf'; // 替换为实际字体文件路径
        registerFont(fontPath, { family: textInfo.font.name });

        html += `<div class="text-layer-${layerName}">${textInfo.value}</div>`;
        style += `
.text-layer-${layerName} {
position: absolute;
font-family: '${textInfo.font.name}';
font-size: ${textInfo.font.sizes[0]}px;
color: rgba(${textInfo.font.colors[0]});
left: ${layerPosition.left}px;
top: ${layerPosition.top}px;
opacity: ${layerOpacity};
}
`;
    }
    // 根据实际需求，可以将这部分逻辑进行拆分和重构
  }

  return { html, style };
}

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

module.exports = {
  processNode,
  ensureDirectoryExists
};