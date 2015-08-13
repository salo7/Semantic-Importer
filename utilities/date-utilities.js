var getXMLDateFormat = function(date){
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours() + ':' + d.getMinutes()  + ':' + d.getSeconds();
}

exports.getXMLDateFormat = getXMLDateFormat;
