let mysql = require("mysql");
let request = require("request");
let async = require("async");
let config = require("../../config.json");

//#region db_query & connection
let eventResultsQuery = `INSERT INTO event_result (winner,finish_reason,teamA_player1_id,teamA_player2_id,event_id,competition_time,teamB_player1_id,teamB_player2_id,match_external_id,match_id) VALUES \n`;
let setScoreQuery =
  "INSERT INTO set_score (set_index,teamA_games,teamB_games,tiebreak_points_A,tiebreak_points_B,event_id,match_id) VALUES \n";
let conn = mysql.createConnection(config.DATABASE_CONNECTION);
//#endregion

module.exports.getResults = (event, context, callback) => {
  //var parsingResults = function(){
  conn.query("SELECT * FROM tournament ", (err, rows) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      var tournaments = rows;
      async.map(
        tournaments,
        function(item, mapCallback) {
          request(
            {
              url:
                config.DDE_API_ROUTES.tournamentsDataDDEapi +
                `${item.identifier}/results`,
              json: true,
              headers: config.DDE_REQ_HEADERS
            },
            function(error, response, body) {
              if (error) {
                throw error;
              } else {
                if (body[0] != undefined) {
                  let jsonData = body;
                  resultParser(jsonData, function(
                    eventResultsQuery,
                    setScoreQuery
                  ) {
                    eventResultsQuery = eventResultsQuery.slice(0, -2) + ";";
                    setScoreQuery = setScoreQuery.slice(0, -2) + ";";
                    conn.query(eventResultsQuery, function(err, result) {
                      if (err) throw err;
                      conn.query(setScoreQuery, function(err, result) {
                        if (err) throw err;
                        console.log(
                          "Results: Successfull write setScoreQuery to db ..."
                        );
                      });
                    });
                    mapCallback(null, {
                      eventResultsQuery,
                      setScoreQuery
                    });
                  });
                }
              }
            }
          );
        },
        function(err, mapCallbackQuerys) {
          context.succeed("Context: Done!");
          callback(null, "Success!");
        }
      );
    }
  });
};

let resultParser = function(jsonData, callback) {
  console.log("Results parsing started ...");
  for (let i = 0; i < jsonData.length; i++) {
    var tempResult = jsonData[i];
    eventResultsQuery += "(";
    for (var resultKey in tempResult) {
      if (typeof tempResult[resultKey] !== "object") {
        if (
          tempResult[resultKey] !== null &&
          tempResult[resultKey] !== undefined
        ) {
          eventResultsQuery += `'${tempResult[resultKey]}',`;
        } else {
          eventResultsQuery += `null,`;
        }

        if (resultKey === "matchId") {
          eventResultsQuery = eventResultsQuery.slice(0, -1) + "),\n";
        }
      } else {
        if (resultKey === "matchScore") {
          var matchScore = tempResult[resultKey].setScores;
          for (let j = 0; j < matchScore.length; j++) {
            setScoreQuery += "(";
            setScoreQuery += `${j + 1},`;
            if (matchScore[j] !== undefined) {
              var tempSet = matchScore[j];
              let cntr = 0;
              for (var keySet in tempSet) {
                cntr++;
                setScoreQuery += `${tempSet[keySet]},`;
              }
              if (cntr != 4) {
                setScoreQuery += "null,null,";
              }
            } else {
              setScoreQuery += "null,null,null,null,";
            }
            setScoreQuery += `'${tempResult.eventId}','${
              tempResult.matchId
            }'),\n`;
          }
        } else {
          var tempTeam = tempResult[resultKey].team;
          let playerCounter = 0;
          for (var teamKey in tempTeam) {
            if (teamKey.includes("player")) {
              eventResultsQuery += `'${tempTeam[teamKey].id}',`;
              playerCounter++;
            }
          }
          if (playerCounter == 1) {
            eventResultsQuery += "null,";
          }
        }
      }
    }
  }
  callback(eventResultsQuery, setScoreQuery);
};
