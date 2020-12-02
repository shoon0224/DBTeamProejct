var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'shoon0224',
  port: 3306,
  database: 'market',
  use_prepared_statements: 'N',
};
var pool = mysql.createPool(dbConfig);

router.get('/', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    } else {
      var sql = "select entrep.*, entrep_class.*, entrep_class_id.* from entrep,entrep_class,entrep_class_id where entrep.entrep_id=entrep_class.entrep_id and entrep_class.entrep_class_id=entrep_class_id.entrep_class_id "
      conn.query(sql, function (err, row) {
        if (err) {
          throw err;
        }
        console.log(row);
          res.render('index', { page: './sub/main.ejs', sess: sess,  data: row });
      })
    }
  })
});//메인화면요청

router.post('/inquire',function(req,res,next){
  var sess=req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="select entrep.*, entrep_class.*, entrep_class_id.* from entrep,entrep_class,entrep_class_id where entrep.entrep_id=entrep_class.entrep_id and entrep_class.entrep_class_id=entrep_class_id.entrep_class_id and entrep.entrep_mutual_name like concat('%', ?, '%')"
    conn.query(sql,[req.body.inquire], function (err, row) {
      if (err) {
        throw err;
      }
      if(row==0){
        var sql= "select entrep.*, entrep_class.*, entrep_class_id.* from entrep,entrep_class,entrep_class_id where entrep.entrep_id=entrep_class.entrep_id and entrep.entrep_id in(select entrep_id from prod where prod_name like concat('%', ?, '%'))and entrep_class.entrep_class_id=entrep_class_id.entrep_class_id "
        conn.query(sql,[req.body.inquire],(err,row)=>{
          if(err){
            throw err;
          }
          res.render('index', { page: './sub/main.ejs', sess: sess,  data: row });
        })
      }
      else{
        console.log(row);
        res.render('index', { page: './sub/main.ejs', sess: sess,  data: row });
      }
    })
  })
})

router.get('/detail/:e_id', function (req, res, next) {
  var sess = req.session;
  var e_id = req.params.e_id
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    };
    var sql = "select entrep.*, entrep_class.*, entrep_class_id.* from entrep,entrep_class,entrep_class_id where entrep.entrep_id=? and entrep_class.entrep_id=? and entrep_class.entrep_class_id=entrep_class_id.Entrep_class_id"
    conn.query(sql, [e_id, e_id], function (err, row) {
      if (err) {
        throw err;
      }
      if (row) {
        var sql = "select review.*,date_format(review_date,'%y-%m-%d') AS rdate from review where entrep_id=?";
        conn.query(sql, [e_id], function (err, row2) {
          if (err) {
            throw errl
          }
          res.render('index', { page: "./sub/detail.ejs", data: row, data2: row2, sess: sess });

        })
      }

    })
  })
});//메인화면요청

router.get('/prodList/:e_id', function (req, res, next) {
  var sess = req.session;
  var e_id = req.params.e_id;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select prod.*,entrep.* from prod,entrep where prod.entrep_id=? and prod.entrep_id=entrep.entrep_id"
    conn.query(sql, [e_id], function (err, row) {
      conn.release();
      if (err) {
        throw err;
      }
      if(row!=0){
        console.log(row);
        res.render('index', { page: './sub/prodList', data: row, sess: sess });
      }else{
        res.send(`<script> alert('등록된 상품이 없습니다.');  history.back(); </script>`);
      }


    })
  })

})

router.get('/prodDetail/:p_id/:e_id', function (req, res, next) {
  var sess = req.session;
  var p_id = parseInt(req.params.p_id);
  var e_id = req.params.e_id;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select * from prod where prod_id=? and entrep_id=?"
    conn.query(sql, [p_id, e_id], function (err, row) {
      if (err) {
        throw err;
      }
      if (row) {
        var sql = "select detail_img_name from detail_img where prod_id=? and entrep_id=?";
        conn.query(sql, [p_id,e_id], function (err, result) {
          conn.release();
          if (err) {
            throw err;
          }
          console.log(result);
          console.log(row);
          res.render('index', { page: './sub/prodDetail', data: row, data2: result, sess: sess });
        })
      }
    })
  })
})



/* GET users listing. */
router.get('/login', function (req, res, next) {
  var sess = req.session;
  res.render('index', { page: './login', sess: sess });
});//로그인 페이지 요청

router.post('/login', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    if (req.body.master == 1) {
      var sql = "select * From entrep where entrep_id = ? AND entrep_pwd = ?";
      conn.query(sql, [req.body.id, req.body.pwd], (err, row) => {
        console.log(row)
        conn.release();
        if (err) {
          res.send(300, {
            result: 0,
            msg: 'DB Error'
          });
        }
        if (row.length === 0) {
          res.send(`<script> alert('로그인에 실패하였습니다.');  history.back(); </script>`);
        }
        else {
          sess.info = row[0];
          res.redirect('/entrep/e_main');
        }
      });
    }
    if (req.body.master == 0) {
      var sql = "select * From members where member_id = ? AND member_pwd = ?";
      conn.query(sql, [req.body.id, req.body.pwd], (err, row) => {
        console.log(row)
        conn.release();
        if (err) {
          res.send(300, {
            result: 0,
            msg: 'DB Error'
          });
        }
        if (row.length === 0) {
          res.send(`<script> alert('로그인에 실패하였습니다.');  history.back(); </script>`);
        }
        else {
          sess.info = row[0];
          res.redirect('/');
        }
      });
    }
  })
});//로그인 요청

router.post('/logout', function (req, res, next) {
  var sess = req.session;
  sess.destroy();
  res.redirect('/');
});//로그아웃 요청

module.exports = router;
