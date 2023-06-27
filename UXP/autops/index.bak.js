// function showLayerNames() {
//     const app = require("photoshop").app;
//     const allLayers = app.activeDocument.layers;
//     const allLayerNames = allLayers.map(layer => layer.name);
//     const sortedNames = allLayerNames.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
//     document.getElementById("layers").innerHTML = `
//       <ul>${
//         sortedNames.map(name => `<li>${name}</li>`).join("")
//       }</ul>`;
// }
// document.getElementById("btnPopulate").addEventListener("click", showLayerNames);

// const constants = require("photoshop").constants
const app = require("photoshop").app;
const fs = require('uxp').storage.localFileSystem;
const folder = require('uxp').storage.Folder
const host = require('uxp').host;
const locale = host.uiLocale;
const hostName = host.name
const hostVersion = host.version;
const hostOS = require('os').platform(); // note that this is a method, not a property
console.log(`locale: ${locale}  host ${hostName} version ${hostVersion} running on ${hostOS}`);

var publishFolder, mainDoc, bgLayerName;

function showAlert(message) {
  const core = require('photoshop').core;
	core.showAlert({message: message});
}

function getPNGFormat(isHighQuality) {
  try {
    var option = new ExportOptionsSaveForWeb();
    option.transparency = true;
    option.colors = 256;
    option.format = SaveDocumentType.PNG;
    option.PNG8 = false;
    option.quality = isHighQuality ? 80 : 70;
    return {
      format: option,
      type: 'png'
    };
  } catch (e) {
    throw new Error('Could not create PNG format.');
  }
}
function getJPEGFormat(isHighQuality) {
  var option = new ExportOptionsSaveForWeb();
  // 色彩范围
  option.colors = 256;
  // 格式
  option.format = SaveDocumentType.JPEG;
  // 质量
  option.quality = isHighQuality ? 70 : 60;
  return {
    format: option,
    type: 'jpeg'
  };
}

function getPng(curDoc, name, isHighQuality) {
  // 获取图片格式配置
  var photoType = getPNGFormat(isHighQuality);
  // 图片输出路径及文件名
  var file = new File(publishFolder + '/' + name + '.' + photoType.type);
  // 导出文件
  try {
    curDoc.exportDocument(file, ExportType.SAVEFORWEB, photoType.format);
  } catch (e) {
    alert(e);
  }
  file = null;
  photoType = null;
}

function getJpg(curDoc, name, isHighQuality) {
  try {
    // 获取图片格式配置
    var photoType = getJPEGFormat(isHighQuality);
    // 图片输出路径及文件名
    var file = new File(publishFolder + '/' + name + '.' + photoType.type);
    // 导出文件
    curDoc.exportDocument(file, ExportType.SAVEFORWEB, photoType.format);
    file = null;
    photoType = null;
  } catch (e) {
    alert(e.message);
  }
}

function selectLayer(name) {
  try {
    var layerAction = new ActionReference();
    layerAction.putName(stringIDToTypeID('layer'), name);
    var layerDescript = new ActionDescriptor();
    layerDescript.putReference(stringIDToTypeID('null'), layerAction);
    executeAction(stringIDToTypeID('select'), layerDescript, DialogModes.NO);
  } catch (e) {
    return e.message;
  }
}

function createSection(line1, line2, width) {
  //定义一个变量[region]，表示一定范围的区域。它的值是四个点的坐标。
  var region = [
    [0, line1],
    [width, line1],
    [width, line2],
    [0, line2]
  ];
  //定义一个变量[type]，表示构建选区的方式。
  //当前使用的是默认选项，即如果当前文档已经存在选区，则取消已存在的选区后，再构建新的选区。
  var type = SelectionType.REPLACE;
  //定义一个变量[feather]，表示构建选区时的羽化值。
  var feather = 0;
  //定义一个变量[antiAlias]，表示构建选区时是否抗锯齿。
  var antiAlias = true;
  //通过调用[selection]对象的[select]方法，并传入之前设置好的各项参数，在当前文档构建一个选区。
  try {
    app.activeDocument.selection.select(region, type, feather, antiAlias);
  } catch (e) {
    alert("Unexpected error while creating selection: " + e);
  }
}

