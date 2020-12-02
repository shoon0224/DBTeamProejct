var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
var dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'shoon0224',
  port: 3306,
  database: 'market',
  use_prepared_statements: 'N',
};

var pool = mysql.createPool(dbConfig);
router.post('/like/:e_id', function (req, res, next) {
  var sess = req.session;
  var e_id = req.params.e_id;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "insert into favorite_entrep values (?,?)";
    conn.query(sql, [sess.info.member_id, e_id], (err, row) => {
      conn.release();
      if (err) {
        throw err;
      }
      sess.info = row[0];
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.write("<script>alert('관심업체에 등록하였습니다.');location.href='/';</script>")
    });
  })
});//관심업체 등록

router.get('/userInfo', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select favorite_entrep.*, entrep.* from favorite_entrep,entrep where favorite_entrep.member_id=? and favorite_entrep.entrep_id=entrep.entrep_id";
    conn.query(sql, [sess.info.member_id], (err, row) => {
      conn.release();
      if (err) {
        throw err;
      }
      if (row) {
        var sql = "select review.*, entrep.* from review,entrep where review.member_id=? and review.entrep_id=entrep.entrep_id";
        conn.query(sql, [sess.info.member_id], (err, result) => {
          if (err) {
            throw err;

          }
          res.render('index', { page: "./sub/userInfo.ejs", data: row, data2: result, sess: sess });
        })
      }
    });
  })
});//회원정보페이지

router.get('/likeDelete/:e_id', function (req, res, next) {
  var sess = req.session;
  var e_id = req.params.e_id;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    console.log("DB Connection");
    var sql = "delete from favorite_entrep where entrep_id= ? and member_id=?";
    conn.query(sql, [e_id, sess.info.member_id], function (err, result) {
      conn.release();
      if (err) {
        throw err;
      }
      if (result) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write("<script>alert('삭제가 완료되었습니다.');location.href='/';</script>")
      }
      else {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write("<script>alert('삭제가 되지 않았습니다.');history.back();</script>")
      }
    });
  })
});

router.get('/reviewDelete/:r_no', function (req, res, next) {
  var sess = req.session;
  var r_no = req.params.r_no;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    console.log("DB Connection");
    var sql = "delete from review where review_no= ?";
    conn.query(sql, [r_no], function (err, result) {
      conn.release();
      if (err) {
        throw err;
      }
      if (result) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write("<script>alert('삭제가 완료되었습니다.');location.href='/';</script>")
      }
      else {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write("<script>alert('삭제가 되지 않았습니다.');history.back();</script>")
      }
    });
  })
});

