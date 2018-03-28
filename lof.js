const sum = (arr) => {
    let i = -1;
    let len = arr.length;
    let total = 0;
    while (++i < len) {
        let item = arr[i];
        if (item) total += item;
    }
    return total;
};

const newArray = (count, value) => {
    let i = -1;
    let res = [];
    while (++i < count) {
        res.push(value);
    }
    return res;
}

const obj2arr = (obj) => {
    let keys = Object.keys(obj);
    keys.sort((a, b) => {
        return a - b;
    })
    let res = map(keys, key => {
        return [key, ...obj[key]];
    });
    return res;
}

const forEach = (array, fn) => {
    if (!(array && array.length)) return;
    let i = -1;
    let len = array.length;
    while (++i < len) {
        let item = array[i];
        fn(item, i);
    }
};

const enumerate = (arr) => {
    let res = {};
    forEach(arr, (item, i) => {
        res[i] = item;
    });
    return res;
}

const filter = (array, fn) => {
    if (!(array && array.length)) return [];
    let i = -1;
    let len = array.length;
    let resArr = [];
    while (++i < len) {
        let item = array[i];
        if (fn(item, i)) resArr.push(item);
    }
    return resArr;
};

const discard = (arr, el) => {
    let index = -1;
    forEach(arr, (item, i) => {
        if (item.indexOf(el) >= 0) {
            index = i;
        }
    });
    if (index !== -1) arr.splice(index, 1);
    return arr;
}

const map = (array, fn) => {
    if (!(array && array.length)) return [];
    let i = -1;
    let len = array.length;
    let resArr = [];
    while (++i < len) {
        let item = array[i];
        resArr.push(fn(item, i));
    }
    return resArr;
}

const map_multiple_argu = (arguArr, fn) => {
    let i = -1;
    let len = arguArr[0].length;
    let resArr = [];
    while (++i < len) {
        let itemArr = map(arguArr, (item) => { return item[i]; });
        resArr.push(fn(itemArr, i));
    }
    return resArr;
}

// 计算两点的欧几里得距离（二维）
const distance_euclidean = (point1, point2) => {
    let x1 = point1[0];
    let y1 = point1[1];
    let x2 = point2[0];
    let y2 = point2[1];
    return Math.pow( Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2) / 2, 0.5 );
};

class LOF {
    constructor (points, normalize = true, distance_function = distance_euclidean) {
        this.points = points;
        this.normalize = normalize;
        this.distance_function = distance_function;
        if (normalize) this.normalize_points();
    }

    compute_point_attribute_bounds () {
        let points_len = this.points[0].length;
        let min_values = newArray(points_len, Infinity);
        let max_values = newArray(points_len, -Infinity);
        forEach(this.points, (point) => {
            min_values = map_multiple_argu([min_values, point], (itemArr) => { return Math.min(...itemArr) });
            max_values = map_multiple_argu([max_values, point], (itemArr) => { return Math.max(...itemArr) });
        })
        this.min_attribute_values = min_values; // array
        this.max_attribute_values = max_values; // array
    }

    normalize_points () {
        if (!('max_attribute_values' in this)) this.compute_point_attribute_bounds();
        let new_points = [];
        forEach(this.points, (point) => {
            new_points.push(this.normalize_point(point));
        });
        this.points = new_points;
    }

    normalize_point (point) {
        return map_multiple_argu([point, this.max_attribute_values, this.min_attribute_values], ([value, max, min]) => {
            return ((max - min) > 0) ? ((value - min) / (max - min)) : 0;
        });
    }

    local_outlier_factor (min_pts, point) {
        if (this.normalize) {
            point = this.normalize_point(point);
        }
        return local_outlier_factor(min_pts, point, this.points, this.distance_function);
    }
}

const k_distance = (k, point, points, distance_function = distance_euclidean) => {
    // #TODO:
    let distances = {};
    forEach(points, point2 => {
        let distance_value = distance_function(point, point2);
        if (distance_value in distances) {
            distances[distance_value].push(point2);
        } else {
            distances[distance_value] = [point2]
        }
    });
    let distanceTransed = obj2arr(distances);
    let neighbours = [];
    let k_sero = 0;
    let k_dist = 0;
    for (let dist of distanceTransed) {
        k_sero += 1;
        neighbours.push(dist[1]);
        k_dist = dist[0];
        if (k_sero >= k) {
            break;
        }
    }
    return { k_dist, neighbours };
};

const reachability_distance = (k, point1, point2, points, distance_function = distance_euclidean) => {
    let res = {'k_dist': [], 'neighbours': []};
    res = k_distance(k, point2, points, distance_function = distance_function);
    return Math.max(res.k_dist, distance_function(point1, point2));
};

const local_reachability_density = (min_pts, point, points) => {
    let res = {'k_dist': [], 'neighbours': []};
    res = k_distance(min_pts, point, points);
    let reachability_distances_array = newArray(res.neighbours.length, 0);
    forEach(res.neighbours, (neighbour, i) => {
        reachability_distances_array[i] = reachability_distance(min_pts, point, neighbour, points);
    })
    let sum_reach_dist = sum(reachability_distances_array);
    if (sum_reach_dist === 0) return Infinity;
    return res.neighbours.length / sum_reach_dist;
};

const local_outlier_factor = (min_pts, point, points) => {
    let res = {'k_dist': [], 'neighbours': []};
    res = k_distance(min_pts, point, points);
    let point_lrd = local_reachability_density(min_pts, point, points);
    let lrd_ratios_array = newArray(res.neighbours.length, 0);
    forEach(res.neighbours, (neighbour, i) => {
        let points_without_point = JSON.parse(JSON.stringify(points));
        points_without_point = discard(points_without_point, neighbour);
        let neighbour_lrd = local_reachability_density(min_pts, neighbour, points_without_point);
        lrd_ratios_array[i] = neighbour_lrd / point_lrd;
    })
    return sum(lrd_ratios_array) / res.neighbours.length;
};

const outliers = (points, k = 5) => {
    let points_value_backup = JSON.parse(JSON.stringify(points));
    let outliers = [];
    let enumerated = enumerate(points_value_backup);
    for (let i in enumerated) {
        let inst = JSON.parse(JSON.stringify(points));
        let point = enumerated[i];
        inst = points_value_backup.filter((item) => {return JSON.stringify(item) !== JSON.stringify(point)});
        let l = new LOF(inst);
        let value = l.local_outlier_factor(k, point);
        if (value > 2) outliers.push({'lof': value, 'point': point, 'index': i});
    }
    outliers.sort((a, b) => { return a - b; });
    return outliers;
};

module.exports = outliers;