function outputNormalLayer(targetLayer, name, isBg, isHighQuality) {
  var layerSize = targetLayer.bounds;
  targetLayer.copy();
  try {
    // 创建新文档，尺寸为内存的图层大小
    app.documents.add(
      isBg ? mainDoc.width : layerSize[2] - layerSize[0],
      layerSize[3] - layerSize[1],
      // mainDoc.width,
      // mainDoc.height,
      72,
      'output',
      NewDocumentMode.RGB,
      DocumentFill.TRANSPARENT
    );
    // 将target重置到输出文档
    app.activeDocument = app.documents[app.documents.length - 1];
    // 将内存中的图层拷贝到新文档
    app.activeDocument.paste();
    isBg
      ? getJpg(app.activeDocument, name, !!isHighQuality)
      : getPng(app.activeDocument, name, !!isHighQuality);
  } catch (e) {
    alert(e);
  } finally {
    // 关闭新文档（不存储）
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = mainDoc;
    layerSize = null;
  }
}

function outputSmarty(layerItem, name) {
  selectLayer(layerItem.name);
  // 打开智能对象
  app.runMenuItem(stringIDToTypeID('placedLayerEditContents'));
  var psbDoc = app.activeDocument;
  getPng(psbDoc, name);
  psbDoc.close(SaveOptions.DONOTSAVECHANGES);
  psbDoc = null;
}

function getCurName(txt1, txt2) {
  var res = txt1 ? txt1 + '_' + txt2 : txt2;
  return res.replace(/-[a-z]-/g, '');
}

function findFolder(doc, preName) {
  if (doc.layerTree.length) {
    // 导出所有非文件夹图层
    outputLayer(doc, preName);
  }
  var index = 0;
  while (index < doc.layerTree.length) {
    var folderItem = doc.layerTree[index];
    var _folderName = folderItem.name;
    // 全切文件夹
    if (/^-a-/.test(_folderName)) {
      outputFolder(doc, folderItem, preName);
      continue;
    }
    // 切背景文件夹
    if (/^-b-/.test(_folderName)) {
      outputFolder(doc, folderItem, preName, true);
      continue;
    }
    // 导出所有非文件夹图层
    if (/^-e-/.test(_folderName)) {
      outputLayer(folderItem, getCurName(preName, folderItem.name));
      folderItem.remove();
      continue;
    }
    if (folderItem.layerTree.length) {
      findFolder(folderItem, getCurName(preName, folderItem.name));
    }
    index++;
    _folderName = null;
    folderItem = null;
  }
  index = null;
}

function outputLayer(folderItem, preName) {
  for (var j = 0; j < folderItem.layerTree.length; j++) {
    var layerItem = folderItem.layerTree[j];
    // if (layerItem.kind == LayerKind.TEXT) {
      if (layerItem.kind == 2) {
      continue;
    }
    if (/^-h-/.test(layerItem.name)) {
      continue;
    }
    if (
      /^-p-/.test(layerItem.name) &&
      // layerItem.kind == LayerKind.SMARTOBJECT
      layerItem.kind == 17
    ) {
      app.activeDocument.activeLayer = layerItem;
      app.runMenuItem(stringIDToTypeID('placedLayerEditContents'));
      var psbDoc = app.activeDocument;
      for (var k = 0; k < psbDoc.layerTree.length; k++) {
        psbDoc.layerTree[k].visible = false;
      }
      for (var k = 0; k < psbDoc.layerTree.length; k++) {
        var psbItem = psbDoc.layerTree[k];
        psbItem.visible = true;
        getPng(
          psbDoc,
          getCurName(getCurName(preName, layerItem.name), psbItem.name)
        );
        psbItem.visible = false;
        psbItem = null;
      }
      psbDoc.close(SaveOptions.DONOTSAVECHANGES);
      psbDoc = null;
      continue;
    }
    app.activeDocument.activeLayer = layerItem;
    layerItem.rasterize(RasterizeType.ENTIRELAYER);
    outputNormalLayer(layerItem, getCurName(preName, layerItem.name), false);
    layerItem = null;
  }
}

