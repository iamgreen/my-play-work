const fs = require("uxp").storage.localFileSystem;
const { batchPlay } = require("photoshop").core;

async function saveMergedLayerAsImage(layer, savePath) {
  const mergedLayer = await batchPlay(
    [
      {
        _obj: "mergeLayersNew",
        using: { _enum: "mergeLayers", _value: "mergeLayersNew" },
        _isCommand: true,
        _options: {
          dialogOptions: "dontDisplay",
        },
      },
    ],
    {}
  );
  await mergedLayer[0].saveAs(fs.createEntry(`${savePath}/${layer.name}.png`));
}

async function hideTextLayersAndSaveAsImage(layer, savePath) {
  // Hide all text layers under the current layer
  const layersToHide = await batchPlay(
    [
      {
        _obj: "select",
        _target: [
          {
            _property: "layerSectionExpanded",
            _ref: "layer",
            _enum: "ordinal",
            _value: "targetEnum",
          },
          {
            _property: "layerKind",
            _ref: "layer",
            _enum: "ordinal",
            _value: "textLayer",
          },
        ],
      },
    ],
    {}
  );
  for (const layerToHide of layersToHide) {
    layerToHide.layerSectionExpanded = false;
  }
  await saveMergedLayerAsImage(layer, savePath);
}

async function saveSubLayersAsImages(layer, savePath) {
  if (layer.isGroupLayer) {
    // Recursively traverse sub-layers
    const subLayers = await layer.layers;
    for (const subLayer of subLayers) {
      await saveSubLayersAsImages(subLayer, savePath);
    }
  } else {
    const doc = await layer.ownerDocument;
    const bounds = await layer.boundsNoEffects;
    const width = Math.round(bounds.right - bounds.left);
    const height = Math.round(bounds.bottom - bounds.top);
    const layerName = await layer.name;
    const saveEntry = await fs.getFileForSaving(`${savePath}/${layerName}.png`, {types: ["png"]});
    await doc.createSnapshot();
    await batchPlay(
      [
        {
          _obj: "select",
          _target: [{ _ref: "layer", _id: layer._id }],
        },
        {
          _obj: "copyToClipboard",
          _isCommand: true,
          _options: {
            dialogOptions: "dontDisplay",
          },
        },
      ],
      {}
    );
    doc.activeHistoryState = doc.historyStates[doc.historyStates.length - 2];
    const image = await require("clipboard").paste();
    const pngData = image.convertToFormat("png").saveToBuffer();
    const fileWriter = await saveEntry.create();
    await fileWriter.write(pngData);
    await fileWriter.close();
  }
}

async function traverseLayers(root, savePath) {
  const children = await root.layers;
  for (const child of children) {
    const name = await child.name;
    if (name.startsWith("-a-")) {
      if (child.isGroupLayer) {
        await saveMergedLayerAsImage(child, savePath);
      }
    } else if (name.startsWith("-b-")) {
      if (child.isGroupLayer) {
        await hideTextLayersAndSaveAsImage(child, savePath);
      }
    } else if (name.startsWith("-e-")) {
      await saveSubLayersAsImages(child, savePath);
    }
    if (child.isGroupLayer) {
      await traverseLayers(child, savePath);
    }
  }
}

async function processLayers() {
  const psApp = require("photoshop").app;
  const activeDocument = psApp.activeDocument;
   const allLayerNames = activeDocument.layers.map(layer => layer);
  const root = activeDocument.layers[0];
  const saveFolder = await fs.getFolder();
  const savePath = saveFolder.nativePath;
  await traverseLayers(root, savePath);
}

function main () {
  processLayers().catch((err) => console.error(err));
}

document.getElementById("trigger").addEventListener("click", main);