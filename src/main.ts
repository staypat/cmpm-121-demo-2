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

const cursor = {active: false, x: 0, y: 0};

canvas.addEventListener("mousedown", (event) =>{
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
})

canvas.addEventListener("mousemove", (event) =>{
    if(cursor.active){
        ctx.beginPath();
        ctx.moveTo(cursor.x, cursor.y);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
    }
})

canvas.addEventListener("mouseup", () =>{
    cursor.active = false;
})

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);
clearButton.addEventListener("click", () =>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
})