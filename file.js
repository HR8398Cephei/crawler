const fs = require('fs');

exports.checkfileExist = filePath => {
  return fs.existsSync(filePath);
};

exports.getInvalidIDs = filePath => {
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const fileObj = JSON.parse(fileData);

  if (Array.isArray(fileObj)) {
    if (fileObj.length < 90) {
      console.log(filePath);
    }
  } else {
    if (fileObj['valid'].length + fileObj['invalid'].length !== 100) {
      console.log(filePath);
    }

    return fileObj['invalid'];
  }

  return [];
};
