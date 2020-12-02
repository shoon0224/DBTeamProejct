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

var _storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: _storage });

/* GET users listing. */

router.get('/e_review', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_review = "select r.review_grade, r.review_content, date_format(r.review_date, '%y-%m-%d %H:%i') as review_date, m.member_name from review r, members m where r.member_id = m.member_id and r.entrep_id = ?";
      conn.query(sql_review, [sess.info.entrep_id], (err, review) => {
          if(err){
            throw err;
          }
          else{
            res.render('index', { page: './sub/e_review', data : review, sess: sess });
          }
      });
    }
  });
});//리뷰 페이지 요청

router.get('/e_prod', function (req, res, next) {
  var sess = req.session;
  console.log(sess);
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_prod = "select p.prod_id, p.prod_img, p.prod_name, p.prod_state, pc.prod_class_id, p.prod_price from prod_class pc, prod p where p.entrep_id = ?";
      conn.query(sql_prod, [sess.info.entrep_id], (err, prod) => {
          if(err){
            throw err;
          }
          else{
            res.render('index', { page: './sub/e_prod', data : prod, sess: sess });
          }
      });
    }
  });
});//상품관리 페이지 요청

router.get('/e_modProd/:prod_id', function(req, res, next){
  var sess = req.session;
  var prod_id = req.params.prod_id;
  pool.getConnection(function(err, conn){
    if(err){
      throw err;
    }
    else{
      // console.log(prod_id);
      var sql_modProd = "select prod_id, prod_name, prod_price, prod_state, prod_class_id from prod where prod_id = ? and entrep_id = ?";
      conn.query(sql_modProd, [prod_id, sess.info.entrep_id], (err, modProd) =>{
        if(err){
          throw err;
        }
        else{
          res.render('index', { page: './sub/e_modProd', data : modProd, sess: sess });
        }
      });
    }
  });
}); //상품 수정 페이지 요청

router.get('/e_entrep',function(req,res,next){
  var sess=req.session;
  pool.getConnection(function(err,conn){
    if(err){
      throw err;
    }
    var sql="select e.entrep_logo, e.entrep_id, e.entrep_pwd, e.entrep_state, e.entrep_address, e.entrep_tel_no, e.entrep_email, eci.entrep_class_name from entrep e, entrep_class ec, entrep_class_id eci where e.entrep_id = ec.entrep_id and ec.entrep_class_id = eci.entrep_class_id and e.entrep_id = ?";
    // var sql = "select e.entrep_id from entrep e where entrep_id = ? ";
    conn.query(sql,[sess.info.entrep_id],(err,row) => {
      // console.log(row);
      res.render('index', { page: './sub/e_entrep', data: row, sess: sess });
    });
  });
});//업체관리 페이지 요청

router.get('/e_main', function(req, res, next){
  var sess = req.session;
  console.log(sess.info.logo);
  var order_no = [];
  var max = 11;
  var img = [];  var name = [];  var date = [];  var state = [];  var price = [];
  console.log(sess.info.entrep_id);
  pool.getConnection(function(err, con){
    if(err) throw err;
    else{
      var sql_order = "select o.order_no, date_format(o.order_date,'%y-%m-%d %H:%i') as order_date, o.order_state ,p.prod_id, p.prod_img, p.prod_name, op.orders_prod_count, op.orders_prod_price from prod p, orders_prod op, orders o where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and op.entrep_id = p.entrep_id ORDER BY order_no ASC";
      con.query(sql_order, [sess.info.entrep_id], (err, data) => {
        con.release();
        if (err) {
          throw err;
        }
        else{
          for(var i = 0; i < data.length; i++){
            order_no.push(data[i].order_no);
            img.push(data[i].prod_img);
            name.push(data[i].prod_name);
            state.push(data[i].order_state);
            date.push(data[i].order_date);
            price.push(data[i].orders_prod_count * data[i].orders_prod_price);
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
          console.log(name);
          res.render('index', { page: './sub/e_main', price : price, order_no : order_no, max : max, img : img, name : name, state : state, sess : sess, date: date });
        }
      });
    }
  });
});

router.get('/e_order', function(req, res, next){
  var sess = req.session;
  var order_no = [];
  var img = [];  var name = [];  var date = [];  var state = [];  var price = [];
  pool.getConnection(function(err,con){
    if(err) throw err;
    else{
      var sql = "select o.order_no, date_format(o.order_date,'%y-%m-%d %H:%i') as order_date, o.order_state ,p.prod_id, p.prod_img, p.prod_name, op.orders_prod_count, op.orders_prod_price from prod p, orders_prod op, orders o where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and op.entrep_id = p.entrep_id ORDER BY order_no ASC";
      con.query(sql, [sess.info.entrep_id], (err,result)=>{
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
          console.log(price, order_no, img, name, state);
          res.render('index', { page: './sub/e_order', sess : sess, price : price, order_no : order_no, img : img, name : name, state : state, result : result, date: date});
        }
      });
    }
  });
}); //주문

