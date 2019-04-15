
module.exports.defaultHandler = (event,contex,callback) => {
    console.log('DefaultHandler -> Called!\n' + event);
    callback(null, {
        statusCode: 200,
        body: 'defaultHandler'
    });
};