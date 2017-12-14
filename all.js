var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');
var aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
var s3 = new aws.S3();
var multer = require('multer');
var multerS3 = require('multer-s3');

var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});


var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'togetherproject2',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, file.originalname);
        }
    })
});

// 유저 등록하기: 사진있음
router.post('/user/register', upload.single('image'), function(req, res, next) {

    var name=req.body.name;
    var phone=req.body.phone;
    var age=req.body.age;
    var gender=req.body.gender;
    var token=req.body.token;
    var image_path=req.file.location;

    console.log(name);
    console.log(phone);
    console.log(age);
    console.log(gender);
    console.log(token);

    var query = 'insert into User(name, age, gender, phone, token, image_path) values(?,?,?,?,?,?);';
    var value=[name, age, gender, phone, token, image_path];

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

                    query='SELECT user_id FROM User WHERE phone = ? ORDER BY user_id DESC limit 1';
                    value=[phone];
                    connection.query(query,value,function(error2, rows2) {
                        if (error2) {
                            console.log("Connection Error" + error);
                            res.sendStatus(500);
                            connection.release();
                        } else {
                            console.log('Register User');
                            console.log(Number(rows2[0].user_id));
                            res.send(rows2[0]);
                            connection.release();
                        }
                    });
                    //
                }
            });
        }
    });

});


// 유저 등록하기:사진없음
router.post('/user/register2', function(req, res, next) {

    var name=req.body.name;
    var phone=req.body.phone;
    var age=req.body.age;
    var gender=req.body.gender;
    var token=req.body.token;

    console.log(name);
    console.log(phone);
    console.log(age);
    console.log(gender);
    console.log(token);

    var query = 'insert into User(name, age, gender, phone, token) values(?,?,?,?,?);';
    var value=[name, age, gender, phone, token];

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

                    query='SELECT user_id FROM User WHERE phone = ? ORDER BY user_id DESC limit 1';
                    value=[phone];
                    connection.query(query,value,function(error2, rows2) {
                        if (error2) {
                            console.log("Connection Error" + error);
                            res.sendStatus(500);
                            connection.release();
                        } else {
                            console.log('Register User');
                            console.log(Number(rows2[0].user_id));
                            res.send(rows2[0]);
                            connection.release();
                        }
                    });
                    //
                }
            });
        }
    });

});

// SNS 글 등록
router.post('/sns/newposting', upload.single('image'),function(req, res, next) {

    var user_id=req.body.user_id;
    var image_path=req.file.location;
    var content=req.body.content;
    var date=req.body.date;

    console.log(user_id);
    console.log(image_path);
    console.log(content);
    console.log(date);

    var query = 'insert into SNS(user_id, image_path, content, date) values(?,?,?,?);';
    var value=[user_id, image_path, content, date];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(501);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(502);
                    connection.release();
                } else {
                    console.log('Insert SNS : '+'\n');
                    res.sendStatus(200);
                    connection.release();
                }
            });
        }
    });

});


// 모든 SNS
router.get('/sns/load', function(req, res, next) {

    var query = 'select ' +
        'tb1.post_id, ' +
        'tb1.user_id, ' +
        'tb1.image_path, ' +
        'tb1.content, ' +
        'tb1.date, ' +
        'tb1.like_count, ' +
        'tb2.name ' +
        'from SNS as tb1 ' +
        'INNER JOIN User as tb2 ' +
        'on tb1.user_id = tb2.user_id ' +
        'ORDER BY post_id DESC';

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('Select SNS : '+'\n');
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });

});


// 내 SNS
router.get('/sns/load/my', function(req, res, next) {

    var user_id = req.query.user_id;

    var query = 'select * from SNS where user_id = ? ORDER BY post_id DESC';
    var value = [user_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('Select MY SNS : '+'\n');
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });

});

// SNS 삭제
router.get('/sns/delete/my', function(req, res, next) {

    var post_id = req.query.post_id;

    var query = 'delete from SNS where post_id = ?';
    var value = [post_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('DELETE MY SNS : '+'\n');
                    res.sendStatus(200)
                    connection.release();
                }
            });
        }
    });

});


// SNS 좋아요
router.get('/sns/like', function(req, res, next) {

    var post_id = req.query.post_id;

    var query = 'SELECT * from SNS where post_id = ?';
    var value = [post_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value, function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {

                    query = 'UPDATE SNS SET like_count = ? where post_id = ?';
                    value = [rows[0].like_count+1, post_id];

                    connection.query(query, value, function(error, rows) {
                        if (error) {
                            console.log("Connection Error" + error);
                            res.sendStatus(500);
                            connection.release();
                        } else {
                            console.log('UPDATE likecount : '+'\n');
                            res.sendStatus(200)
                            connection.release();
                        }
                    });
                }
            });
        }
    });

});



// comment 가져오기
router.get('/comment/load', function(req, res, next) {

    var post_id=req.query.post_id;

    var query = "select tb1.post_id, tb1.content, tb1.date, tb2.name, tb2.image_path from Comment as tb1 INNER JOIN User as tb2 on tb1.user_id = tb2.user_id where tb1.post_id = ? order by comment_id";
    var value = [post_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('LOAD COMMENT : '+'\n');
                    console.log(rows);
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });

});


// Comment 등록
router.post('/comment/register', function(req, res, next) {

    var post_id=req.body.post_id;
    var content=req.body.content;
    var date=req.body.date;
    var user_id=req.body.user_id;


    var query = 'insert into Comment(post_id,content, date, user_id) values(?,?,?,?);';
    var value=[post_id,content, date , user_id];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(501);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(502);
                    connection.release();
                } else {

                    query = "select tb1.post_id, tb1.content, tb1.date, tb2.name, tb2.image_path from Comment as tb1 " +
                        "INNER JOIN User as tb2 " +
                        "on tb1.user_id = tb2.user_id " +
                        "where tb1.post_id = ? order by comment_id";

                    value = [post_id];

                    connection.query(query, value,function(error, rows) {
                        if (error) {
                            console.log("Connection Error" + error);
                            res.sendStatus(500);
                            connection.release();
                        } else {
                            console.log('Insert Comment : '+'\n');
                            console.log(rows);
                            res.status(200).send(rows);
                            connection.release();
                        }
                    });
                }
            });
        }
    });

});



module.exports = router;
