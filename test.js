const axios = require('axios-https-proxy-fix');

axios
  .get('https://httpbin.org/get', {
    // proxy: {
    //   host: 'http-proxy-t3.dobel.cn',
    //   port: '9180',
    //   auth: {
    //     username: 'ZAXXXXX0CHEQNN50',
    //     password: '2dTFSOAV',
    //   },
    // },
  })
  .then(res => {
    console.log(res.data);
  })
  .catch(err => {
    console.log(err);
  });