router.get('/cart', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select prod.*, cart_has_prod.* from prod,cart_has_prod where cart_has_prod.member_id=? and cart_has_prod.prod_id=prod.prod_id and prod.entrep_id=cart_has_prod.entrep_id";
    conn.query(sql, [sess.info.member_id], (err, row) => {
      conn.release();
      if (err) {
        throw err;
      }
      res.render('index', { page: "./sub/cart.ejs", data: row, sess: sess });

    })
  })
})
router.post('/cart/:p_id/:e_id', function (req, res, next) {
  var sess = req.session;
  var p_id = req.params.p_id;
  var c_amount = req.body.c_amount;
  var e_id=req.params.e_id
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql="select * from cart_has_prod where member_id=? and entrep_id !=?"
    conn.query(sql,[sess.info.member_id,e_id],(err,row)=>{
      if(err){
        throw err;
      }
      if(row.length === 0){
        var sql = "select * from cart where member_id=? and cart_price>=0";
        conn.query(sql, [sess.info.member_id], (err, row) => {
        if (err) {
          throw err;
        }
        if (row.length === 0) {
          console.log("첫장바구니")
          var sql = "select prod_price,entrep_id from prod where prod_id=? and entrep_id=?";
          conn.query(sql, [p_id,e_id], (err, row) => {
            if (err) {
              throw err;
            }
            if (row) {
              var c_price = parseInt(c_amount) * row[0].prod_price;
              var sql = "insert into cart values (?,?)";
              conn.query(sql, [sess.info.member_id, c_price], (err, row) => {
                if (err) {
                  throw err;
                }
                if (row) {
                  var sql = "insert into cart_has_prod values (?,?,?,?,?)";
                  conn.query(sql, [sess.info.member_id, p_id, e_id, c_amount, c_price], (err, result) => {
                    conn.release();
                    if (err) {
                      throw err;
                    }
                    if (result) {
                      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                      res.write("<script>alert('카트에 등록되었습니다.');location.href='/';</script>")
                    }
                  })
                }
              })
            }
          })
        }
        else {
          console.log("두번쨰장바구니")
          var price = parseInt(row[0].cart_price);
          var sql = "select * from cart_has_prod where member_id=? and prod_id=? and entrep_id=?";
          conn.query(sql, [sess.info.member_id, p_id,e_id], (err, row) => {
            if (err) {
              throw err;
            }
            if (row.length === 0) {
              var sql = "select prod_price,entrep_id from prod where prod_id=?";
              conn.query(sql, [p_id,e_id], (err, row) => {
                if (err) {
                  throw err;
                }
                if (row) {
                  var e_id = row[0].entrep_id;
                  var c_price = parseInt(c_amount * row[0].prod_price);
                  var sql = "insert into cart_has_prod values (?,?,?,?,?)";
                  conn.query(sql, [sess.info.member_id, p_id, e_id, c_amount, c_price], (err, result) => {
                    if (err) {
                      throw err;
                    }
                    if (result) {
                      var cprice = price+c_price;
                      console.log(cprice);
                      var sql = "update cart set cart_price=? where member_id=?";
                      conn.query(sql, [cprice, sess.info.member_id], (err, result) => {
                        conn.release();
                        if (err) {
                          throw err;
                        }
                        if (result) {
                          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                          res.write("<script>alert('카트에 등록되었습니다.');location.href='/';</script>")
                        }
                      })
                    }
                  })
                }
              })
            }
            else {
              res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
              res.write("<script>alert('이미 카트에 담긴 상품입니다.');history.back();</script>")
            }
          })
        }
      })

      }else{
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
              res.write("<script>alert('다른업체의 상품이 있습니다.');history.back();</script>")
      }
    })
  })
});
router.get('/deleteCart/:p_id/:e_id', function (req, res, next) {
  var sess = req.session;
  var p_id = req.params.p_id;
  var e_id = req.params.e_id
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select cart_prod_price from cart_has_prod where member_id=? and prod_id=? and entrep_id=?";
    conn.query(sql, [sess.info.member_id, p_id,e_id], (err, row) => {
      if (err) {
        throw err;
      }
      if (row) {
        console.log(row);
        var cart_prod_price = parseInt(row[0].cart_prod_price);
        var sql = "select cart_price from cart where member_id=?";
        conn.query(sql, [sess.info.member_id], (err, result) => {
          if (err) {
            throw err;
          }
          if (result) {
            console.log(row);
            var cprice = parseInt(result[0].cart_price) - cart_prod_price;
            var sql = "update cart set cart_price=? where member_id=?";
            conn.query(sql, [cprice, sess.info.member_id], (err, row) => {
              if (err) {
                throw err;
              }
              if (row) {
                var sql = "delete from cart_has_prod where member_id=? and prod_id=? and entrep_id=?";
                conn.query(sql, [sess.info.member_id, p_id,e_id], function (err, result) {
                  conn.release();
                  if (err) {
                    throw err;
                  }
                  if (result) {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('삭제가 완료되었습니다.');location.href='/members/cart';</script>")
                  }
                  else {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('삭제가 되지 않았습니다.');history.back();</script>")
                  }
                });
              }
            })
          }
        })
      }
    })
  })
});


module.exports = router;
