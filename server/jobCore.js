exports.readJobnet = function (fname) {
    // 引数省略時
    if (fname == null) {
        throw new Error("argumentsError");
    }

    // 読み込んでJSONを返す
    try {
        return JSON.parse(JSON.stringify(require(fname)));
    } catch (e) {
        throw new Error("argumentsError");
    }
};