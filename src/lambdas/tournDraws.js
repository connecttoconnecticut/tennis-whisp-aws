let draws = require('./common/draws');
let config = require('../../config.json');

module.exports.tournamentDraws = (event, context, callback) => {
    draws(config.DDE_API_ROUTES.tournamentsDataDDEapi,function(res){
        console.log(res);
        context.succeed('Context: Done!');
        callback(null, 'Success!');
    })
}