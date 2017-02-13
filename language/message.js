var str = require('./jp.json');

function getmessage(category, sab, id) {
    return str[category][sab][id]
}