import "./style.css";

const CANVAS_SIZE = 256;
const THIN_MARKER_WIDTH = 1;
const THICK_MARKER_WIDTH = 5;
const SCALE_FACTOR = 4;
const STICKER_SIZE = 30;
const EXPORT_CANVAS_SIZE = 1024;

const APP_NAME = "Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.style.display = "flex";
app.style.flexDirection = "column";
app.style.alignItems = "center";
app.style.justifyContent = "center";
app.style.height = "100vh";

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
header.style.marginBottom = "20px";
app.append(header);

const canvasWrapper = document.createElement("div");
canvasWrapper.style.display = "flex";
canvasWrapper.style.justifyContent = "center";
canvasWrapper.style.alignItems = "center";
canvasWrapper.style.marginBottom = "20px";

const canvas = document.createElement("canvas");
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
canvas.style.border = "1px solid #fff";
canvasWrapper.append(canvas);
app.append(canvasWrapper);

const ctx = canvas.getContext("2d")!;

interface Command {
    execute(context: CanvasRenderingContext2D): void;
    updatePosition(x: number, y: number): void;
}

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}

class MarkerLine implements Command {
    private points: { x: number; y: number; }[] = [];
    private lineWidth: number;
    private color: string;

    constructor(initialPoint: { x: number; y: number; }, lineWidth: number, color: string) {
        this.points.push(initialPoint);
        this.lineWidth = lineWidth;
        this.color = color;
    }

    updatePosition(x: number, y: number): void {
        this.points.push({ x, y });
    }

    execute(context: CanvasRenderingContext2D): void {
        if (this.points.length > 1) {
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.color;
            context.beginPath();
            const { x, y } = this.points[0];
            context.moveTo(x, y);
            for (const { x, y } of this.points) {
                context.lineTo(x, y);
            }
            context.stroke();
        }
    }
}

class ToolPreview implements Displayable {
    private x: number = 0;
    private y: number = 0;
    private lineWidth: number;
    private color: string;

    constructor(lineWidth: number, color: string) {
        this.lineWidth = lineWidth;
        this.color = color;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    display(context: CanvasRenderingContext2D): void {
        context.save();
        context.lineWidth = this.lineWidth;
        context.strokeStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }
}

class StickerPreviewCommand implements Command {
    private x: number;
    private y: number;
    private sticker: string;
    private size: number;
    private rotation: number;

    constructor(sticker: string, size: number = STICKER_SIZE, rotation: number = 0) {
        this.x = 0;
        this.y = 0;
        this.sticker = sticker;
        this.size = size;
        this.rotation = rotation;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    execute(context: CanvasRenderingContext2D): void {
        context.save();
        context.font = `${this.size}px Arial`;
        context.translate(this.x, this.y);
        context.rotate(this.rotation * Math.PI / 180);
        context.translate(-this.x, -this.y);
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillText(this.sticker, this.x, this.y);
        context.restore();
    }
}

class StickerPlacementCommand implements Command {
    private x: number;
    private y: number;
    private sticker: string;
    private size: number;
    private rotation: number;

    constructor(sticker: string, size: number, initialX: number, initialY: number, rotation: number = 0) {
        this.sticker = sticker;
        this.size = size;
        this.x = initialX;
        this.y = initialY;
        this.rotation = rotation;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    execute(context: CanvasRenderingContext2D): void {
        context.save();
        context.font = `${this.size}px Arial`;
        context.translate(this.x, this.y);
        context.rotate(this.rotation * Math.PI / 180);
        context.translate(-this.x, -this.y);
        context.fillStyle = 'black';
        context.fillText(this.sticker, this.x, this.y);
        context.restore();
    }
}

const lines: Command[] = [];
const redoLines: Command[] = [];
let currentCommand: Command | null = null;
let previewCommand: StickerPreviewCommand | null = null;
let toolPreview: ToolPreview | null = new ToolPreview(THIN_MARKER_WIDTH, "#000000");
let currentLineWidth = 3;
let selectedSticker: string | null = null;
let selectedButton: HTMLButtonElement | null = null;
let currentColor: string = "#000000";
let currentRotation: number = 0;
let thinMarkerButton: HTMLButtonElement;
let thickMarkerButton: HTMLButtonElement;

function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomRotation(): number {
    return Math.floor(Math.random() * 360);
}

function randomizeMarkerColor() {
    currentColor = getRandomColor();
    toolPreview = new ToolPreview(currentLineWidth, currentColor);
}

function randomizeStickerRotation() {
    currentRotation = getRandomRotation();
    if (selectedSticker && previewCommand) {
        previewCommand = new StickerPreviewCommand(selectedSticker, STICKER_SIZE, currentRotation);
    }
}

const colorOptions = ["#FF0000", "#FFFF00", "#00FF00", "#0000FF"];
const colorContainer = document.createElement("div");
colorContainer.style.display = "flex";
colorContainer.style.justifyContent = "center";
colorContainer.style.marginBottom = "20px";
app.append(colorContainer);

function createButton(
    label: string,
    backgroundColor: string | null,
    onClick: () => void,
    container: HTMLDivElement
): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = label;
    
    if (backgroundColor) {
        button.style.backgroundColor = backgroundColor;
    }
    
    button.style.margin = "0 5px";
    button.addEventListener("click", onClick);
    container.append(button);

