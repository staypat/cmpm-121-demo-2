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

    constructor(initialPoint: { x: number; y: number; }) {
        this.points.push(initialPoint);
    }

    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D): void {
        if (this.points.length > 1) {
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

const cursor = {active: false, x: 0, y: 0};

canvas.addEventListener("mousedown", (event) =>{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    currentLine = new MarkerLine({x: cursor.x, y: cursor.y});
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

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);
clearButton.addEventListener("click", () =>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
    redoLines.length = 0;
})

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);
undoButton.addEventListener("click", () =>{
    const lastLine = lines.pop();
    if(lastLine){
        redoLines.push(lastLine);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
})

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);
redoButton.addEventListener("click", () =>{
    const lastRedoLine = redoLines.pop();
    if(lastRedoLine){
        lines.push(lastRedoLine);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
})