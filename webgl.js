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

    // 更新 GPU 裡的資料
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
}

// ── Shader ──────────────────────────────────────
const vertexShaderSource = `#version 300 es
in vec3 aPos;
in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vNormal;
out vec3 vFragPos;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    vFragPos = vec3(uModel * vec4(aPos, 1.0));
    vNormal = aNormal;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vFragPos;

out vec4 fragColor;

void main() {
    // 光源位置
    vec3 lightPos = vec3(5.0, 5.0, 5.0);
    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    vec3 objectColor = vec3(0.0, 0.8, 0.8);  // 青色
    
    // 環境光
    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * lightColor;
    
    // 漫反射
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(lightPos - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;
    
    vec3 result = (ambient + diffuse) * objectColor;
    fragColor = vec4(result, 1.0);
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

const ibo = gl.createBuffer();
gl.enable(gl.DEPTH_TEST);
// render
function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 更新 view 矩陣（根據旋轉角度）
    const view = mat4.create();
    let eyeX = 4 * Math.cos(rotZ) * Math.cos(rotX);
    let eyeY = 4 * Math.sin(rotZ) * Math.cos(rotX);
    let eyeZ = 4 * Math.sin(rotX);
    mat4.lookAt(view, [eyeX, eyeY, eyeZ], [0,0,0], [0,0,1]);
    
   
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, projection);

    // 送進 GPU
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);

    const normLoc = gl.getAttribLocation(program, 'aNormal');
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normLoc);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    
}

render();  // 第一次畫