router.get('/e_regProd', function(req, res, next){
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      res.render('index', {page : './sub/e_regProd', sess : sess });
    }
  });
}); //상품 등록 페이지 요청

router.get('/e_stat_prod_sum', function(req, res, next){
  var sess = req.session;
  var prod_name = [];
  var prod_count = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      pool.getConnection(function(err, conn){
        if(err){
          throw err;
        }
        else{
          var sql_stat_prod = "select DISTINCT o.order_date, op.orders_prod_count, op.orders_prod_price, p.prod_name from prod p, orders_prod op, orders o where op.order_no = o.order_no and op.prod_id = p.prod_id and p.entrep_id = ? and o.order_rec >= date_format(now(), '%Y-%m-01') and o.order_rec<= last_day(now()) and o.order_state = '수령'";
          // var sql_stat_prod = "select p.prod_name, op.orders_prod_count, op.orders_prod_price from orders o, orders_prod op, prod p where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and o.order_date between ? and ?";
          conn.query(sql_stat_prod, [sess.info.entrep_id], (err, stat_prod) => {
            conn.release();
            if(err){
              throw err;
            }
            else{
              for(var i = 0; i < stat_prod.length; i++){
                prod_name.push(stat_prod[i].prod_name);
                prod_count.push(stat_prod[i].orders_prod_count);
              }
              // console.log(prod_name);
              // console.log(prod_count);

              for(var j = stat_prod.length; j > 0; j--){
                for(var k = 0; k < j; k++){
                  if(prod_name[k] < prod_name[k + 1]){
                    var temp_name = prod_name[k];
                    prod_name[k] = prod_name[k + 1];
                    prod_name[k+1] = temp_name;

                    var temp_count = prod_count[k];
                    prod_count[k] = prod_count[k+1];
                    prod_count[k + 1] = temp_count;
                  }
                }
              }
              //정렬
              console.log(prod_name);
              console.log(prod_count);

              for(var l = 0; l < stat_prod.length; l++){
                for(var m = 1; m < stat_prod.length; m++){
                  if(prod_name[l] == prod_name[l+1]){
                    console.log(prod_name[j]);
                    prod_count[l] = prod_count[l] + prod_count[l+1];
                    prod_count.splice(l+1, 1);
                    prod_name.splice(l+1,1);
                  }
                }
              }
              //정렬 후 중복제거 및 판매량 합계
              res.render('index', {page : './sub/e_stat_prod_sum', sess : sess, prod_name : prod_name, prod_count : prod_count});
            }
          });
        }
      });
    }
  });
});//판매량순 통계 불러오기

