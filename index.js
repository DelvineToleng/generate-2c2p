app.post('/payment-2c2p', function (req, res) {
    // get params
    let description   = req.body.description;
    let amount        = req.body.amount;

    // amount formatted into 12 digit format with leading zero.
    let temp = 12 - amount.length;
    let str = "";
    for (let i = 0; i < temp; i++) {
        str = str + "0";
    }    
    let amount_fix = str.concat(amount);

    // if order_id null, get order id by time request for payment
    let order_id;
    if(req.body.order_id){
        order_id = req.body.order_id;
    }else{
        let d = new Date();
        order_id = d.getTime().toString().slice(0,10);
    }

    // construct signature string
    let params = process.env.APP_API_VERSION + process.env.APP_MERCHANT_ID + description + order_id + process.env.APP_CURRENCY_ID + amount + process.env.APP_URL_CALLBACK;
    let hmac = crypto.createHmac('sha256', process.env.APP_SECRET_KEY.toString());
    let data = hmac.update(params);
    let hash_value= data.digest('hex');
    
    if(hash_value){
        var promise = new Promise(function(resolve, reject){
            // BODY FOR FETCH
            let body = {
                "version" : process.env.APP_API_VERSION,
                "merchant_id" : "484",
                "currency" : process.env.APP_CURRENCY_ID,
                "result_url_1" : process.env.APP_URL_CALLBACK,
                "hash_value" : hash_value,
                "payment_description" : description,
                "amount" : amount_fix,
                "order_id" : order_id
            };
            
            body = JSON.stringify(body);
            console.log(body);
            // resolve(body);
    
            // CALL API PAYMENT
            fetch(process.env.APP_URL_PAYMENT, {
                "headers": {
                    "Content-Type": "application/json",
                },
                "body": body,
                "method": "POST",
            }).then(response => response.json()
            ).then(data => {
                // console.log("=====RESPONSE======")
                console.log(data)
                resolve(data);
            }).catch(error => {
                res.send({
                    status  : "error",
                    data : error
                });
                return
            });
        });
    
        promise.then(function(value){
            if(value){
                res.send({
                    status  : "success",
                    data    : value
                });
                return
            }else{
                res.send({
                    status  : "error",
                    data : value
                });
                return
            }
        });
    }else{
        res.send({
            status  : "error",
            hash    : hash_value
         });
         return
    }
});