function outputFolder(doc, folderItem, preName, hideText) {
  var _folderName = folderItem.name;
  if (hideText) {
    for (var j = 0; j < folderItem.layerTree.length; j++) {
      var layerItem = folderItem.layerTree[j];
      // if (layerItem.kind == LayerKind.TEXT) {
        if (layerItem.kind == 2) {
        layerItem.visible = false;
      }
      layerItem = null;
    }
  }
  folderItem.merge();
  outputNormalLayer(
    doc.layerTree.getByName(_folderName),
    getCurName(preName, _folderName),
    false
  );
  _folderName = null;
}

function outputBg() {
  var bgFolderItem = app.activeDocument.layerTree.getByName(bgLayerName);
  // 合并背景图层
  bgFolderItem.merge();
  bgFolderItem = null;
  selectLayer(bgLayerName);
  var bgLayer = app.activeDocument.activeLayer;
  // 获取所有水平参考线位置，并取整
  var bgLineArr = [0];
  for (var j = 0; j < app.activeDocument.guides.length; j++) {
    var guideItem = app.activeDocument.guides[j];
    if (guideItem.direction == Direction.HORIZONTAL) {
      var lineLocal = Math.round(guideItem.coordinate);
      bgLineArr.push(lineLocal);
      lineLocal = null;
    }
    guideItem = null;
  }
  bgLineArr.push(Math.min(Math.round(bgLayer.bounds[3]), mainDoc.height));
  // 排序，因为参考线可能不是按顺序拉的
  bgLineArr.sort(function (a, b) {
    return a - b;
  });
  if (bgLineArr.length) {
    for (var k = 0; k < bgLineArr.length; k++) {
      if (!k) continue;
      createSection(
        bgLineArr[k - 1],
        bgLineArr[k],
        Math.round(bgLayer.bounds[2])
      );
      executeAction(stringIDToTypeID('copyToLayer'), void 0, DialogModes.NO);
      var curBgLayer = app.activeDocument.activeLayer;
      outputNormalLayer(curBgLayer, '背景图-' + k, true, k == 1);
      app.activeDocument.activeLayer.remove();
      curBgLayer = null;
    }
  }
  bgLayer.remove();
  bgLayer = null;
  bgLineArr = null;
}

function selectAllLayers() {
  var desc29 = new ActionDescriptor();
  var ref23 = new ActionReference();
  ref23.putEnumerated(
    charIDToTypeID('Lyr '),
    charIDToTypeID('Ordn'),
    charIDToTypeID('Trgt')
  );
  desc29.putReference(charIDToTypeID('null'), ref23);
  executeAction(stringIDToTypeID('selectAllLayers'), desc29, DialogModes.NO);
} 

function hideLayers() {
  var ref = new ActionReference();
  ref.putEnumerated(
    charIDToTypeID('Lyr '),
    charIDToTypeID('Ordn'),
    charIDToTypeID('Trgt')
  );
  var desc = new ActionDescriptor();
  desc.putReference(charIDToTypeID('null'), ref);
  executeAction(charIDToTypeID('Hd  '), desc, DialogModes.NO);
}

const startFunc = async () => {
    try { 
        const publishFolderAction = await fs.getFolder();
        publishFolder = publishFolderAction.nativePath;
        app.activeDocument = app.documents[app.documents.length - 1];
        mainDoc = app.activeDocument;
        bgLayerName = '背景汇总';
        outputBg(); // 导出背景图
        findFolder(app.activeDocument, ''); // 导出其他图层
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        showAlert('导出完成');
    } catch (error) {
        console.log(error);
        // showAlert('导出失败');
    }
}

document.getElementById("trigger").addEventListener("click", startFunc);