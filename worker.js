const axios = require('axios-https-proxy-fix');
const cheerio = require('cheerio');
const fs = require('fs');
const { parentPort } = require('worker_threads');

let workerID;
let IDs = [];
let proxy = {
  host: 'tps139.kdlapi.com',
  port: 15818,
  auth: {
    username: 't10334422427877',
    password: 'tof5no8q',
  },
};

const invalidIDs = new Set();

const invalidMap = new Map();

// const saveHtmlFile = (ID, html) => {
//   try {
//     fs.writeFileSync(`html/res_${ID}.html`, html);
//     console.log(`SUCCESS html/res_${ID}.html`);
//   } catch (err) {
//     console.log(`FAIL html/res_${ID}.html`);
//     IDs.push(ID);
//   }
// };

// const parseHtml = (ID, html) => {
//   // console.log(html);
//   htmlElements = cheerio.load(html)(
//     '[data-automation-id=title], #productTitle'
//   );

//   if (!htmlElements || !htmlElements.length) {
//     console.log(`HTML incomplete with ID: ${ID}`);
//     IDs.push(ID);
//   } else {
//     console.log(`Success with ID: ${ID}, title: ${htmlElements.text().trim()}`);
//     results[ID] = htmlElements.text().trim();
//     saveHtmlFile(ID, html);
//   }
// };

const crawl = async ID => {
  // console.log('crawl');
  try {
    const res = await axios.get(`https://www.amazon.com/dp/${ID}`, {
      timeout: 15000,
      proxy,
    });
    fs.writeFileSync(`html/res_${ID}.html`, res.data);
    console.log(`SUCCESS html/res_${ID}.html, workerID: ${workerID}`);
  } catch (err) {
    console.log(`ERROR with ID: ${ID}, message: ${err.message}`);
    let invalidTime = invalidMap.get(ID);

    if (invalidTime >= 5) {
      console.log(`Invalid ID: ${ID}`);
      return invalidIDs.add(ID);
    }

    invalidMap.set(ID, (invalidTime || 0) + 1);
    IDs.push(ID);
  }
};

const run = async data => {
  workerID = data.workerID;
  IDs = data.data;
  for (let i = 0; i < IDs.length; ++i) {
    if (fs.existsSync(`html/res_${IDs[i]}.html`)) continue;
    await crawl(IDs[i]);
  }

  IDs = [];

  parentPort.postMessage(Array.from(invalidIDs));

  invalidIDs.clear();
  invalidMap.clear();
};

parentPort.on('message', run);
