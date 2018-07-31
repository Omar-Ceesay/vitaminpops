const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const qs = require('querystring');
var path = require('path');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AcvNEfgIaD_MZhbHFIzIrnKzhYaIOOU2YGysV5EpHVkzst4NM5ZRw9tTuV9a-unAlEPUnlu4-c1zj6fl',
  'client_secret': 'ELRpa2gB2WrClhHk6uv8d23i5K0WYmOUARAYk7wviFuAUFatewB5BI1iT68eTgp5-Kz6maw_za76qe3y'
});

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')))

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
  var body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });
  req.on('end', function() {
    var data = qs.parse(body);
    // now you can access `data.price` and `data.password`
    console.log(data);
    var quantity = 1;
    if(data.quantity){
      quantity = data.quantity;
    }
    var total = Number(data.price) * quantity;
    console.log(total+ "\n");

    var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "https://vitamin-pops.herokuapp.com/success/"+data.sku+"/"+total.toString(),
          "cancel_url": "https://vitamin-pops.herokuapp.com/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "Vitamin Pop",
                  "sku": data.sku,
                  "price": "29.99",
                  "currency": "USD",
                  "quantity": quantity
              }]
          },
          "amount": {
              "currency": "USD",
              "total": total
          },
          "description": "The best vitamin popsicle ever."
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for (var i = 0; i < payment.links.length; i++) {
            if(payment.links[i].rel === 'approval_url'){
              res.redirect(payment.links[i].href);
            }
          }
      }
    });
  });
});

app.get('/success/:itemId/:total', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  console.log(Number(req.params.total).toFixed(2));
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": Number(req.params.total).toFixed(2)
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(err, payment){
    if(err){
      console.log(err.response);
      throw err;
    }else{
      console.log(JSON.stringify(payment));
      res.render('ordersuccess');
    }
  });
});

app.get('/cancel', (req, res) => {
  res.send('Canceled');
});

app.listen(process.env.PORT || 3000, "0.0.0.0");
