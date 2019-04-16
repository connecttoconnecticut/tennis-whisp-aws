const mysql = require('mysql');
const config = require('./config.json');
const async = require('async');
const AWS = require('aws-sdk');


module.exports.sendMessageHandler = (event,context,callback) =>{
    console.log('SendMsgHandler -> event:: ' + event);
    sendMessageToAllConnected(event,function(nl,resp){
        callback(null,resp);
    });

}

let sendMessageToAllConnected = function(event,callback) {
    getConnectedIds(function(resp,succ) {
        if(succ){
            async.map(resp,function(item,mapCallback){
                send(event,item,function(retVal){
                    console.log('Send callback -> ' + retVal);
                })
            },function(err,asyncMapRetVal){
                callback(null,{
                    statusCode: 200,
                    body: 'SendMessageToAllConnected -> : Success!'
                })
            })
        }else{
            callback(null,{
                statusCode: 500,
                body: 'Failed to connect to db: ' + JSON.stringify(resp)
            })
        }
    })
}

let send = function (event, connection_id,callback) {
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
    console.log('SendMsg -> ' + postData + ' should be sended.');
    //return apiGWManagmentApi.postToConnection(params);
    callback(apiGWManagmentApi.postToConnection(params));
}





let getConnectedIds = function(callback){
    console.log('GetConnected Ids -> Called!');
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    var retVal = [];
    var selectQuery = 'SELECT * FROM chat;';
    conn.query(selectQuery, function(err, result,fields){
        if(err){
            callback(err,false);
        }else{
            result.forEach(function(val){
                retVal.push(val.connection_id)
            });
            console.log('GetConnected Ids -> RetVal --> ', retVal);
            callback(retVal,true);
        }
    })
}