router.get('/e_stat_prod_price', function(req, res, next){
  var sess = req.session;
  console.log(sess);
  var prod_name = [];
  var prod_price = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      pool.getConnection(function(err, conn){
        if(err){
          throw err;
        }
        else{
          console.log(sess.info.entrep_id);
          var sql_stat_prod_price = "select DISTINCT o.order_date, op.orders_prod_count, op.orders_prod_price, p.prod_name from prod p, orders_prod op, orders o where op.order_no = o.order_no and op.prod_id = p.prod_id and p.entrep_id = ? and o.order_rec >= date_format(now(), '%Y-%m-01') and o.order_rec<= last_day(now()) and o.order_state = '수령'";
          conn.query(sql_stat_prod_price, [sess.info.entrep_id,sess.info.entrep_id], (err, stat_price) => {
            conn.release();

            if(err){
              throw err;
            }
            else{
              for(var i = 0; i < stat_price.length; i++){
                var price = stat_price[i].orders_prod_count * stat_price[i].orders_prod_price;
                prod_name.push(stat_price[i].prod_name);
                prod_price.push(price);
              }
              console.log(prod_name);
              console.log(prod_price);

              for(var j = stat_price.length; j > 0; j--){
                for(var k = 0; k < j; k++){
                  if(prod_name[k] < prod_name[k + 1]){
                    var temp_name = prod_name[k];
                    prod_name[k] = prod_name[k + 1];
                    prod_name[k+1] = temp_name;

                    var temp_price = prod_price[k];
                    prod_price[k] = prod_price[k+1];
                    prod_price[k + 1] = temp_price;
                  }
                }
              }
              // 정렬
              console.log(prod_name);
              console.log(prod_price);

              for(var l = 0; l < stat_price.length; l++){
                for(var m = 1; m < stat_price.length; m++){
                  if(prod_name[l] == prod_name[l+1]){
                    // console.log(prod_name[j]);
                    prod_price[l] = prod_price[l] + prod_price[l+1];
                    // console.log(stat_price[l]);
                    prod_price.splice(l+1, 1);
                    prod_name.splice(l+1,1);
                  }
                }
              }
              console.log(stat_price);
              //정렬 후 중복제거 및 판매량 합계
              res.render('index', {page : './sub/e_stat_prod_price', sess : sess, prod_name : prod_name, prod_price : prod_price});
            }
          });
        }
      });
    }
  });
});//매출액순 통계 불러오기

router.get('/e_stat_member_sum', function(req, res, next){
  var sess = req.session;
  var member_name = [];
  var member_sum = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      pool.getConnection(function(err, conn){
        if(err){
          throw err;
        }
        else{

          var sql_stat_prod = "select DISTINCT o.order_no, o.member_id, m.member_name, o.order_price from members m, orders o, orders_prod op where m.member_id = o.member_id and entrep_id = ? and o.order_date >= date_format(now(), '%Y-%m-01') and o.order_date<= last_day(now())";
          // var sql_stat_prod = "select p.prod_name, op.orders_prod_count, op.orders_prod_price from orders o, orders_prod op, prod p where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and o.order_date between ? and ?";
          conn.query(sql_stat_prod, [sess.info.entrep_id], (err, stat_member_prod) => {
            conn.release();
            if(err){
              throw err;
            }
            else{
              for(var i = 0; i < stat_member_prod.length; i++){
                member_name.push(stat_member_prod[i].member_name);
                member_sum.push(parseInt(1));
              }
              // console.log(prod_name);
              // console.log(prod_count);

              for(var j = stat_member_prod.length; j > 0; j--){
                for(var k = 0; k < j; k++){
                  if(member_name[k] < member_name[k + 1]){
                    var temp_name = member_name[k];
                    member_name[k] = member_name[k + 1];
                    member_name[k+1] = temp_name;

                    var temp_sum = member_sum[k];
                    member_sum[k] = member_sum[k+1];
                    member_sum[k + 1] = temp_sum;
                  }
                }
              }
              //정렬
              console.log(member_name);
              console.log(member_sum);

              for(var l = 0; l < stat_member_prod.length; l++){
                for(var m = 1; m < stat_member_prod.length; m++){
                  if(member_name[l] == member_name[l+1]){

                    member_sum.splice(l+1,1);
                    member_name.splice(l+1,1);
                    member_sum[l] = member_sum[l] + 1;

                  }
                }
              }
              console.log(member_sum);
              //정렬 후 중복제거 및 판매량 합계
              res.render('index', {page : './sub/e_stat_member_sum', sess : sess, member_name : member_name, member_sum : member_sum});
            }
          });
        }
      });
    }
  });
});//구매량순 통계 불러오기

