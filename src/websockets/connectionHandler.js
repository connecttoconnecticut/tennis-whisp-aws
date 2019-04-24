'use strict';
const mysql = require('mysql');
const config = require('../../config.json');

const succesfullResponse = {
    statusCode: 200,
    body: JSON.stringify({ status: 'OK'}),
    isBase64Encoded : false
};

module.exports.connectionHandler = (event,context,callback) => {
    if(event.requestContext.eventType === 'CONNECT'){
        addConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                callback(null,succesfullResponse);
            }else{
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

function addConnection (connection_id,callback){
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
                    conn.end();
                    callback(null,true);
                }
            })
        }
    })
}

function deleteConnection (connection_id,callback){
    let deletequery = `DELETE FROM chat WHERE connection_id='${connection_id}';`;
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    conn.connect(function(err){
        if(err){
            callback(err,false);
        }else{
            conn.query(deletequery,function(err){
                if(err){
                    console.log('ConnHandler -> Deleteconnection err: ' + err);
                    conn.end();
                    callback(err,false);
                }else{
                    conn.end();
                    callback(null,true);
                }
            });
        }
    })
}