const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AcvNEfgIaD_MZhbHFIzIrnKzhYaIOOU2YGysV5EpHVkzst4NM5ZRw9tTuV9a-unAlEPUnlu4-c1zj6fl',
  'client_secret': 'ELRpa2gB2WrClhHk6uv8d23i5K0WYmOUARAYk7wviFuAUFatewB5BI1iT68eTgp5-Kz6maw_za76qe3y'
});

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
  var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Vitamin pop",
                "sku": "001",
                "price": "29.99",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "29.99"
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

app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "29.99"
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

app.listen(3000 || process.env.PORT, () => console.log('Server Started'));
