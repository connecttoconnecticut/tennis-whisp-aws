let mysql = require("mysql");
let request = require("request");
let async = require("async");
let config = require("../../../config.json");

//#region db_query & connection
var drawObjectsQuery = `INSERT INTO draw (competition_type,entry_size, competition_id, draw_size, number_of_pools)
  VALUES `;

var matchesQuery = `INSERT INTO match_event (competition_id,estimated_time,event_id,round_no,estimated_date,stage_type,teamA_player1_id,teamB_player1_id,teamA_player2_id,teamB_player2_id) VALUES `;

var teamsQuery =
  "INSERT INTO team (event_id,status,player_1,player_2,entry_type,seed) VALUES ";

let conn = mysql.createConnection(config.DATABASE_CONNECTION);

//#endregion

var teamA_temp = {
  player1_id: "",
  player2_id: ""
};

var teamB_temp = {
  player1_id: "",
  player2_id: ""
};

var parsingDraws = function(dataEndpoint, callback) {
  conn.query("SELECT * FROM tournament ", (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      var cntr = 0;
      var tournaments = rows;
      async.map(
        tournaments,
        function(item, mapCallback) {
          request(
            {
              url: dataEndpoint + `${item.identifier}` + `/draws`,
              json: true,
              headers: config.DDE_REQ_HEADERS
            },
            function(error, response, body) {
              console.log(body);
              if (error) {
                throw error;
              } else {
                if (typeof body === "string") {
                } else {
                  let jsonData = body;
                  cntr++;
                  drawsParser(jsonData, function(
                    drawObjectsQuery,
                    matchesQuery,
                    teamsQuery
                  ) {
                    matchesQuery = matchesQuery.slice(0, -2) + ";";
                    drawObjectsQuery = drawObjectsQuery.slice(0, -2) + ";";
                    teamsQuery = teamsQuery.slice(0, -2) + ";";
                    conn.query(drawObjectsQuery, function(err, result) {
                      if (err) callback(err);
                      conn.query(matchesQuery, function(err, result) {
                        if (err) callback(err);
                        //context.succeed('Done!');
                        conn.query(teamsQuery, function(err, result) {
                          if (err) callback(err);
                          callback("Tournament Draws Parsing Done.");
                        });
                      });
                    });
                    mapCallback(null, {
                      matchesQuery,
                      drawObjectsQuery,
                      teamsQuery
                    });
                  });
                }
              }
            }
          );
        },
        function(err, mapCallbackQuerys) {
          callback("Tournament Draws Parsing Done.");
          //context.succeed('Context: Done!');
          //callback(null, 'Success!');
        }
      );
    }
  });
};

module.exports = parsingDraws;

