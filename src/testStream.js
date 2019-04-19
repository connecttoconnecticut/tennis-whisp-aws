const WebSocket = require('ws');
const config = require('../config.json')

module.exports.testStreamHandler = (event,context,callback) => {
    console.log('TestStream Handler -> event::' + JSON.stringify(event));
    /*
    const wsDDE = new WebSocket(JSON.stringify(event));
    const wsGW = new WebSocket('wss://48hynlu80m.execute-api.eu-central-1.amazonaws.com/dev');
    wsDDE.on('open', function open(){
        wsDDE.send(JSON.stringify({authToken:config.TOKEN}));
        wsDDE.on('message', function(data){
            console.log('DDE DATA -> ',data);
            wsGW.send(JSON.stringify({action:}))
        })

    })
    */

    

}