router.get('/e_stat_member_price', function(req, res, next){
  var sess = req.session;
  var member_name = [];
  var member_price = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      pool.getConnection(function(err, conn){
        if(err){
          throw err;
        }
        else{
          var sql_stat_prod_price = "select DISTINCT o.order_price, m.member_name, o.order_no from orders o, members m, orders_prod op where o.member_id = m.member_id and o.order_date >= date_format(now(), '%Y-%m-01') and o.order_date<= last_day(now()) and op.entrep_id = ?";
          conn.query(sql_stat_prod_price, [sess.info.entrep_id], (err, stat_prod_price) => {
            conn.release();
            if(err){
              throw err;
            }
            else{
              for(var i = 0; i < stat_prod_price.length; i++){
                member_name.push(stat_prod_price[i].member_name);
                member_price.push(stat_prod_price[i].order_price);
              }
              console.log(member_name);
              console.log(member_price);

              for(var j = stat_prod_price.length; j > 0; j--){
                for(var k = 0; k < j; k++){
                  if(member_name[k] < member_name[k + 1]){
                    var temp_name = member_name[k];
                    member_name[k] = member_name[k + 1];
                    member_name[k+1] = temp_name;

                    var temp_price = member_price[k];
                    member_price[k] = member_price[k+1];
                    member_price[k + 1] = temp_price;
                  }
                }
              }
              // 정렬
              console.log(member_name);
              console.log(member_price);

              for(var l = 0; l < stat_prod_price.length; l++){
                for(var m = 1; m < stat_prod_price.length; m++){
                  if(member_name[l] == member_name[l+1]){
                    // console.log(prod_name[j]);
                    member_price[l] = member_price[l] + member_price[l+1];
                    // console.log(stat_price[l]);
                    member_price.splice(l+1, 1);
                    member_name.splice(l+1,1);
                  }
                }
              }
              console.log(member_price);
              //정렬 후 중복제거 및 판매량 합계
              res.render('index', {page : './sub/e_stat_member_price', sess : sess, member_name : member_name, member_price : member_price});
            }
          });
        }
      });
    }
  });
});//구입액순 통계 불러오기