var drawsParser = function(jsonData, callback) {
  for (var dobj in jsonData) {
    var tempDrawObject = jsonData[dobj];
    drawObjectsQuery += "(";
    for (var doKey in tempDrawObject) {
      if (typeof tempDrawObject[doKey] !== "object") {
        if (
          tempDrawObject[doKey] !== null &&
          tempDrawObject[doKey] !== "undefined"
        ) {
          if (doKey !== "numberOfPools") {
            if (typeof tempDrawObject[doKey] === "string") {
              drawObjectsQuery += `'${tempDrawObject[doKey]}'` + ",";
            } else {
              drawObjectsQuery += tempDrawObject[doKey] + ",";
            }
          }
        } else {
          drawObjectsQuery += "null,";
        }
      }

      if (doKey === "matches") {
        var tempMatches = tempDrawObject[doKey];
        for (let i = 0; i < tempMatches.length; i++) {
          var counter = 0;
          matchesQuery += "(" + `'${tempDrawObject.competitionId}'` + ",";
          var thisMatch = tempMatches[i];
          for (var mKey in thisMatch) {
            counter++;
            if (typeof thisMatch[mKey] !== "object") {
              if (thisMatch[mKey] !== null && thisMatch[mKey] !== undefined) {
                if (typeof thisMatch[mKey] === "string") {
                  if (
                    (mKey === "eventId" && counter == 2) ||
                    (mKey === "stageType" && counter == 5)
                  ) {
                    matchesQuery += `null,'${thisMatch[mKey]}'` + ",";
                  } else {
                    matchesQuery += `'${thisMatch[mKey]}'` + ",";
                  }
                } else {
                  matchesQuery += thisMatch[mKey] + ",";
                }
              } else {
                matchesQuery += "null,";
              }
            } else {
              if (mKey === "stageType") {
                if (thisMatch[mKey] !== null && thisMatch[mKey] !== undefined) {
                  matchesQuery += `'${thisMatch[mKey]}',`;
                } else {
                  matchesQuery += `null,`;
                }
              } else {
                if (typeof thisMatch[mKey] === "object") {
                  if (mKey === "teamA") {
                    if (
                      thisMatch[mKey].status !== "Bye" &&
                      thisMatch[mKey].status !== "UnknownTennisTeam"
                    ) {
                      var teamA = thisMatch[mKey];
                      teamsQuery += `('${thisMatch.eventId}',`;
                      teamsQuery += `'${teamA.status}','${
                        teamA.team.player1.id
                      }',`;
                      teamA_temp.player1_id = teamA.team.player1.id;
                      if (
                        teamA.team.player2 === undefined ||
                        teamA.team.player2 === null
                      ) {
                        teamsQuery += `null,`;
                        teamA_temp.player2_id = null;
                      } else {
                        teamsQuery += `'${teamA.team.player2.id}',`;
                        teamA_temp.player2_id = `${teamA.team.player2.id}`;
                      }

                      if (
                        teamA.team.entryType === undefined ||
                        teamA.team.entryType === null
                      ) {
                        teamsQuery += "null";
                      } else {
                        teamsQuery += `'${teamA.team.entryType}'` + ",";
                      }

                      if (
                        teamA.team.seed === undefined ||
                        teamA.team.seed === null
                      ) {
                        teamsQuery += "null),\n";
                      } else {
                        teamsQuery += teamA.team.seed + "),\n";
                      }
                    }
                  } else {
                    if (
                      thisMatch[mKey].status !== "Bye" &&
                      thisMatch[mKey].status !== "UnknownTennisTeam"
                    ) {
                      var teamB = thisMatch[mKey];
                      teamsQuery += `('${thisMatch.eventId}',`;
                      teamsQuery += `'${teamB.status}','${
                        teamB.team.player1.id
                      }',`;
                      teamB_temp.player1_id = teamB.team.player1.id;
                      if (
                        teamB.team.player2 === undefined ||
                        teamB.team.player2 === null
                      ) {
                        teamsQuery += `null,`;
                        teamB_temp.player2_id = null;
                      } else {
                        teamsQuery += `'${teamB.team.player2.id}',`;
                        teamB_temp.player2_id = `${teamB.team.player2.id}`;
                      }

                      if (
                        teamB.team.entryType === undefined ||
                        teamB.team.entryType === null
                      ) {
                        teamsQuery += "null,";
                      } else {
                        teamsQuery += `'${teamB.team.entryType}'` + ",";
                      }

                      if (
                        teamB.team.seed === undefined ||
                        teamB.team.seed === null
                      ) {
                        teamsQuery += "null),\n";
                      } else {
                        teamsQuery += teamB.team.seed + "),\n";
                      }
                    }
                  }
                }
              }
            }
          }
          matchesQuery += `'${teamA_temp.player1_id}','${
            teamB_temp.player1_id
          }',`;
          if (
            teamA_temp.player2_id === null ||
            teamB_temp.player2_id === null
          ) {
            matchesQuery += "null,null),\n";
          } else {
            matchesQuery += `'${teamA_temp.player2_id}','${
              teamB_temp.player2_id
            }'),\n`;
          }
        }
      }
    }

    if (
      tempDrawObject.numberOfPools === null ||
      tempDrawObject.numberOfPools === undefined
    ) {
      drawObjectsQuery += "null),\n";
    } else {
      drawObjectsQuery += tempDrawObject.numberOfPools + "),\n";
    }
  }
  //matchesQuery = matchesQuery.slice(0,-2) + ';';
  //drawObjectsQuery = drawObjectsQuery.slice(0,-2) + ';';
  //teamsQuery = teamsQuery.slice(0,-2) + ';';
  callback(drawObjectsQuery, matchesQuery, teamsQuery);
};
