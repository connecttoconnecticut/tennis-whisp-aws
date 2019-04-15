const mysql = require('mysql');
const config = require('./config.json');
const async = require('async');
const AWS = require('aws-sdk');


module.exports.sendMessageHandler = (event,context,callback) =>{
    console.log('SendMsgHandler -> event:: ' + event);
    sendMessageToAllConnected(event);

}

let sendMessageToAllConnected = function(event) {
    getConnectedIds(function(resp,succ) {
        if(succ){
            async.map(resp, function(conn_id,asyncMapCallback){
                send(event, conn_id);
            },asyncMapCallback(null,{
                //return/callback-value-from-sand
            }))
        }else{
            callback(null,{
                statusCode: 500,
                body: 'Failed to connect to db: ' + JSON.stringify(resp)
            })
        }
    })
}

let send = function (event, connection_id) {
    const body = JSON.parse(event.body);
    const postData = body.data; //message

    const endpoint = event.requestContext.domainName + "/" + event.requestContext.stage;
    const apiGWManagmentApi = new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint : endpoint
    });

    const params = {
        ConnectionId : connection_id,
        Data: postData
    };

    return apiGWManagmentApi.postToConnection(params);
}



let conn = mysql.createConnection(config.DATABASE_CONNECTION);

let getConnectedIds = function(callback){
    var retVal = [];
    conn.query(selectQuery, function(err, result,fields){
        if(err){
            callback(err,false);
        }else{
            result.forEach(function(val){
                retVal.push(val.connection_id)
            });
            callback(retVal,true);
        }
    })
}