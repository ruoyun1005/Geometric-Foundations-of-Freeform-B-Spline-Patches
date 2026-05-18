


function N(n, i, u, knot) {
    if(n == 0){
        // 一般情況：左閉右開
    if (knot[i-1] <= u && u < knot[i])
        return 1.0;
    // 特殊情況：u 剛好等於最後一個節點（右端點）
    if (u == knot[knot.length - 1] && u == knot[i])
        return 1.0;
    return 0.0;
    }
    
    // 左式
    let left_num = u - knot[i-1];
    let left_den = knot[i+n-1] - knot[i-1];
    let left = 0.0;
    if (left_den != 0.0) {                          
         left = (left_num / left_den) * N(n-1, i, u, knot);
    }

    // 右式
    let right_num = knot[i+n] - u;
    let right_den = knot[i+n] - knot[i];
    let right = 0.0;
    if (right_den != 0.0){
        right = (right_num / right_den) * N(n-1, i+1, u, knot);
    }

    return left + right;
}

function surface_point(ctrl, knot_u, knot_v, m, n, u, v){
    let point = [0, 0, 0];

    let rows = ctrl.length;
    let cols = ctrl[0].length;

    for (let i = 1; i <=rows; i++){
        for(let j = 1; j <= cols; j++){
            let Ni = N(m, i, u, knot_u);
            let Nj = N(n, j, v, knot_v);

            point[0] += Ni * Nj * ctrl[i-1][j-1][0];
            point[1] += Ni * Nj * ctrl[i-1][j-1][1];
            point[2] += Ni * Nj * ctrl[i-1][j-1][2];
        }
    }
    return point;
}

// normal 
function computeNormal(ctrl, knot, m, n, u, v){
    let eps = 0.001;

    let pu = surface_point(ctrl, knot, knot, m, n, u + eps, v);
    let pm = surface_point(ctrl, knot, knot, m, n, u - eps, v);
    let du = [
        (pu[0] - pm[0]) / (2 * eps),
        (pu[1] - pm[1]) / (2 * eps),
        (pu[2] - pm[2]) / (2 * eps)
    ];

    let pv1 = surface_point(ctrl, knot, knot, m, n, u, v + eps);
    let pv2 = surface_point(ctrl, knot, knot, m, n, u, v - eps);
    let dv = [
        (pv1[0] - pv2[0]) / (2 * eps),
        (pv1[1] - pv2[1]) / (2 * eps),
        (pv1[2] - pv2[2]) / (2 * eps)
    ];

    let n_vec = [
        du[1]*dv[2] - du[2]*dv[1],
        du[2]*dv[0] - du[0]*dv[2],
        du[0]*dv[1] - du[1]*dv[0]
    ];

    let len = Math.sqrt(n_vec[0]**2 + n_vec[1]**2 + n_vec[2]**2);
    return [n_vec[0]/len, n_vec[1]/len, n_vec[2]/len];
}