router.post('/e_regProd', upload.array('photo'), function(req, res, next){
  var sess = req.session;
  var imgurl_thum = 'images/';
  var detail = ['images/','images/','images/'];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      console.log(req.files);
      for(var i = 0; i < 3; i++){
        if(req.files[i]){
          detail[i] = 'images/' + req.files[i+1].originalname;
        }
      }
      console.log(detail);
      if(req.files[0]){
        imgurl_thum = 'images/' + req.files[0].originalname;
      }
      sql_prod = "select prod_id from prod where entrep_id = ?";
      // console.log(req.body.class_id);
      conn.query(sql_prod, [sess.info.entrep_id], (err, prod) => {
        if(err){
          throw err;
        }
        else{
          if(prod[0]){
            var sql_regProd = "insert into prod(prod_id, prod_price, prod_name, prod_state, entrep_id, prod_img, prod_class_id)values ((select p.prod_id+1 from prod p where p.entrep_id = ? ORDER BY p.prod_id DESC LIMIT 1), ?, ?, ?, ?,? ,?)";
            conn.query(sql_regProd,[sess.info.entrep_id, req.body.price, req.body.name, req.body.state, sess.info.entrep_id, imgurl_thum, req.body.class_id], (err, regProd) => {
              if(err){
                throw err;
              }
              else{
                for(var j = 0; j < 3; j++){
                  console.log(detail[j]);
                  var sql_update_detail = "insert into detail_img (detail_img_id, detail_img_name, prod_id, entrep_id) values (?,?,(select p.prod_id from prod p where p.entrep_id = ? ORDER BY p.prod_id DESC LIMIT 1),?)";
                  // console.log(j, detail[j], sess.info.entrep_id, sess.info.entrep_id);
                  conn.query(sql_update_detail, [j+1, detail[j], sess.info.entrep_id, sess.info.entrep_id], (err, update_detail) => {
                    if(err){
                      throw err;
                    }
                  });
                }
                conn.release();
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                res.write("<script>alert('등록이 완료되었습니다.');location.href='/entrep/e_main';</script>");
              }
            });
          }
          else{
            var sql_regPord = "insert into prod(prod_id, prod_price, prod_name, prod_state, entrep_id, prod_img, prod_class_id)values (1, ?, ?, ?, ?,? ,?)";
            conn.query(sql_regPord,[req.body.price, req.body.name, req.body.state, sess.info.entrep_id, imgurl_thum, req.body.class_id], (err, regProd) => {
              if(err){
                throw err;
              }
              else{
                for(var j = 1; j < 4; j++){
                  var sql_update_detail = "insert into detail_img (detail_img_id, detail_img_name, prod_id, entrep_id) values (?,?,?,?)";
                  conn.query(sql_update_detail, [j, detail[j], 1, sess.info.entrep_id], (err, update_detail) => {
                    if(err){
                      throw err;
                    }
                  });
                }
                conn.release();
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                res.write("<script>alert('등록이 완료되었습니다.');location.href='/entrep/e_main';</script>");
              }
            });
          }
          // console.log(sql_regProd);
          //
          // if(req.files[1]){
          //   var imgurl_d1 = 'images/' + req.files[1].originalname;
          //   sql1 = "insert into detail_img (detail_img_id, detail_img_name, prod_id, entrep_id) values (1, ?, (select p.prod_id from prod p where p.entrep_id = ? ORDER BY p.prod_id DESC LIMIT 1), ?)";
          //   conn.query(sql1, [imgurl_d1, sess.info.entrep_id, sess.info.entrep_id], (err, detail1) => {
          //     conn.release();
          //     if(err){
          //       throw err;
          //     }
          //   });
          // }
          // if(req.files[2]){
          //   var imgurl_d2 = 'images/' + req.files[2].originalname;
          //   sql2 = "insert into detail_img (detail_img_id, detail_img_name, prod_id, entrep_id) values (2, ?, (select p.prod_id from prod p where p.entrep_id = ? ORDER BY p.prod_id DESC LIMIT 1), ?)";
          //   conn.query(sql2, [imgurl_d2, sess.info.entrep_id, sess.info.entrep_id], (err, detail2) => {
          //     conn.release();
          //     if(err){
          //       throw err;
          //     }
          //   });
          // }
          // if(req.files[3]){
          //   var imgurl_d3 = 'images/' + req.files[3].originalname;
          //   sql3 = "insert into detail_img (detail_img_id, detail_img_name, prod_id, entrep_id) values (3, ?, (select p.prod_id from prod p where p.entrep_id = ? ORDER BY p.prod_id DESC LIMIT 1),?)";
          //   conn.query(sql3, [imgurl_d3, sess.info.entrep_id, sess.info.entrep_id], (err, detail3) => {
          //     conn.release();
          //     if(err){
          //       throw err;
          //     }
          //   });
          // }
        }
      });
    }
  });
}); //상품 등록

router.post('/e_delProd/:prod_id', function(req, res,next){
  var sess = req.session;
  var prod_id = req.params.prod_id.split(':')
  // console.log(prod_id);
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_del1 = "delete from detail_img where prod_id = ? and entrep_id = ?";
      conn.query(sql_del1, [prod_id[1], sess.info.entrep_id], (err, prod) =>{
        if(err){
          throw err;
        }
        else{
          var sql_del2 = "delete from prod where prod_id = ? and entrep_id = ?";
          conn.query(sql_del2, [prod_id[1], sess.info.entrep_id], (err, prod) =>{
            conn.release();
            if(err){
              throw err;
            }
            else{
              res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
              res.write("<script>alert('삭제가 완료되었습니다.');location.href='/entrep/e_main';</script>");
            }
          });
        }
      });
    }
  });
})

