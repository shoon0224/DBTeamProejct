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

router.get('/orderList', function(req, res, next){
  var sess = req.session;
  var order_no = [];
  var order_no2 = [];
  var img = [];  var name = [];  var date = [];  var state = [];  var price = [];
  var img2 = [];  var name2 = [];  var date2 = [];  var state2 = [];  var price2 = []; var entrep2=[];
  pool.getConnection(function(err,con){
    if(err) throw err;
    else{
      var sql = "select o.order_no, date_format(o.order_date,'%y-%m-%d %T') as order_date, o.order_state ,p.prod_id, p.prod_img, p.prod_name, op.orders_prod_count, op.orders_prod_price from prod p, orders_prod op, orders o where p.prod_id = op.prod_id and op.order_no = o.order_no and op.entrep_id=p.entrep_id and o.member_id = ? and o.order_state!='배송완료' ORDER BY order_no ASC";
      con.query(sql, [sess.info.member_id], (err,result)=>{
        if(err){
          throw err;
        }
        else{
          for(var i = 0; i < result.length; i++){
            order_no.push(result[i].order_no);
            img.push(result[i].prod_img);
            name.push(result[i].prod_name);
            state.push(result[i].order_state);
            date.push(result[i].order_date);
            price.push(result[i].orders_prod_count * result[i].orders_prod_price);
          }
          for(var j = 0; j < order_no.length; j++){
            for(var k = 0; k < order_no.length; k++){
              if (order_no[j] == order_no[j+1]){
                price[k] = price[k+1] + price[k];
                img[k] = img[k] +',' +img[k+1];
                name[k] = name[k] +','+ name[k+1];

                price.splice(k+1, 1);
                order_no.splice(k+1, 1);
                img.splice(k+1, 1);
                name.splice(k+1, 1);
                state.splice(k+1, 1);
                date.splice(k+1,1);
              }
            }
          }
          var sql = "select o.order_no, date_format(o.order_date,'%y-%m-%d %T') as order_date, o.order_state ,p.prod_id, p.prod_img, p.prod_name, op.orders_prod_count, op.orders_prod_price, op.entrep_id from prod p, orders_prod op, orders o where p.prod_id = op.prod_id and o.order_state='배송완료' and op.order_no = o.order_no and op.entrep_id=p.entrep_id and o.member_id = ? ORDER BY order_no ASC";
          con.query(sql, [sess.info.member_id], (err,row)=>{
            if(err){
              throw err;
            }
            else{
              for(var l = 0; l < row.length; l++){
                order_no2.push(row[l].order_no);
                img2.push(row[l].prod_img);
                name2.push(row[l].prod_name);
                state2.push(row[l].order_state);
                date2.push(row[l].order_date);
                entrep2.push(row[l].entrep_id);
                price2.push(row[l].orders_prod_count * row[l].orders_prod_price);
              }
              for(var m = 0; m < order_no2.length; m++){
                for(var n = 0; n < order_no2.length; n++){
                  if (order_no2[m] == order_no2[m+1]){
                    price2[n] = price2[n+1] + price2[n];
                    img2[n] = img2[n] +',' +img2[n+1];
                    name2[n] = name2[n] +','+ name2[n+1];

                    price2.splice(n+1, 1);
                    order_no2.splice(n+1, 1);
                    img2.splice(n+1, 1);
                    name2.splice(n+1, 1);
                    state2.splice(n+1, 1);
                    date2.splice(n+1,1);
                    entrep2.splice(n+1,1);
                  }
                }
              }
              console.log(price, order_no, img, name, state);
              res.render('index', { page: './sub/orderList', sess : sess, price : price, order_no : order_no, img : img, name : name, state : state, result : result, date: date, price2 : price2, order_no2 : order_no2, img2 : img2, name2 : name2, state2 : state2, data2 : row, date2: date2, entrep2:entrep2});
            }
          });
        }
      });
    }
  });
}); //주문 -- 수정필요(주문상태 update)

router.post('/review/:e_id',function(req,res,next){
  var sess=req.session;
  var e_id=req.params.e_id;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="insert into review values(null,?,?,?,?,now())"
    conn.query(sql,[sess.info.member_id,e_id,req.body.review_grade,req.body.review_content],(err,row)=>{
      if(err){
        throw err;
      }
      if(row){
        var sql = "update entrep set entrep_review_grade=(SELECT AVG(review_grade) FROM review where entrep_id=?) where entrep_id=?"
            conn.query(sql, [e_id,e_id], function (err, row) {
              if (err) {
                throw err;
              }
              if (row) {
                sess.info = row[0];
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                res.write("<script>alert('리뷰가 등록되었습니다.');location.href='/';</script>")
              }

            })
      }
    })
  })
})

