let canvas = document.getElementById("drawing-board");
let ctx = canvas.getContext("2d");
let eraser = document.getElementById("eraser");
let brush = document.getElementById("brush");
let reSetCanvas = document.getElementById("clear");
let aColorBtn = document.getElementsByClassName("color-item");
let save = document.getElementById("save");
let undo = document.getElementById("undo");
let range = document.getElementById("range");
let clear = false;
let activeColor = "black";
let lWidth = 4;

autoSetSize(canvas);

setCanvasBg("white");

listenToUser(canvas);

getColor();

// window.onbeforeunload = function () {
//   return "Reload site?";
// };

function autoSetSize(canvas) {
    canvasSetSize();

    function canvasSetSize() {
        let pageWidth = document.documentElement.clientWidth;
        let pageHeight = document.documentElement.clientHeight;

        canvas.width = pageWidth / 2;
        canvas.height = pageHeight;
    }

    window.onresize = function() {
        canvasSetSize();
    };
}

function setCanvasBg(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
}

function listenToUser(canvas) {
    let painting = false;
    let lastPoint = { x: undefined, y: undefined };

    if (document.body.ontouchstart !== undefined) {
        canvas.ontouchstart = function(e) {
            this.firstDot = ctx.getImageData(0, 0, canvas.width, canvas.height); //在这里储存绘图表面
            saveData(this.firstDot);
            painting = true;
            let x = e.touches[0].clientX;
            let y = e.touches[0].clientY;
            lastPoint = { x: x, y: y };
            ctx.save();
            drawCircle(x, y, 0);
        };
        canvas.ontouchmove = function(e) {
            if (painting) {
                let x = e.touches[0].clientX;
                let y = e.touches[0].clientY;
                let newPoint = { x: x, y: y };
                drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y);
                lastPoint = newPoint;
            }
        };

        canvas.ontouchend = function() {
            painting = false;
        };
    } else {
        canvas.onmousedown = function(e) {
            this.firstDot = ctx.getImageData(0, 0, canvas.width, canvas.height); //在这里储存绘图表面
            saveData(this.firstDot);
            painting = true;
            let x = e.clientX;
            let y = e.clientY;
            lastPoint = { x: x, y: y };
            ctx.save();
            drawCircle(x, y, 0);
        };
        canvas.onmousemove = function(e) {
            if (painting) {
                let x = e.clientX;
                let y = e.clientY;
                let newPoint = { x: x, y: y };
                drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y, clear);
                lastPoint = newPoint;
            }
        };

        canvas.onmouseup = function() {
            painting = false;
        };

        canvas.mouseleave = function() {
            painting = false;
        };
    }
}

function drawCircle(x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (clear) {
        ctx.clip();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.lineWidth = lWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (clear) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    } else {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }
}

range.onchange = function() {
    lWidth = this.value;
};

eraser.onclick = function() {
    clear = true;
    this.classList.add("active");
    brush.classList.remove("active");
};

brush.onclick = function() {
    clear = false;
    this.classList.add("active");
    eraser.classList.remove("active");
};

reSetCanvas.onclick = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBg("white");
};

save.onclick = function() {
    let imgUrl = canvas.toDataURL("image/png");
    let saveA = document.createElement("a");
    document.body.appendChild(saveA);
    saveA.href = imgUrl;
    saveA.download = "zspic" + new Date().getTime();
    saveA.target = "_blank";
    saveA.click();
};

function getColor() {
    for (let i = 0; i < aColorBtn.length; i++) {
        aColorBtn[i].onclick = function() {
            for (let i = 0; i < aColorBtn.length; i++) {
                aColorBtn[i].classList.remove("active");
                this.classList.add("active");
                activeColor = this.style.backgroundColor;
                ctx.fillStyle = activeColor;
                ctx.strokeStyle = activeColor;
            }
        };
    }
}

let historyDeta = [];

function saveData(data) {
    historyDeta.length === 10 && historyDeta.shift(); // 上限为储存10步，太多了怕挂掉
    historyDeta.push(data);
}

undo.onclick = function() {
    if (historyDeta.length < 1) return false;
    ctx.putImageData(historyDeta[historyDeta.length - 1], 0, 0);
    historyDeta.pop();
};

// document.addEventListener("keyup", function (event) {
//   event.preventDefault();
//   var map = new HashMap();
//   if (event.keyCode === 13) {
//     for (var i = 1; i <= canvas.width; i++) {
//       for (var j = 1; j <= canvas.width; j++) {
//         var c = ctx.getImageData(i, j, 1, 1).data;
//         if (c[0] === 255 && c[1] === 255 && c[2] === 255) {
//           continue;
//         } else {
//           var curRGB = c[0] + "." + c[1] + "." + c[2];
//           map.put(curRGB, curRGB);
//         }
//       }
//     }
//     console.log(map.size());
//     console.log(map.keySet());
//   }
// });

var img1Context = document.getElementById('examples-image');
var img1Ctx = img1Context.getContext("2d");
var img = document.getElementById("examples-img");

var img = new Image();
img.onload = function() {
    img1Ctx.drawImage(img, 0, 0, 300, 150);
}
img.src = './img/example-img.png';

document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        var pageWidth = document.documentElement.clientWidth,
            pageHeight = document.documentElement.clientHeight;
        var width = pageWidth / 2,
            height = pageHeight;

        var img1Context = document.getElementById('examples-image').getContext("2d"),
            img2Context = document.getElementById('drawing-board').getContext("2d"),
            diffContext = document.getElementById('diff-canvas').getContext("2d");

        var img1 = img1Context.getImageData(0, 0, width, height);
        var img2 = img2Context.getImageData(0, 0, width, height);
        // console.log(img1);
        // console.log(img2);
        var diff = diffContext.createImageData(width, height);

        var result = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
        alert(result);
        diffContext.putImageData(diff, 0, 0);
    }
});