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

const lines: { x: number; y: number; }[][] = [];

let currentLine: { x: number; y: number; }[] | null = null;

const cursor = {active: false, x: 0, y: 0};

canvas.addEventListener("mousedown", (event) =>{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    currentLine = [];
    lines.push(currentLine);
    currentLine.push({x: cursor.x, y: cursor.y});
})

canvas.addEventListener("mousemove", (event) =>{
    if(cursor.active && currentLine){
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine.push({ x: cursor.x, y: cursor.y });
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
    lines.forEach(line => {
        if(line.length > 1){
            ctx.beginPath();
            const {x, y} = line[0];
            ctx.moveTo(x, y);
            for(const {x, y} of line){
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    });
}

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);
clearButton.addEventListener("click", () =>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
})