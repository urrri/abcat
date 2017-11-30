const fs = require('fs');
const path = require('path');

const readdirs = (dir) => {
  fs.readdir(dir, (err, items) => {
    items.forEach((item) => {
      item = path.join(dir, item);
      fs.stat(item, (err, stats) => {
        console.log(item, stats);
        if (stats.isDirectory()) {
          readdirs(item);
        }
      });
    });
  });
};

const read = () => { console.log('kuku'); };

export default {
  readdirs
};
