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

interface Displayable{
    display(context: CanvasRenderingContext2D): void;
}

class MarkerLine implements Displayable{
    private points: { x: number; y: number; }[] = [];
    private lineWidth: number;

    constructor(initialPoint: { x: number; y: number; }, lineWidth: number) {
        this.points.push(initialPoint);
        this.lineWidth = lineWidth;
    }

    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D): void {
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

const lines: Displayable[] = [];
const redoLines: Displayable[] = [];

let currentLine: MarkerLine | null = null;
let currentLineWidth = 3;
let selectedButton: HTMLButtonElement | null = null;

const cursor = {active: false, x: 0, y: 0};

canvas.addEventListener("mousedown", (event) =>{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    currentLine = new MarkerLine({x: cursor.x, y: cursor.y}, currentLineWidth);
    lines.push(currentLine);
    redoLines.length = 0;
})

canvas.addEventListener("mousemove", (event) =>{
    if(cursor.active && currentLine){
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine.drag(cursor.x, cursor.y );
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
})

canvas.addEventListener("mouseup", () =>{
    cursor.active = false;
    currentLine = null;
})

canvas.addEventListener("drawing-changed", () => {
    redraw();
});

function redraw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => line.display(ctx));
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
                currentLineWidth = 3;
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
                currentLineWidth = 3;
            }
            updateSelectedButton(null);
        }
    },
    {
        name: "Thin Marker",
        onClick: () => {
            currentLineWidth = 1;
            updateSelectedButton(thinMarkerButton);
        }
    },{
        name: "Thick Marker",
        onClick: () => {
            currentLineWidth = 5;
            updateSelectedButton(thickMarkerButton);
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

function updateSelectedButton(button: HTMLButtonElement | null) {
    if (selectedButton) {
        selectedButton.classList.remove("selectedTool");
    }
    if (button) {
        button.classList.add("selectedTool");
    }
    selectedButton = button;
}