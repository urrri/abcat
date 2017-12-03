const promisify = require('promisify-node');
const fs = promisify('fs');
const path = require('path');

const handleError = (err) => {
  console.log(err);
  return Promise.reject(err);
};

const readdir = (dir, {level = 0, root = dir} = {}) => {
  const cat = [];
  const current = {
    path: path.relative(root, dir),
    sub: [],
    images: [],
    media: []
  };
  return fs.readdir(dir).then((items) => {
    return Promise.all(items.map((item) => {
      item = path.join(dir, item);
      return fs.stat(item).then((stats) => {
        console.log(item, stats);
        if (stats.isDirectory()) {
          current.sub.push(item);
          return readdir(item, {level: level + 1, root}).then((subcat) => {
            current.sub.push(subcat);
            cat.push(...subcat);
          });
        }

        const name = path.basename(item).toLowerCase();

        if (name === 'abcat.json') {
          current.data = item;
        } else if (name === 'info.txt') {
          current.info = item;
        } else {
          const ext = path.extname(item).toLowerCase();

          if ((ext === '.txt' || ext === '.info')) {
            if (!current.info) {
              current.info = item;
            }
          } else if (ext === '.jpg') { // todo: list of pics
            current.images.push(item);
          } else if (ext === '.mp3') { // todo: list of audio
            current.media.push(item);
          }
        }

        return undefined;
      });
    })).then(() => {
      if (level > 0 && (current.data || current.info)) {
        cat.push(current);
      }
      return cat;
    });
  });
};

const readdirs = (root) => {
  return fs.stat(root).then((stats) => {
    if (stats.isDirectory()) {
      return readdir(root, {level: 1, root}).then((res) => {
        return res;
      }, handleError);
    }
    return Promise.reject('not a dir');
  });
};

export default {
  readdirs
};