router.post('/e_modProd/:prod_id', upload.array('photo'), function(req, res, next){
  var sess = req.session;
  var prod_id = req.params.prod_id.split(':')
  var imgurl_thum = 'images/';
  var detail = ['images/','images/','images/'];
  console.log(req.files);
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      for(var i = 0; i < 3; i++){
        if(req.files[i]){
          detail[i] = 'images/' + req.files[i+1].originalname;
        }
      }
      if(req.files[0]){
        imgurl_thum = 'images/' + req.files[0].originalname;
      }
      sql_img = "select di.detail_img_id, p.prod_img from detail_img di, prod p where p.entrep_id = ? and p.prod_id = ? and di.prod_id = p.prod_id";
      conn.query(sql_img, [sess.info.entrep_id, prod_id[1]], (err, prod) => {
        if(err){
          throw err;
        }
        else{
          var sql_updat_img = "update prod set prod_price = ?, prod_name =?, prod_state =?, entrep_id=?, prod_img=?, prod_class_id=? where prod_id = ? and entrep_id = ?";
            conn.query(sql_updat_img, [req.body.price, req.body.name, req.body.state, sess.info.entrep_id, imgurl_thum, req.body.class_id, prod_id[1], sess.info.entrep_id], (err, update_img) =>{
              if(err){
                throw err;
              }
              else{
                for(var j = 1; j < 4; j++){
                  console.log(detail[j-1]);
                    var sql_update_detail = "update detail_img set detail_img_name = ? where prod_id = ? and entrep_id = ? and detail_img_id = ?";
                  conn.query(sql_update_detail, [detail[j-1], prod_id[1], sess.info.entrep_id, j], (err, update_detail) => {
                    if(err){
                      throw err;
                    }
                  });
                }
                res.send(`<script> alert('수정완료');  history.back(); </script>`);
              }
            });
          }
      });
    }
  });

}); //상품 수정

router.post('/e_entrep', upload.single('photo'), function(req, res, next){
  var sess = req.session;
  var imgurl_logo = 'images/' + req.file.originalname;
  // console.log(req.body.state);
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_modEntrep = "update entrep e INNER JOIN entrep_class ec ON e.entrep_id = ec.entrep_id set e.entrep_pwd = ?, e.entrep_address = ?, e.entrep_email = ?, e.entrep_tel_no = ?, e.entrep_state = ?, e.entrep_logo = ?, ec.entrep_class_id = ? where e.entrep_id  = ec.entrep_id and e.entrep_id = ?";
      conn.query(sql_modEntrep,[req.body.pw, req.body.address, req.body.email, req.body.tel_no, req.body.state, imgurl_logo, req.body.class_id, sess.info.entrep_id], (err, modEntrep) => {
        if(err){
          throw err;
        }
        else{
          var sql_session = "select * from entrep where entrep_id = ?and entrep_pwd";
          conn.query(sql_session, [sess.info.entrep_id, sess.info.entrep_pwd], (err,session) =>{
            if(err){
              throw err;
            }
            else{
              sess.info = session[0];
              res.redirect('/entrep/e_main');

            }
          })

        }
      });
    }
  });
}); //상품 수정  -- 수정 필요

router.post('/e_stat_prod_sum', function(req, res, next){
  var sess = req.session;
  var prod_name = [];
  var prod_count = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{

      var sql_stat_prod = "select DISTINCT o.order_no, p.prod_name, op.orders_prod_count, op.orders_prod_price from orders o, orders_prod op, prod p where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and o.order_date >= date_format(?, '%Y-%m-%d') and o.order_date<= date_format(?, '%Y-%m-%d')";
      // var sql_stat_prod = "select p.prod_name, op.orders_prod_count, op.orders_prod_price from orders o, orders_prod op, prod p where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and o.order_date between ? and ?";
      conn.query(sql_stat_prod, [sess.info.entrep_id, req.body.sdate, req.body.edate], (err, stat_prod) => {
        conn.release();
        if(err){
          throw err;
        }
        else{
          for(var i = 0; i < stat_prod.length; i++){
            prod_name.push(stat_prod[i].prod_name);
            prod_count.push(stat_prod[i].orders_prod_count);
          }
          // console.log(prod_name);
          // console.log(prod_count);

          for(var j = stat_prod.length; j > 0; j--){
            for(var k = 0; k < j; k++){
              if(prod_name[k] < prod_name[k + 1]){
                var temp_name = prod_name[k];
                prod_name[k] = prod_name[k + 1];
                prod_name[k+1] = temp_name;

                var temp_count = prod_count[k];
                prod_count[k] = prod_count[k+1];
                prod_count[k + 1] = temp_count;
              }
            }
          }
          // //정렬
          // console.log(prod_name);
          // console.log(prod_count);

          for(var l = 0; l < stat_prod.length; l++){
            for(var m = 1; m < stat_prod.length; m++){
              if(prod_name[l] == prod_name[l+1]){
                // console.log(prod_name[j]);
                prod_count[l] = prod_count[l] + prod_count[l+1];
                prod_count.splice(l+1, 1);
                prod_name.splice(l+1,1);
              }
            }
          }
          //정렬 후 중복제거 및 판매량 합계
          res.render('index', {page : './sub/e_stat_prod_sum', sess : sess, prod_name : prod_name, prod_count : prod_count});
        }
      });
    }
  });
});//판매량순 통계 불러오기

