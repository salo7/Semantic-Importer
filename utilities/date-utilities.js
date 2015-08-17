var getXMLDateFormat = function(date){
    if (!date)
        return '';
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + 'T' + date.getHours() + ':' + date.getMinutes()  + ':' + date.getSeconds();
}

exports.getXMLDateFormat = getXMLDateFormat;
