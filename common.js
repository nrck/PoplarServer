
const fs = require('fs');

/**
 * 採番し36進数を返します。
 * @param {number} init 
 */
exports.makeId = function (init) {
    let local = init;
    return {
        getId: function () {
            local++;
            return local.toString(36);
        }
    }
};

// ジョブネットの実行結果をDBに保存する

/**
 * ファイルユーティリティ
 */
exports.fileUtil = function () {
    return {
        /**
         * ファイル存在確認
         */
        isExist: function (filePath) {
            let r = false;
            try {
                fs.statSync(filePath);
                return true;
            } catch (err) {
                console.error("================================================================")
                console.error("[File exist check error] " + filePath)
                console.error("================================================================")
                return false;
            }
            return isExist;
        },

        /**
         * ファイル読み込み
         */
        read: function (filePath) {
            var content = new String();
            if (this.isExist(filePath)) {
                content = fs.readFileSync(filePath, 'utf8');
                return content;
            } else {
                return null
            }

        },

        /**
         * ファイル書き込み
         */
        write: function (filePath, stream) {
            let result = false;
            try {
                fs.writeFileSync(filePath, stream);
                return true;
            } catch (err) {
                console.error("================================================================")
                console.error("[File write error] " + filePath)
                console.error("================================================================")
                return false;
            }
        },

        /**
         * ファイル削除
         */
        delete: function (filePath) {
            var result = false;
            try {
                fs.unlinkSync(filePath);
                return true;
            } catch (err) {
                console.error("================================================================")
                console.error("[File delete error] " + filePath)
                console.error("================================================================")
                return false;
            }
        }
    }
};