const WebSocket = require('ws');
const AWS = require('aws-sdk');
const config = require('../config.json');


var testEvent = '2015-999-XX997';
const testStreamWss = config.WEBSOCKET_API.api + testEvent + '/stream';

const lambda = new AWS.Lambda({
    region: config.AWS_CONFIG.REGION
})


module.exports.liveEventsHandler = (event, context, callback) => {
    /*
    const params = {
        FunctionName : 'tennis-whisperers-dev-testStreamHandler',
        Payload: JSON.stringify(testStreamWss)
    };

    return lambda.invoke(params,function(error,data){
        if(error){
            console.log(JSON.stringify(error));
            return new Error(`Error printing messages: ${JSON.stringify(error)}`);
        }else if(data){
            console.log('liveEventsInvoke data:',data);
        }
    })
    
    
    
    const ws = new WebSocket('wss://48hynlu80m.execute-api.eu-central-1.amazonaws.com/dev');
    var sendData = JSON.stringify("TEXT MESSAGE",ws);
    ws.on('open', function open(){
        ws.send(JSON.stringify('{"action":"testStream"'+ sendData));
        callback('Success!');
    })*/
    const wsDDE = new WebSocket(testStreamWss);
    const wsGW = new WebSocket('wss://48hynlu80m.execute-api.eu-central-1.amazonaws.com/dev');
    wsDDE.on('open', function open(){
        wsDDE.send(JSON.stringify({authToken:config.TOKEN}));
        wsGW.on('open',function(){
            
        })
        wsDDE.on('message', function(msg){
            console.log('DDE DATA -> ',msg);
            wsGW.send(JSON.stringify({action:"testStream",data:msg}));
        })

    })
        
}
