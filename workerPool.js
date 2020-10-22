const { Worker } = require('worker_threads');

class WorkerPool {
  workers = [];
  workerActivated = [];
  taskQueue = [];
  workerPath = '';
  numberOfWorkers = -1;

  constructor(workerPath, numberOfWorkers = 5) {
    this.workerPath = workerPath;
    this.numberOfWorkers = numberOfWorkers;

    this.init();
  }

  init() {
    if (this.numberOfWorkers < 1) {
      throw new Error('There has to be 1 worker at least');
    }

    for (let i = 0; i < this.numberOfWorkers; ++i) {
      const worker = new Worker(this.workerPath);

      this.workerActivated[i] = false;
      this.workers[i] = worker;
    }
  }

  destroy() {
    for (let i = 0; i < this.numberOfWorkers; ++i) {
      if (this.workerActivated[i]) {
        throw new Error(`Worker ${i} i still working...`);
      }

      this.workers[i].terminate();
    }
  }

  getIdleWorkerID() {
    for (let i = 0; i < this.numberOfWorkers; ++i) {
      if (!this.workerActivated[i]) {
        return i;
      }
    }

    return -1;
  }

  run(taskData, onFinish) {
    const idleWorkerID = this.getIdleWorkerID();

    const taskItem = {
      taskData,
      callback: (result, err) => {
        onFinish(result, err);
      },
    };

    if (idleWorkerID === -1) {
      return this.taskQueue.push(taskItem);
    }

    this.workerActivated[idleWorkerID] = true;

    setTimeout(() => {
      this.runWorker(idleWorkerID, taskItem);
    }, idleWorkerID * 200);
  }

  cleanup = workerID => {
    const worker = this.workers[workerID];
    worker.removeAllListeners('message');
    worker.removeAllListeners('error');

    this.workerActivated[workerID] = false;

    if (!this.taskQueue.length) {
      return;
    }

    setTimeout(() => {
      this.runWorker(workerID, this.taskQueue.shift());
    }, 1);
  };

  runWorker(workerID, taskItem) {
    const worker = this.workers[workerID];
    this.workerActivated[workerID] = true;

    worker.once(
      'message',
      ((workerID, taskItem, result) => {
        try {
          taskItem.callback(result);
        } catch (err) {
          console.log(`WorkerID: ${workerID}, Error: ${err.message}`);
        } finally {
          this.cleanup(workerID);
        }
      }).bind(this, workerID, taskItem)
    );
    worker.once(
      'error',
      ((workerID, taskItem, err) => {
        try {
          taskItem.callback('', err);
        } catch (err) {
          console.log(`WorkerID: ${workerID}, Error: ${err.message}`);
        } finally {
          this.cleanup(workerID);
        }
      }).bind(this, workerID, taskItem)
    );

    worker.postMessage({
      workerID,
      data: taskItem.taskData,
    });
  }
}

module.exports = WorkerPool;