router.get('/cartOrder',function(req,res,next){
  var sess=req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql = "select cart_has_prod.*, entrep.*, prod.* from cart_has_prod,entrep,prod where cart_has_prod.member_id=? and cart_has_prod.entrep_id=entrep.entrep_id and cart_has_prod.prod_id=prod.prod_id and cart_has_prod.entrep_id=prod.entrep_id"
    conn.query(sql,[sess.info.member_id],(err,row)=>{
      if(err){
        throw err;
      }
      if(row){
        var sql = "select member_card.*, card.* from member_card,card where member_card.member_id=? and member_card.card_no=card.card_no"
        conn.query(sql,[sess.info.member_id],(err,result)=>{
          console.log(row);
          if(err){
            throw err;
          }
          res.render('index', { page: './sub/order.ejs', data:row, data2:result, sess: sess });
        })
      }
    })
  })
});
router.post('/cartOrder',function(req,res,next){
  var sess=req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="select cart.*,cart_has_prod.* from cart,cart_has_prod where cart.member_id=? and cart.member_id=cart_has_prod.member_id";
    conn.query(sql,[sess.info.member_id],(err,row)=>{
      if(err){
        throw err;
      }
      console.log(row);
      var order_price=row[0].cart_price;
      var sql="insert into orders values(null,?,'대기',?,now(),?,?,null,?)";
      conn.query(sql,[sess.info.member_id,order_price,req.body.card_no,req.body.order_hope_rec,req.body.o_tel],(err,row)=>{
        if(err){
          throw err;
        }console.log('접근')
        if(row){
          var sql = "insert into orders_prod select LAST_INSERT_ID(), cart_has_prod.prod_id,cart_has_prod.entrep_id,cart_has_prod.cart_prod_count,cart_has_prod.cart_prod_price from cart_has_prod where cart_has_prod.member_id=? ";
          conn.query(sql,[sess.info.member_id],(err,row)=>{
            if(err){
              throw err;
            }
            if(row){
              var sql = "delete from cart_has_prod where member_id=?"
              conn.query(sql,[sess.info.member_id],(err,row)=>{
                if(err){
                  throw err;
                }
                if(row){
                  var sql = "update cart set cart_price=0 where member_id=?";
                  conn.query(sql,[sess.info.member_id],(err,row)=>{
                    if(err){
                      throw err;
                    }
                    if(row){
                      var member_buy_sum= sess.info.member_buy_sum + order_price
                      var sql="update members set member_buy_sum=? where member_id=?"
                      conn.query(sql,[member_buy_sum,sess.info.member_id],(err,row)=>{
                        if(err){
                          throw err;
                        }
                        if(row){
                          var sql = "select * From members where member_id = ? AND member_pwd = ?";
                          conn.query(sql, [sess.info.member_id, sess.info.member_pwd], (err, row) => {
                            conn.release();
                            if (err) {
                              throw err;
                            }
                            else {
                              sess.info = row[0];
                              console.log(sess.info);
                              res.send("<script>alert('주문이 완료되었습니다.'); history.back();</script>");
                            }
                          });
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }else{
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('주문을 실패했습니다.');history.back();</script>")
        }
      })
    })
  })
})

router.post('/order/:p_id/:e_id',function(req,res,next){
  var sess=req.session;
  var p_id=req.params.p_id;
  var o_num=req.body.c_amount;
  var e_id=req.params.e_id;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql = "select prod.*,entrep.* from prod,entrep where prod.prod_id=? and prod.entrep_id=? and prod.entrep_id=entrep.entrep_id "
    conn.query(sql,[p_id,e_id],(err,row)=>{
      if(err){
        throw err;
      }
      if(row){
        var sql = "select member_card.*, card.* from member_card,card where member_card.member_id=? and member_card.card_no=card.card_no"
        conn.query(sql,[sess.info.member_id],(err,result)=>{
          console.log(result);
          if(err){
            throw err;
          }
          var price=row[0].prod_price*o_num
          res.render('index', { page: './sub/order.ejs', data:row, data2:result, o_num:o_num, price:price, sess: sess });
        })
      }
    })
  })
});
router.post("/orders/:p_id",function(req,res,next){
  var sess=req.session;
  var p_id=req.params.p_id;
  pool.getConnection(function(err,conn){
    if(err){
      throw err;
    }
    var sql="insert into orders values(null,?,'대기',?,now(),?,null,null,?)"
    conn.query(sql, [sess.info.member_id,req.body.o_price,req.body.card_no,req.body.o_tel],(err,row)=>{
      if(err){
        throw err;
      }
      if(row){
        var sql="select prod.entrep_id from prod where prod_id=?"
        conn.query(sql,[p_id],(err,row)=>{
          if(err){
            throw err;
          }
          if(row){
            var entrep_id=row[0].entrep_id;
            var sql="insert into orders_prod values(LAST_INSERT_ID(),?,?,?,?)"
            conn.query(sql,[p_id,entrep_id,req.body.amount,req.body.o_price],(err,result)=>{
              if(err){
                throw err;
              }
              if(result){
                var member_buy_sum= sess.info.member_buy_sum + parseInt(req.body.o_price)
                var sql="update members set member_buy_sum=? where member_id=?"
                conn.query(sql,[member_buy_sum,sess.info.member_id],(err,row)=>{
                  if(err){
                    throw err;
                  }
                  if(row){
                    var sql = "select * From members where member_id = ? AND member_pwd = ?";
                          conn.query(sql, [sess.info.member_id, sess.info.member_pw], (err, row) => {
                            conn.release();
                            if (err) {
                              throw err;
                            }
                            else {
                              sess.info = row[0];
                              console.log(sess.info);
                              res.send("<script>alert('주문이 완료되었습니다.'); history.back();</script>");
                            }
                          });
                  }
                })
              }
            })
          }
        })
      }else{
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write("<script>alert('주문을 실패했습니다.');history.back();</script>")
      }
    })
  })
})

module.exports = router;
