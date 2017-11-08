var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');

var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});


// 봉사 등록하기
router.post('/volunteerinfo/register', function(req, res, next) {


    var user_id=req.body.user_id;
    var location=req.body.location;
    var latitude=req.body.latitude;
    var longitude=req.body.longitude;
    var wish=req.body.wish;
    var date=req.body.date;
    var startTime=req.body.startTime;
    var finishTime=req.body.finishTime;

    var query = 'insert into Matching(user_id, location, latitude, longitude, wish, date, startTime, finishTime) values(?,?,?,?,?,?,?,?);';
    var value=[user_id, location, latitude, longitude, wish, date, startTime, finishTime];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('Insert info'+'\n');
                    res.sendStatus(200);
                    connection.release();
                }
            });
        }
    });

});

//내가 등록한 모든 봉사정보
router.get('/volunteerinfo/load/all', function(req, res, next) {


    var user_id=req.query.user_id;

    var query = 'select * from Matching where user_id = ?';
    var value=[user_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('Select info'+'\n');
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });

});

//내가 등록한 특정 봉사정보
router.get('/volunteerinfo/load/one', function(req, res, next) {


    var matching_id=req.query.matching_id;

    var query = 'select * from Matching where matching_id = ?';
    var value=[matching_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('Select info'+'\n');
                    res.status(200).send(rows[0]);
                    connection.release();
                }
            });
        }
    });

});

//매칭된 상대 정보
router.get('/matchinginfo/load', function(req, res, next){

    var matching_id=req.query.matching_id;
    var query='select * from MatchingInfo where matching_id = ?';
    var value=[matching_id];

    pool.getConnection(function(error, connection){
       if(error){
           console.log("getConnection Error : "+error);
           res.sendStatus(500);
       } else{
           connection.query(query, value, function(error2, rows){
              if(error){
                  console.log("Connection Error : "+error2);
                  res.sendStatus(500);
                  connection.release();
              } else{

                  //사실 얘는 호출될 일 없음 클라에서 애초에 요청 안보냄
                  if(rows.length==0){
                      console.log('매칭정보없음');
                      res.sendStatus(204);
                      connection.release();
                      return;
                  }

                  console.log('매칭정보있음');

                  query='select * from User where user_id = ?';
                  value=[rows[0].user_id];

                  console.log("user_id : "+rows[0].user_id);
                  connection.query(query, value, function (error3, rows2) {
                      if(error3){
                          console.log("Connection Error2 : "+error2);
                          res.sendStatus(500);
                          connection.release();
                      }else{
                          console.log("데이터 수 : "+rows2.length);
                          console.log("user_id : "+rows2[0].user_id);
                          console.log("name : "+rows2[0].name);
                          console.log("age : "+rows2[0].age);
                          console.log("phone : "+rows2[0].phone);


                          res.send(rows2[0]);
                          connection.release();
                      }
                  });

              }
           });
       }
    });
});




module.exports = router;
