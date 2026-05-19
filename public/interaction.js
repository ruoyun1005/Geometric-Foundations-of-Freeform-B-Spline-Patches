console.log('interaction.js 載入了！');

// 滑桿控制事件

function setupSliders(){
    console.log('setupSliders 執行了！'); 
    const sliders = [
        { id: 's01', display: 'v01', i: 0, j: 1 },
        { id: 's10', display: 'v10', i: 1, j: 0 },
        { id: 's11', display: 'v11', i: 1, j: 1 },
        { id: 's12', display: 'v12', i: 1, j: 2 },
        { id: 's21', display: 'v21', i: 2, j: 1 },
    ];
    sliders.forEach(({id, display, i, j}) => {
        console.log('slider');
        const slider = document.getElementById(id);
        console.log('id');
        const label = document.getElementById(display);

        slider.addEventListener('input', () => {
            console.log('滑桿移動！', i, j, slider.value);
            ctrl[i][j][2] = parseFloat(slider.value);  // parseFloat : 把字串變成小數
            label.textContent = slider.value;          // 更新顯示數值
            updateVertices();                          // 重新算所有點
            render();                                  // 重新畫
        });
    });
}
setupSliders();
// 滑鼠狀態
let isDragging = false;
let lastX = 0;
let lastY = 0;

// 滑鼠事件
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    let dx = e.clientX - lastX;
    let dy = e.clientY - lastY;

    rotZ += dx * 0.01;  // 左右拖曳 → 繞 Z 軸轉
    rotX += dy * 0.01;  // 上下拖曳 → 繞 X 軸轉

    lastX = e.clientX;
    lastY = e.clientY;

    render();  // 重新畫
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

