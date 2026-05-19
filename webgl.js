// 旋轉角度（interaction.js 也會用到）
let rotX = 0.5;
let rotZ = 0.5;


let knot = [0,0,0,1,1,1];
let ctrl = [
[[-1,-1,0], [0,-1,1], [1,-1,0]],
[[-1, 0,1], [0, 0,2], [1, 0,1]],
[[-1, 1,0], [0, 1,1], [1, 1,0]]
];

// 算出所有點，存成一個大陣列
let vertices = [];
let normals = [];
let wireVertices = []; 
const steps = 30;

for (let ui = 0; ui <= steps; ui++) {
    for (let vi = 0; vi <= steps; vi++) {
        let u = ui / steps;
        let v = vi / steps;
        let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
        vertices.push(p[0], p[1], p[2]);
        let n = computeNormal(ctrl, knot, 2, 2, u, v); 
        normals.push(n[0], n[1], n[2]);
    }
    
}

console.log("點的數量:", vertices.length / 3);



let indices = [];

for (let vi = 0; vi < steps; vi++) {
    for (let ui = 0; ui < steps; ui++) {
        let a = vi * (steps + 1) + ui;
        let b = vi * (steps + 1) + ui + 1;
        let c = (vi + 1) * (steps + 1) + ui;
        let d = (vi + 1) * (steps + 1) + ui + 1;

        // 三角形1
        indices.push(a, c, b);
        // 三角形2
        indices.push(c, d, b);
    }
}

// 重新計算點
function updateVertices() {
    vertices = [];
    normals = [];
    wireVertices = []; 
    for (let ui = 0; ui <= steps; ui++) {
        for (let vi = 0; vi <= steps; vi++) {
            let u = ui / steps;
            let v = vi / steps;
            let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
            vertices.push(p[0], p[1], p[2]);

            let n = computeNormal(ctrl, knot, 2, 2, u, v); 
            normals.push(n[0], n[1], n[2]);
        }
    }
    // 計算等參網格面
    for (let vi = 0; vi <= wireLines; vi++) {
        let v = vi / wireLines;
        for (let ui = 0; ui <= steps; ui++) {
            let u = ui / steps;
            let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
            wireVertices.push(p[0], p[1], p[2]);
        }
    }
    for (let ui = 0; ui <= wireLines; ui++) {
        let u = ui / wireLines;
        for (let vi = 0; vi <= steps; vi++) {
            let v = vi / steps;
            let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
            wireVertices.push(p[0], p[1], p[2]);
        }
    }


    // 更新 GPU 裡的資料
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, wireVbo); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireVertices), gl.DYNAMIC_DRAW);
}

// ── Shader ──────────────────────────────────────
const vertexShaderSource = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
in vec3 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform bool uUseLight;

out vec3 vNormal;
out vec3 vFragPos;
out vec3 vColor;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    vFragPos = vec3(uModel * vec4(aPos, 1.0));
    vNormal = aNormal;
    vColor = aColor;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vFragPos;
in vec3 vColor;

uniform bool uUseLight;
out vec4 fragColor;

