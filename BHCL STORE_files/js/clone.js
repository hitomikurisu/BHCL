var cloneObj = function(p) {
    var f = function(){};
    for (key in p) {
        if (typeof p[key] == 'function') {
            f[key] = p[key];
        }
        else if (typeof p[key] == 'object') {
            f[key] = cloneObj(p[key]);
        }
        else {
            f[key] = p[key];
        }
    }
    return f;
};