router.post('/e_stat_prod_price', function(req, res, next){
  var sess = req.session;
  console.log(sess);
  var prod_name = [];
  var prod_price = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_stat_prod_price = "select DISTINCT o.order_no, op.orders_prod_count, op.orders_prod_price, p.prod_name From orders_prod op, orders o, prod p where o.order_no = op.order_no and op.entrep_id = ? and o.order_date >= date_format(?, '%Y-%m-%d') and o.order_date <= date_format(?, '%Y-%m-%d')";
      conn.query(sql_stat_prod_price, [req.body.sdate, req.body.edate, sess.info.entrep_id], (err, stat_price) => {
        conn.release();
        if(err){
          throw err;
        }
        else{
          for(var i = 0; i < stat_price.length; i++){
            var price = stat_price[i].orders_prod_count * stat_price[i].orders_prod_price;
            prod_name.push(stat_price[i].prod_name);
            prod_price.push(price);
          }
          // console.log(prod_name);
          // console.log(prod_price);

          for(var j = stat_price.length; j > 0; j--){
            for(var k = 0; k < j; k++){
              if(prod_name[k] < prod_name[k + 1]){
                var temp_name = prod_name[k];
                prod_name[k] = prod_name[k + 1];
                prod_name[k+1] = temp_name;

                var temp_price = prod_price[k];
                prod_price[k] = prod_price[k+1];
                prod_price[k + 1] = temp_price;
              }
            }
          }
          // 정렬
          // console.log(prod_name);
          // console.log(prod_price);

          for(var l = 0; l < stat_price.length; l++){
            for(var m = 1; m < stat_price.length; m++){
              if(prod_name[l] == prod_name[l+1]){
                // console.log(prod_name[j]);
                prod_price[l] = prod_price[l] + prod_price[l+1];
                // console.log(stat_price[l]);
                prod_price.splice(l+1, 1);
                prod_name.splice(l+1,1);
              }
            }
          }
          // console.log(stat_price);
          //정렬 후 중복제거 및 판매량 합계
          res.render('index', {page : './sub/e_stat_prod_price', sess : sess, prod_name : prod_name, prod_price : prod_price});
        }
      });
    }
  });
});//매출액순 통계 불러오기

router.post('/e_stat_member_sum', function(req, res, next){
  var sess = req.session;
  var member_name = [];
  var member_sum = [];
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{

      var sql_stat_prod = "select DISTINCT o.order_no, o.member_id, m.member_name, o.order_price from members m, orders o, orders_prod op where m.member_id = o.member_id and entrep_id = ? and o.order_date >= date_format(?, '%Y-%m-%d') and o.order_date<= date_format(?, '%Y-%m-%d')";
      // var sql_stat_prod = "select p.prod_name, op.orders_prod_count, op.orders_prod_price from orders o, orders_prod op, prod p where p.prod_id = op.prod_id and op.order_no = o.order_no and p.entrep_id = ? and o.order_date between ? and ?";
      conn.query(sql_stat_prod, [sess.info.entrep_id, req.body.sdate, req.body.edate], (err, stat_member_prod) => {
        conn.release();
        if(err){
          throw err;
        }
        else{
          for(var i = 0; i < stat_member_prod.length; i++){
            member_name.push(stat_member_prod[i].member_name);
            member_sum.push(parseInt(1));
          }
          // console.log(prod_name);
          // console.log(prod_count);

          for(var j = stat_member_prod.length; j > 0; j--){
            for(var k = 0; k < j; k++){
              if(member_name[k] < member_name[k + 1]){
                var temp_name = member_name[k];
                member_name[k] = member_name[k + 1];
                member_name[k+1] = temp_name;

                var temp_sum = member_sum[k];
                member_sum[k] = member_sum[k+1];
                member_sum[k + 1] = temp_sum;
              }
            }
          }
          //정렬
          // console.log(member_name);
          // console.log(member_sum);

          for(var l = 0; l < stat_member_prod.length; l++){
            for(var m = 1; m < stat_member_prod.length; m++){
              if(member_name[l] == member_name[l+1]){

                member_sum.splice(l+1,1);
                member_name.splice(l+1,1);
                member_sum[l] = member_sum[l] + 1;

              }
            }
          }
          // console.log(member_sum);
          //정렬 후 중복제거 및 판매량 합계
          res.render('index', {page : './sub/e_stat_member_sum', sess : sess, member_name : member_name, member_sum : member_sum});
        }
      });
    }
  });
});//구매량순 통계 불러오기

