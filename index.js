const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const path = require('path');

const WorkPool = require('./workerPool');

// const TOTAL_FILE_COUNT = 0;
const WORKER_COUNT = 40;
const GAP = 100;

let IDs = [];
let maxIndex = -1;
const workerPool = new WorkPool(
  path.join(__dirname, 'worker.js'),
  WORKER_COUNT
);

const parseIDs = () => {
  const fileData = fs.readFileSync(path.join(__dirname, 'id_list.csv'));
  IDs = parse(fileData, { columns: ['line', 'ID'], trim: true })
    .map(item => item.ID)
    .filter(ID => !fs.existsSync(`html/res_${ID}.html`));

  // const savedInvalidIDs = [];
  // const count = new Map();

  // for (let i = 0; i <= TOTAL_FILE_COUNT; ++i) {
  //   if (!checkfileExist(`results/res_${i}.json`)) {
  //     indexs.add(i);
  //   } else {
  //     const invalid = getInvalidIDs(`results/res_${i}.json`);
  //     count.set(i, invalid.length);
  //     savedInvalidIDs.push(...invalid);
  //   }
  // }

  // IDs.push(...savedInvalidIDs);

  maxIndex = Math.ceil(IDs.length / GAP);

  console.log(maxIndex);
  // console.log(count);
  // console.log(count.size);
  // console.log(savedInvalidIDs);
  // console.log(Array.from(indexs).length);
};

const saveResultsToFile = (fileName, content) => {
  fs.writeFile(fileName, content, err => {
    if (err) {
      console.log(`save ${fileName} failed`);
    } else {
      console.log(`${fileName} successfully saved`);
    }
  });
};

const run = () => {
  for (let i = 0; i < maxIndex; i++) {
    // if (i <= TOTAL_FILE_COUNT && !indexs.has(i)) continue;
    workerPool.run(
      IDs.slice(i * GAP, Math.min(i * GAP + GAP, IDs.length)),
      (result, err) => {
        if (err) {
          console.log(err);
          saveResultsToFile(`errors/err_${i}.txt`, err.stack);
        } else {
          console.log(result);
          saveResultsToFile(
            `results/res_${i}.json, workerID: ${result.workerID}`,
            JSON.stringify(result.result)
          );
        }
      }
    );
  }
};

parseIDs();
run();
