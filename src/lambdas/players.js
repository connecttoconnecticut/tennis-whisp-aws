let mysql = require("mysql");
let request = require("request");
let config = require("../../config.json");

//#region db_query & connection
let playerSummaryQuery = `INSERT INTO player_summary (id,first_name,last_name,country) VALUES `;
let playersDetailsQuery = `INSERT INTO player (player_summary_id,active,gender,date_of_birth,rank_date,current_singles_rank_tied,current_singles_rank,current_doubles_rank_tied,current_doubles_rank,current_YTD_rank_tied,current_YTD_rank,singles_rolling_points,doubles_rolling_points,singles_race_points) VALUES `;
let conn = mysql.createConnection(config.DATABASE_CONNECTION);

//#endregion

module.exports.getPlayers = (event, context, callback) => {
  request(
    {
      url: config.DDE_API_ROUTES.playersDDEapi,
      json: true,
      headers: config.DDE_REQ_HEADERS,
      method: "GET"
    },
    function(error, response, body) {
      if (error) callback(error);
      var jsonData = body;
      playerParser(jsonData, function(playersQuery, playersSummariesQuery) {
        conn.connect(function(err) {
          if (err) callback(err);
          writeToDb(playersQuery, playersSummariesQuery, function(gate) {
            if (gate) {
              context.succeed("Context: Done!");
              callback(null, "Success!");
            }
          });
        });
      });
    }
  );
};
let writeToDb = function(playersQuery, playersSummariesQuery, callback) {
  conn.query(playersQuery, function(err, result) {
    if (err) callback(err);
    conn.query(playersSummariesQuery, function(err, result) {
      if (err) throw err;
      callback(true);
    });
  });
};

let playerParser = function(jsonData, callback) {
  for (let i = 0; i < jsonData.length; i++) {
    if (
      jsonData[i].playerSummary.firstName.includes(`''`) ||
      jsonData[i].playerSummary.lastName.includes(`''`)
    ) {
      playerSummaryQuery += `('${jsonData[i].playerSummary.id}','${
        jsonData[i].playerSummary.firstName
      }','${jsonData[i].playerSummary.lastName}','${
        jsonData[i].playerSummary.country
      }')`;
    } else if (jsonData[i].playerSummary.firstName.includes(`'`)) {
      var temp1 =
        jsonData[i].playerSummary.firstName.slice(
          0,
          jsonData[i].playerSummary.firstName.indexOf(`'`)
        ) +
        `'` +
        jsonData[i].playerSummary.firstName.slice(
          jsonData[i].playerSummary.firstName.indexOf(`'`)
        );
      playerSummaryQuery += `('${jsonData[i].playerSummary.id}','${temp1}','${
        jsonData[i].playerSummary.lastName
      }','${jsonData[i].playerSummary.country}')`;
    } else if (jsonData[i].playerSummary.lastName.includes(`'`)) {
      var temp1 =
        jsonData[i].playerSummary.lastName.slice(
          0,
          jsonData[i].playerSummary.lastName.indexOf(`'`)
        ) +
        `'` +
        jsonData[i].playerSummary.lastName.slice(
          jsonData[i].playerSummary.lastName.indexOf(`'`)
        );
      playerSummaryQuery += `('${jsonData[i].playerSummary.id}','${
        jsonData[i].playerSummary.firstName
      }','${temp1}','${jsonData[i].playerSummary.country}')`;
    } else if (
      jsonData[i].playerSummary.firstName.includes(`'`) &&
      jsonData[i].playerSummary.lastName.includes(`'`)
    ) {
      var temp1 =
        jsonData[i].playerSummary.firstName.slice(
          0,
          jsonData[i].playerSummary.firstName.indexOf(`'`)
        ) +
        `'` +
        jsonData[i].playerSummary.firstName.slice(
          jsonData[i].playerSummary.firstName.indexOf(`'`)
        );
      var temp2 =
        jsonData[i].playerSummary.lastName.slice(
          0,
          jsonData[i].playerSummary.lastName.indexOf(`'`)
        ) +
        `'` +
        jsonData[i].playerSummary.lastName.slice(
          jsonData[i].playerSummary.lastName.indexOf(`'`)
        );
      playerSummaryQuery += `('${
        jsonData[i].playerSummary.id
      }','${temp1}','${temp2}','${jsonData[i].playerSummary.country}')`;
    } else {
      playerSummaryQuery += `('${jsonData[i].playerSummary.id}','${
        jsonData[i].playerSummary.firstName
      }','${jsonData[i].playerSummary.lastName}','${
        jsonData[i].playerSummary.country
      }')`;
    }
    if (i == jsonData.length - 1) {
      playerSummaryQuery += ";";
    } else {
      playerSummaryQuery += ",";
    }
    playerSummaryQuery += "\n";

    var tempJsonPlayerObject = {
      playerSummaryId: jsonData[i].playerSummary.id,
      active: jsonData[i].active,
      gender: jsonData[i].gender,
      dateOfBirth: jsonData[i].dateOfBirth,
      rankDate: jsonData[i].rankDate,
      currentSinglesRankedTied: jsonData[i].currentSinglesRankTied,
      currentSinglesRank: jsonData[i].currentSinglesRank,
      currentDoublesRankTied: jsonData[i].currentDoublesRankTied,
      currentDoublesRank: jsonData[i].currentDoublesRank,
      currentYTDRankTied: jsonData[i].currentYTDRankTied,
      currentYTDRank: jsonData[i].currentYTDRank,
      singlesRollingPoints: jsonData[i].singlesRollingPoints,
      doublesRollingPoints: jsonData[i].doublesRollingPoints,
      singlesRacePoints: jsonData[i].singlesRacePoints
    };

    playersDetailsQuery += "(";
    for (let key in tempJsonPlayerObject) {
      if (
        tempJsonPlayerObject[key] === undefined ||
        tempJsonPlayerObject[key] === null
      ) {
        playersDetailsQuery += "null";
      } else {
        if (typeof tempJsonPlayerObject[key] === "string") {
          if (tempJsonPlayerObject[key].includes(`'`)) {
            var temp2 =
              tempJsonPlayerObject[key].slice(
                0,
                tempJsonPlayerObject[key].indexOf(`'`)
              ) +
              `'` +
              tempJsonPlayerObject[key].slice(
                tempJsonPlayerObject[key].indexOf(`'`)
              );
          } else {
            playersDetailsQuery += `'${tempJsonPlayerObject[key]}'`;
          }
        } else {
          playersDetailsQuery += `${tempJsonPlayerObject[key]}`;
        }
      }
      if (key.toString() === "singlesRacePoints") {
        playersDetailsQuery += "";
      } else {
        playersDetailsQuery += ",";
      }
    }
    if (i == jsonData.length - 1) {
      playersDetailsQuery += ");";
    } else {
      playersDetailsQuery += "),";
    }

    playersDetailsQuery += "\n";
  }
  callback(playerSummaryQuery, playersDetailsQuery);
};