void main() {
    if (uUseLight) {
        // 根據高度（z）做顏色 gradient
        // vFragPos.z 是這個點的 z 座標
        float t = clamp((vFragPos.z + 1.0) / 3.0, 0.0, 1.0);
        
        // 從深藍到青色
        vec3 colorLow  = vec3(0.15, 0.3, 0.5);  // 低處深色
        vec3 colorHigh = vec3(0.0, 1.0, 1.0);  // 高處亮色
        
        vec3 color = mix(colorLow, colorHigh, t);
        fragColor = vec4(color, 1.0);
    } else {
        fragColor = vec4(vColor, 1.0);
    }
}
`;
// ── 編譯 Shader ──────────────────────────────────
function compileShader(type, source) {
const shader = gl.createShader(type);
gl.shaderSource(shader, source);
gl.compileShader(shader);
return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// ── VBO ──────────────────────────────────────────
const vao = gl.createVertexArray();
const vbo = gl.createBuffer();

gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(program, 'aPos');
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(posLoc);


// ── 座標軸 ───────────────────────────────────────
const axisVertices = new Float32Array([
    // X 軸
    0, 0, 0,   2, 0, 0,
    // Y 軸
    0, 0, 0,   0, 2, 0,
    // Z 軸
    0, 0, 0,   0, 0, 2,
]);

const axisColors = new Float32Array([
    1, 0, 0,   1, 0, 0,  // X 紅
    0, 1, 0,   0, 1, 0,  // Y 綠
    0, 0, 1,   0, 0, 1,  // Z 藍
]);

// 假法向量（座標軸不需要光照）
const axisNormals = new Float32Array([
    0,0,1, 0,0,1,
    0,0,1, 0,0,1,
    0,0,1, 0,0,1,
]);

// ── XY 平面網格 ──────────────────────────────────
const gridSize = 4;
const gridStep = 1;
let gridVertices = [];
let gridColors = [];

for (let i = -gridSize; i <= gridSize; i++) {
    // 平行 X 軸的線
    gridVertices.push(-gridSize, i, 0,  gridSize, i, 0);
    // 平行 Y 軸的線
    gridVertices.push(i, -gridSize, 0,  i, gridSize, 0);
    
    // 顏色：X 軸紅，Y 軸綠，其他灰色
    let color = i === 0 ? [1, 0, 0] : [0.3, 0.3, 0.3];
    gridColors.push(...color, ...color);
    color = i === 0 ? [0, 1, 0] : [0.3, 0.3, 0.3];
    gridColors.push(...color, ...color);
}

const gridNormals = new Float32Array(gridVertices.length).fill(0);
for (let i = 2; i < gridVertices.length; i += 3) gridNormals[i] = 1;

// ── 曲面等參線 ────────────────────────────────────
let wireColors = [];
const wireLines = 10;  // 幾條等參線

// 固定 v，畫 u 方向
for (let vi = 0; vi <= wireLines; vi++) {
    let v = vi / wireLines;
    for (let ui = 0; ui <= steps; ui++) {
        let u = ui / steps;
        let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
        wireVertices.push(p[0], p[1], p[2]);
        wireColors.push(1.0, 1.0, 1.0);  // 白色
    }
}

// 固定 u，畫 v 方向
for (let ui = 0; ui <= wireLines; ui++) {
    let u = ui / wireLines;
    for (let vi = 0; vi <= steps; vi++) {
        let v = vi / steps;
        let p = surface_point(ctrl, knot, knot, 2, 2, u, v);
        wireVertices.push(p[0], p[1], p[2]);
        wireColors.push(0.8, 0.8, 0.8);  // 白色
    }
}

const wireNormals = new Float32Array(wireVertices.length).fill(0);
for (let i = 2; i < wireNormals.length; i += 3) wireNormals[i] = 1;

// ── 座標的VAO───────────────────────────────────────────

const axisVao = gl.createVertexArray();
gl.bindVertexArray(axisVao);

// 頂點
const axisVbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, axisVbo);
gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(posLoc);

// 法向量
const axisNbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, axisNbo);
gl.bufferData(gl.ARRAY_BUFFER, axisNormals, gl.STATIC_DRAW);
const normLoc = gl.getAttribLocation(program, 'aNormal');
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(normLoc);

// 顏色
const colorLoc = gl.getAttribLocation(program, 'aColor');
const axisCbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, axisCbo);
gl.bufferData(gl.ARRAY_BUFFER, axisColors, gl.STATIC_DRAW);
gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(colorLoc);

//網格座標
const gridVao = gl.createVertexArray();
gl.bindVertexArray(gridVao);

const gridVbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, gridVbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(posLoc);

const gridNbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, gridNbo);
gl.bufferData(gl.ARRAY_BUFFER, gridNormals, gl.STATIC_DRAW);
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(normLoc);

const gridCbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, gridCbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridColors), gl.STATIC_DRAW);
gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(colorLoc);

const wireVao = gl.createVertexArray();
gl.bindVertexArray(wireVao);

const wireVbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, wireVbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireVertices), gl.STATIC_DRAW);
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(posLoc);

const wireNbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, wireNbo);
gl.bufferData(gl.ARRAY_BUFFER, wireNormals, gl.STATIC_DRAW);
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(normLoc);

const wireCbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, wireCbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireColors), gl.STATIC_DRAW);
gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(colorLoc);

// ── 曲面的VAO───────────────────────────────────────────
gl.bindVertexArray(vao);

// 法向量
const nbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);  
gl.enableVertexAttribArray(normLoc);

// 顏色
const surfaceColors = new Float32Array(vertices.length).fill(0);
for (let i = 0; i < vertices.length / 3; i++) {
    surfaceColors[i*3]   = 0.0;
    surfaceColors[i*3+1] = 0.8;
    surfaceColors[i*3+2] = 0.8;
}
const cbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
gl.bufferData(gl.ARRAY_BUFFER, surfaceColors, gl.STATIC_DRAW);
gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0); 
gl.enableVertexAttribArray(colorLoc);

// ── 畫 ───────────────────────────────────────────
gl.useProgram(program);

const model = mat4.create();

// 攝影機
const view = mat4.create();
mat4.lookAt(view,
[3, 3, 3],   // 攝影機位置
[0, 0, 0],   // 看哪裡
[0, 0, 1]    // 上方向
);

// projrction 
const projection = mat4.create();

mat4.perspective(projection,
Math.PI / 4,              // 視角 45度
canvas.width / canvas.height,  // 寬高比
0.1,                      // 近平面
100.0                     // 遠平面
)

function updateAxisLabels(view, projection) {
    const points = {
        'label-x': [3, 0, 0],
        'label-y': [0, 3, 0],
        'label-z': [0, 0, 3],
    };

    const canvas = document.getElementById('glCanvas');

    for (let [id, pos] of Object.entries(points)) {
        // 把 3D 座標轉成螢幕座標
        let v = vec4.fromValues(pos[0], pos[1], pos[2], 1.0);
        let mvp = mat4.create();
        mat4.multiply(mvp, projection, view);
        vec4.transformMat4(v, v, mvp);

        // 透視除法
        let x = v[0] / v[3];
        let y = v[1] / v[3];

        // 轉成螢幕像素
        let sx = (x + 1) / 2 * canvas.width;
        let sy = (1 - y) / 2 * canvas.height;

        let label = document.getElementById(id);
        label.style.left = sx + 'px';
        label.style.top = sy + 'px';
    }
}

const ibo = gl.createBuffer();
gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
// render
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const view = mat4.create();
    let eyeX = 4 * Math.cos(rotZ) * Math.cos(rotX);
    let eyeY = 4 * Math.sin(rotZ) * Math.cos(rotX);
    let eyeZ = 4 * Math.sin(rotX);
    mat4.lookAt(view, [eyeX, eyeY, eyeZ], [0,0,0], [0,0,1]);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, projection);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);

    // 畫曲面
    gl.uniform1i(gl.getUniformLocation(program, 'uUseLight'), 1);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);  // ← 加這行

    // 畫座標軸
    gl.uniform1i(gl.getUniformLocation(program, 'uUseLight'), 0);
    gl.bindVertexArray(axisVao);
    gl.drawArrays(gl.LINES, 0, 6);
    updateAxisLabels(view, projection);
    
    // 畫網格
    gl.uniform1i(gl.getUniformLocation(program, 'uUseLight'), 0);
    gl.bindVertexArray(gridVao);
    gl.drawArrays(gl.LINES, 0, gridVertices.length / 3);

    // 畫等參線
    gl.uniform1i(gl.getUniformLocation(program, 'uUseLight'), 0);
    gl.bindVertexArray(wireVao);
    for (let i = 0; i <= wireLines * 2 + 1; i++) {
        gl.drawArrays(gl.LINE_STRIP, i * (steps + 1), steps + 1);
    }
}
resizeCanvas();
render();  // 第一次畫
