"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatching = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const chokidar_1 = __importDefault(require("chokidar"));
const pdf_poppler_1 = require("pdf-poppler");
function pdfToPng(pdfPath, outputFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseName = path_1.default.basename(pdfPath, path_1.default.extname(pdfPath));
        const outputBasePath = path_1.default.join(outputFolder, baseName);
        const pdfConverter = new pdf_poppler_1.PdfConverter(pdfPath);
        const options = {
            format: 'png',
            out_dir: outputFolder,
            out_prefix: baseName,
            page: null,
        };
        yield pdfConverter.convert(options);
        const imagePaths = fs_1.default
            .readdirSync(outputFolder)
            .filter((file) => file.startsWith(baseName) && file.endsWith('.png'))
            .map((file) => path_1.default.join(outputFolder, file));
        const imageBuffers = yield Promise.all(imagePaths.map((imgPath) => (0, sharp_1.default)(imgPath).toBuffer()));
        const imageInfos = yield Promise.all(imageBuffers.map((buffer) => (0, sharp_1.default)(buffer).metadata()));
        const totalHeight = imageInfos.reduce((sum, img) => sum + img.height, 0);
        const maxWidth = Math.max(...imageInfos.map((img) => img.width));
        const composite = [];
        let yOffset = 0;
        for (const buffer of imageBuffers) {
            const img = (0, sharp_1.default)(buffer);
            composite.push({
                input: buffer,
                top: yOffset,
                left: 0,
            });
            const { height } = yield img.metadata();
            yOffset += height;
        }
        const combinedImage = (0, sharp_1.default)({
            create: {
                width: maxWidth,
                height: totalHeight,
                channels: 3,
                background: { r: 255, g: 255, b: 255 },
            },
        }).composite(composite);
        const outputPath = path_1.default.join(outputFolder, `${baseName}.png`);
        yield combinedImage.toFile(outputPath);
        console.log(`Converted ${baseName} to PNG`);
        // Cleanup intermediate images
        imagePaths.forEach(fs_1.default.unlinkSync);
    });
}
function startWatching(inputFolder, outputFolder) {
    if (!fs_1.default.existsSync(outputFolder)) {
        fs_1.default.mkdirSync(outputFolder);
    }
    const watcher = chokidar_1.default.watch(inputFolder, {
        persistent: true,
        ignored: '*.tmp',
        ignoreInitial: true,
    });
    watcher.on('add', (filePath) => {
        if (path_1.default.extname(filePath).toLowerCase() === '.pdf') {
            pdfToPng(filePath, outputFolder);
        }
    });
    console.log(`Watching directory: ${inputFolder}`);
}
exports.startWatching = startWatching;