router.post('/e_stat_member_price', function(req, res, next){
  var sess = req.session;
  var member_name = [];
  var member_price = [];
  var member_sum = [];

  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_stat_prod_price = "select DISTINCT o.order_price, m.member_name, o.order_no from orders o, members m, orders_prod op where o.member_id = m.member_id and o.order_date >= date_format(?, '%Y-%m-%d') and o.order_date<= date_format(?, '%Y-%m-%d') and op.entrep_id = ?";
      conn.query(sql_stat_prod_price, [req.body.sdate, req.body.edate, sess.info.entrep_id], (err, stat_prod_price) => {
        conn.release();
        if(err){
          throw err;
        }
        else{
          for(var i = 0; i < stat_prod_price.length; i++){
            member_name.push(stat_prod_price[i].member_name);
            member_price.push(stat_prod_price[i].order_price);
          }
          // console.log(member_name);
          // console.log(member_price);

          for(var j = stat_prod_price.length; j > 0; j--){
            for(var k = 0; k < j; k++){
              if(member_name[k] < member_name[k + 1]){
                var temp_name = member_name[k];
                member_name[k] = member_name[k + 1];
                member_name[k+1] = temp_name;

                var temp_price = member_price[k];
                member_price[k] = member_price[k+1];
                member_price[k + 1] = temp_price;

              }
            }
          }
          // 정렬
          // console.log(member_name);
          // console.log(member_price);

          for(var l = 0; l < stat_prod_price.length; l++){
            for(var m = 1; m < stat_prod_price.length; m++){
              if(member_name[l] == member_name[l+1]){
                // console.log(prod_name[j]);
                member_price[l] = member_price[l] + member_price[l+1];
                // console.log(stat_price[l]);
                member_price.splice(l+1, 1);
                member_name.splice(l+1,1);


              }
            }
          }
          //정렬 후 중복제거 및 판매량 합계
          res.render('index', {page : './sub/e_stat_member_price', sess : sess, member_name : member_name, member_price : member_price});
        }
      });
    }
  });
});//구입액순 통계 불러오기

router.post('/e_submit/:order_id', function(req, res, next){
  var order_id = req.params.order_id.split(':');
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_submit = "update orders set order_rec = now(), order_state = '수락' where order_no = ?";
      conn.query(sql_submit, [order_id[1]], (err, submit) => {
        if(err){
          throw err;
        }
        else{
          res.send(`<script> alert('수락 완료');  history.back(); </script>`);
        }
      });
    }
  });
}); //주문 수락

router.post('/e_reject/:order_id', function(req, res, next){
  var order_id = req.params.order_id.split(':');
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_submit = "update orders set order_rec = now(), order_state = '거절' where order_no = ?";
      conn.query(sql_submit, [order_id[1]], (err, submit) => {
        if(err){
          throw err;
        }
        else{
          res.send(`<script> alert('거절 완료');  history.back(); </script>`);
        }
      });
    }
  });
}); //주문 수락

router.post('/e_recieve/:order_id', function(req, res, next){
  var order_id = req.params.order_id.split(':');
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if(err){
      throw err;
    }
    else{
      var sql_submit = "update orders set order_rec = now(), order_state = '수령' where order_no = ?";
      conn.query(sql_submit, [order_id[1]], (err, submit) => {
        if(err){
          throw err;
        }
        else{
          res.send(`<script> alert('수령 완료');  history.back(); </script>`);
        }
      });
    }
  });
}); //주문 수락

module.exports = router;
