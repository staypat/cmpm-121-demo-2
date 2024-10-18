import "./style.css";

const APP_NAME = "Sketch Pad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

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

    constructor(initialPoint: { x: number; y: number; }, lineWidth: number) {
        this.points.push(initialPoint);
        this.lineWidth = lineWidth;
    }

    updatePosition(x: number, y: number): void {
        this.points.push({ x, y });
    }

    execute(context: CanvasRenderingContext2D): void {
        if (this.points.length > 1) {
            context.lineWidth = this.lineWidth;
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

    constructor(lineWidth: number) {
        this.lineWidth = lineWidth;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    display(context: CanvasRenderingContext2D): void {
        context.lineWidth = 1;
        context.strokeStyle = "gray";
        context.beginPath();
        context.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
        context.stroke();
    }
}

class StickerPreviewCommand implements Command {
    private x: number;
    private y: number;
    private sticker: string;
    private size: number;

    constructor(sticker: string, size: number) {
        this.x = 0;
        this.y = 0;
        this.sticker = sticker;
        this.size = size;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    execute(context: CanvasRenderingContext2D): void {
        context.font = `${this.size}px Arial`;
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillText(this.sticker, this.x, this.y);
    }
}

class StickerPlacementCommand implements Command {
    private x: number;
    private y: number;
    private sticker: string;
    private size: number;

    constructor(sticker: string, size: number, initialX: number, initialY: number) {
        this.sticker = sticker;
        this.size = size;
        this.x = initialX;
        this.y = initialY;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    execute(context: CanvasRenderingContext2D): void {
        context.font = `${this.size}px Arial`;
        context.fillStyle = 'black';
        context.fillText(this.sticker, this.x, this.y);
    }
}

const lines: Command[] = [];
const redoLines: Command[] = [];
let currentCommand: Command | null = null;
let previewCommand: StickerPreviewCommand | null = null;
let toolPreview: ToolPreview | null = new ToolPreview(3);
let currentLineWidth = 3;
let selectedSticker: string | null = null;
let selectedButton: HTMLButtonElement | null = null;

const stickers = ["🪄", "✨", "🔮"];
const stickerButtons: HTMLButtonElement[] = [];

canvas.addEventListener("mousedown", (event) => {
    if (selectedSticker) {
        currentCommand = new StickerPlacementCommand(selectedSticker, 30, event.offsetX, event.offsetY);
        currentCommand.execute(ctx);
        lines.push(currentCommand);
    } else {
        currentCommand = new MarkerLine({ x: event.offsetX, y: event.offsetY }, currentLineWidth);
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
        toolPreview = new ToolPreview(currentLineWidth);
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
            toolPreview = new ToolPreview(currentLineWidth);
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
            currentLineWidth = 1;
            toolPreview = new ToolPreview(currentLineWidth);
            updateSelectedButton(thinMarkerButton);
            selectedSticker = null;
            previewCommand = null;
        }
    },
    {
        name: "Thick Marker",
        onClick: () => {
            currentLineWidth = 5;
            toolPreview = new ToolPreview(currentLineWidth);
            updateSelectedButton(thickMarkerButton);
            selectedSticker = null;
            previewCommand = null;
        }
    }
];

let thinMarkerButton: HTMLButtonElement;
let thickMarkerButton: HTMLButtonElement;

toolBar.forEach(tool => {
    const button = document.createElement("button");
    button.innerHTML = tool.name;
    app.append(button);
    button.addEventListener("click", tool.onClick);

    if (tool.name === "Thin Marker") {
        thinMarkerButton = button;
    } else if (tool.name === "Thick Marker") {
        thickMarkerButton = button;
    }
});

stickers.forEach(sticker => {
    const button = document.createElement("button");
    button.innerHTML = sticker;
    app.append(button);
    stickerButtons.push(button);

    button.addEventListener("click", () => {
        selectedSticker = sticker;
        previewCommand = new StickerPreviewCommand(sticker, 30);
        updateSelectedButton(button);
        canvas.dispatchEvent(new Event("tool-moved"));
    });
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