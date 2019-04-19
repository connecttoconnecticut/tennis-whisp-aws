'use strict';
const mysql = require('mysql');
const config = require('../../config.json');
const ws = require('ws');

//require('aws-sdk/clients/apigatewaymanagmentapi');

const succesfullResponse = {
    statusCode: 200,
    body: JSON.stringify({ status: 'OK'}),
    isBase64Encoded : false
};

module.exports.connectionHandler = (event,context,callback) => {
    console.log('ConnHandler -> event:: ' + JSON.stringify(event));
    if(event.requestContext.eventType === 'CONNECT'){
        addConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                console.log('ConnHandler -> Addconnection: Success!');
                callback(null,succesfullResponse);
            }else{
                //context.succeed('Connection Failed.');
                callback(null, JSON.stringify({
                    "statusCode": 500,
                    "body": 'Failed to connect to db: ' + JSON.stringify(connErr)
                }));
            };
        });
    }else if(event.requestContext.eventType === 'DISCONNECT'){
        deleteConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                console.log('ConnHandler -> Deleteconnection: Success!');
                callback(null,JSON.stringify(succesfullResponse));
            }else{
                callback(null, JSON.stringify({
                    "statusCode": 500,
                    "body": 'Failed to connect to db: ' + JSON.stringify(connErr)
                }));
            };
        });
    }
}

//let conn = mysql.createConnection(config.DATABASE_CONNECTION);

function addConnection (connection_id,callback){
    console.log('Add connection -> Called!');
    let insertquery = `INSERT INTO chat (connection_id) VALUES ('${connection_id}');`;
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    conn.connect(function(err){
        if(err){
            console.log('ConnHandler -> Connect to DB err: ' + err);
            callback(err,false);
        }else{
            conn.query(insertquery,function(err){
                if(err){
                    console.log('ConnHandler -> Addconnection err: ' + err);
                    conn.end();
                    callback(err,false);
                }else{
                    console.log('Insert to DB -> Success!');
                    conn.end();
                    callback(null,true);
                }
            })
        }
    })
}

function deleteConnection (connection_id,callback){
    console.log('Delete connection -> Called!');
    let deletequery = `DELETE FROM chat WHERE connection_id='${connection_id}';`;
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    conn.connect(function(err){
        if(err){
            console.log('ConnHandler -> Disconnect to DB err: ' + err);
            callback(err,false);
        }else{
            conn.query(deletequery,function(err){
                if(err){
                    console.log('ConnHandler -> Deleteconnection err: ' + err);
                    conn.end();
                    callback(err,false);
                }else{
                    console.log('Delete from DB -> Success!');
                    conn.end();
                    callback(null,true);
                }
            });
        }
    })
}