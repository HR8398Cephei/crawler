const axios = require('axios-https-proxy-fix');
const cheerio = require('cheerio');
const fs = require('fs');
const { parentPort } = require('worker_threads');

let htmlElements;
let IDs = [];
let proxyPool = [];
let proxyIndex = 0;
let proxy = {
  host: 'tps134.kdlapi.com',
  port: 15818,
  auth: {
    username: 't10307854296622',
    password: '2fmyjwri',
  },
};
let results = [];

const invalidIDs = new Set();

const invalidMap = new Map();

// const setProxyPool = async () => {
//   try {
//     const res = await axios.get(
//       'http://http.tiqu.alicdns.com/getip3?num=400&type=1&pro=&city=0&yys=0&port=1&time=1&ts=0&ys=0&cs=0&lb=1&sb=0&pb=4&mr=1&regions=&gm=4',
//       {
//         timeout: 300000,
//       }
//     );
//     proxyPool = res.data.split('\r\n').map(item => {
//       const proxyObj = {};

//       [proxyObj.host, proxyObj.port] = item.trim().split(':');
//       // proxyObj.host = 'http://' + proxyObj.host;
//       proxyObj.port = +proxyObj.port;

//       return proxyObj;
//     });

//     console.log(proxyPool);
//   } catch (err) {
//     console.log(err.message);
//   }
// };

// const getNewProxy = async () => {
//   while (proxyIndex >= proxyPool.length) {
//     await setProxyPool();
//   }

//   proxyIndex = 0;

//   proxy = proxyPool[proxyIndex];
// };

const parseHtml = (ID, html) => {
  // console.log(html);
  htmlElements = cheerio.load(html)(
    '[data-automation-id=title], #productTitle'
  );

  if (!htmlElements || !htmlElements.length) {
    console.log(`HTML incomplete with ID: ${ID}`);
    IDs.push(ID);
  } else {
    console.log(`Success with ID: ${ID}, title: ${htmlElements.text().trim()}`);
    results.push(htmlElements.text().trim());
  }
};

const saveHtmlFile = (ID, html) => {
  fs.writeFile(`html/res_${ID}.html`, html, err => {
    if (err) {
      console.log(err.message);
    }
  });
};

const crawl = async ID => {
  // console.log('crawl');
  try {
    const res = await axios.get(`https://www.amazon.com/dp/${ID}`, {
      timeout: 15000,
      proxy,
    });
    // parseHtml(ID, res.data);
    saveHtmlFile(ID, res.data);
    results.push(ID);
  } catch (err) {
    console.log(`Error with ID: ${ID}, message: ${err.message}`);
    // const resetProxyAndContinue = async () => {
    //   IDs.push(ID);
    //   await getNewProxy();
    // };
    let invalidTime = invalidMap.get(ID);

    if (invalidTime >= 5) {
      console.log(`Invalid ID: ${ID}`);
      return invalidIDs.add(ID);
    }

    invalidMap.set(ID, (invalidTime || 0) + 1);
    // await resetProxyAndContinue();
    IDs.push(ID);
    return;
  }
};

const run = async data => {
  // if (!proxy.host) {
  //   await getNewProxy();
  // }

  IDs = data;
  for (let i = 0; i < IDs.length; ++i) {
    await crawl(IDs[i]);
  }

  IDs = [];

  parentPort.postMessage({
    results,
    invalidIDs: Array.from(invalidIDs),
  });

  results = [];
  invalidIDs.clear();
  invalidMap.clear();
};

parentPort.on('message', run);
