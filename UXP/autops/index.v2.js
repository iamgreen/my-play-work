const fs = require("uxp").storage.localFileSystem;
const ps = require("photoshop").app;

async function processLayers(layers, saveFolderPath) {
    for (const layer of layers) {
        if (layer.layers) {
            await processLayers(layer.layers, saveFolderPath);
        }

        const name = layer.name;
        if (name.startsWith("-a-")) {
            await mergeAndSaveLayer(layer, saveFolderPath);
        } else if (name.startsWith("-b-")) {
            await hideTextLayersAndSave(layer, saveFolderPath);
        } else if (name.startsWith("-e-")) {
            await saveAllChildLayers(layer, saveFolderPath);
        }
    }
}

async function mergeAndSaveLayer(layer, saveFolderPath) {
    try {
        const outputFile = await saveFolderPath.createFile(`${layer.name}.png`, { overwrite: true });
        await layer.merge();
        await ps.activeDocument.save(outputFile, { saveAsCopy: true });
    } catch (err) {
        console.error("Error merging and saving layer:", err);
    }
}

async function hideTextLayersAndSave(layer, saveFolderPath) {
    const textLayers = layer.layers.filter(childLayer => childLayer.kind === "textLayer");
    const visibleStates = textLayers.map(textLayer => textLayer.visible);

    textLayers.forEach(textLayer => (textLayer.visible = false));

    try {
        const outputFile = await saveFolderPath.createFile(`${layer.name}.png`, { overwrite: true });
        await layer.merge();
        await ps.activeDocument.save(outputFile, { saveAsCopy: true });
    } catch (err) {
        console.error("Error hiding text layers and saving:", err);
    } finally {
        textLayers.forEach((textLayer, index) => (textLayer.visible = visibleStates[index]));
    }
}

async function saveAllChildLayers(layer, saveFolderPath) {
    const childLayers = layer.layers.filter(childLayer => !childLayer.layers);

    for (const childLayer of childLayers) {
        try {
            const outputFile = await saveFolderPath.createFile(`${childLayer.name}.png`, { overwrite: true });
            await childLayer.duplicate();
            await childLayer.merge();
            await ps.activeDocument.save(outputFile, { saveAsCopy: true });
        } catch (err) {
            console.error("Error saving child layer as image:", err);
        }
    }
}

async function main() {
    try {
        const saveFolderPath = await fs.getFolder();
        const rootLayers = ps.activeDocument.layers;
        await processLayers(rootLayers, saveFolderPath);
    } catch (err) {
        console.error("Error processing layers:", err);
    }
}

document.getElementById("trigger").addEventListener("click", main);