    return button;
}

colorOptions.forEach(color => {
    createButton(
        "", // No label as color buttons use background
        color,
        () => {
            currentColor = color;
            toolPreview = new ToolPreview(currentLineWidth, currentColor);
            selectedSticker = null;
            previewCommand = null;
            updateSelectedButton(null);
        },
        colorContainer
    );
});

canvas.addEventListener("mousedown", (event) => {
    if (selectedSticker) {
        currentCommand = new StickerPlacementCommand(selectedSticker, STICKER_SIZE, event.offsetX, event.offsetY, currentRotation);
        currentCommand.execute(ctx);
        lines.push(currentCommand);
    } else {
        currentCommand = new MarkerLine({ x: event.offsetX, y: event.offsetY }, currentLineWidth, currentColor);
        lines.push(currentCommand);
        redoLines.length = 0;
        toolPreview = null;
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
    if (toolPreview !== null) {
        toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    if (previewCommand !== null) {
        previewCommand.updatePosition(event.offsetX, event.offsetY);
    }
    if (currentCommand && !(currentCommand instanceof StickerPlacementCommand)) {
        currentCommand.updatePosition(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
        canvas.dispatchEvent(new Event("tool-moved"));
    }
});

canvas.addEventListener("mouseup", () => {
    if (!(currentCommand instanceof StickerPlacementCommand)) {
        currentCommand = null;
        toolPreview = new ToolPreview(currentLineWidth, currentColor);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
    redraw();
});

canvas.addEventListener("tool-moved", () => {
    redraw();
    if (toolPreview !== null) {
        toolPreview.display(ctx);
    }
    if (previewCommand !== null) {
        previewCommand.execute(ctx);
    }
});

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => line.execute(ctx));
}

interface Tool {
    name: string;
    onClick: () => void;
}

const toolBar: Tool[] = [
    {
        name: "Clear",
        onClick: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            lines.length = 0;
            redoLines.length = 0;
            currentLineWidth = 3;
            toolPreview = new ToolPreview(currentLineWidth, "#000000");
            selectedSticker = null;
            previewCommand = null;
            updateSelectedButton(null);
        }
    },
    {
        name: "Undo",
        onClick: () => {
            const lastLine = lines.pop();
            if (lastLine) {
                redoLines.push(lastLine);
                canvas.dispatchEvent(new Event("drawing-changed"));
            }
            updateSelectedButton(null);
        }
    },
    {
        name: "Redo",
        onClick: () => {
            const lastRedoLine = redoLines.pop();
            if (lastRedoLine) {
                lines.push(lastRedoLine);
                canvas.dispatchEvent(new Event("drawing-changed"));
            }
            updateSelectedButton(null);
        }
    },
    {
        name: "Thin Marker",
        onClick: () => {
            currentLineWidth = THIN_MARKER_WIDTH;
            randomizeMarkerColor();
            updateSelectedButton(thinMarkerButton);
            selectedSticker = null;
            previewCommand = null;
        }
    },
    {
        name: "Thick Marker",
        onClick: () => {
            currentLineWidth = THICK_MARKER_WIDTH;
            randomizeMarkerColor();
            updateSelectedButton(thickMarkerButton);
            selectedSticker = null;
            previewCommand = null;
        }
    },
    {
        name: "Export",
        onClick: () => {
            exportCanvas();
        }
    },
    {
        name: "Custom Sticker",
        onClick: () => {
            addCustomSticker();
        }
    },
];

const toolContainer = document.createElement("div");
toolContainer.style.display = "flex";
toolContainer.style.justifyContent = "center";
toolContainer.style.marginTop = "20px";
app.append(toolContainer);

toolBar.forEach(tool => {
    const button = createButton(
        tool.name, 
        null,
        tool.onClick,
        toolContainer
    );

    if (tool.name === "Thin Marker") {
        thinMarkerButton = button;
    } else if (tool.name === "Thick Marker") {
        thickMarkerButton = button;
    }
});

const stickers = ["🪄", "✨", "🔮"];
const stickerButtons: HTMLButtonElement[] = [];

const stickerContainer = document.createElement("div");
stickerContainer.style.display = "flex";
stickerContainer.style.justifyContent = "center";
stickerContainer.style.marginTop = "10px";
app.append(stickerContainer);

stickers.forEach(sticker => {
    const button = createButton(
        sticker, 
        null,
        () => {
            selectedSticker = sticker;
            previewCommand = new StickerPreviewCommand(sticker, STICKER_SIZE, currentRotation);
            updateSelectedButton(button);
            canvas.dispatchEvent(new Event("tool-moved"));
            randomizeStickerRotation();
        },
        stickerContainer
    );
    stickerButtons.push(button);
});

function updateSelectedButton(button: HTMLButtonElement | null) {
    if (selectedButton) {
        selectedButton.classList.remove("selectedTool");
    }
    if (button) {
        button.classList.add("selectedTool");
    }
    selectedButton = button;
}

function addCustomSticker(): void {
    const customSticker = prompt("Enter your custom sticker:", "🎇");

    if (customSticker !== null && stickers.indexOf(customSticker) === -1) {
        stickers.push(customSticker);
        const button = createButton(
            customSticker, 
            null,
            () => {
                selectedSticker = customSticker;
                previewCommand = new StickerPreviewCommand(customSticker, STICKER_SIZE, currentRotation);
                updateSelectedButton(button);
                canvas.dispatchEvent(new Event("tool-moved"));
                randomizeStickerRotation();
            },
            stickerContainer
        );
        stickerButtons.push(button);
    }
}

function exportCanvas(): void {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_CANVAS_SIZE;
    exportCanvas.height = EXPORT_CANVAS_SIZE;
    const exportCtx = exportCanvas.getContext("2d");

    if (exportCtx) {
        exportCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
        lines.forEach(line => line.execute(exportCtx));
        const anchor = document.createElement("a");
        anchor.href = exportCanvas.toDataURL("image/png");
        anchor.download = "sketchpad.png";
        anchor.click();
    }
}