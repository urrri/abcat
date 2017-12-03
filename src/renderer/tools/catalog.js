const promisify = require('promisify-node');
const fs = promisify('fs');
const path = require('path');

const handleError = (err) => {
  console.log(err);
  return Promise.reject(err);
};

const isInList = (value, list = []) => !!list.find(item => item === value);

const mapFiles = files => files.reduce((map, fileNode) => {
  map[path.basename(fileNode.path).toLowerCase()] = fileNode;
  return map;
}, {});

/* eslint-disable no-use-before-define */

function scanPath(path) {
  return fs.stat(path).then((stats) => {
    console.log(path, stats);
    const result = {
      isFolder: stats.isDirectory(),
      path,
      stats // ??
    };

    return result.isFolder ? scanTree(path).then(subFolder => ({...subFolder, ...result})) : result;
  });
}

/* eslint-enable no-use-before-define */

const scanTree = (folderPath) => {
  return fs.readdir(folderPath).then((items) => {
    return Promise.all(items.map((item) => {
      return scanPath(path.join(folderPath, item));
    })).then((items) => {
      return items.reduce((current, item) => {
        (item.isFolder ? current.folders : current.files).push(item);
        // (item.isFolder ? current.foldersMap : current.filesMap)[item.path](item);
        return current;
      }, {
        folders: [],
        files: []
        // filesMap: {},
        // foldersMap: {}
      });
    });
  });
};

const findInlineMediaItem = (fileNode, fileMap) => {
  const inline = {
    isInline: true,
    path: fileNode.path,
    stats: fileNode.stats,
    // fullName: path.relative(root, fileNode.path),
    media: [fileNode]
  };
  const findDataFiles = (baseName) => {
    const dataFileName = `${baseName}.abcat.json`;
    if (fileMap[dataFileName]) {
      inline.dataFile = fileMap[dataFileName];
      return true;
    }

    const infoFileName = `${baseName}.txt`;
    if (fileMap[infoFileName]) {
      inline.infoFile = fileMap[infoFileName];
      return true;
    }

    return false;
  };

  const baseName = path.basename(fileNode.path).toLowerCase();
  if (!findDataFiles(baseName)) {
    const baseNameNoExt = path.basename(baseName, path.extname(baseName));
    if (!findDataFiles(baseNameNoExt)) {
      return undefined;
    }
  }
  return inline;
};

const parseFolder = (folderNode, {level = 0, root} = {}) => {
  const cat = [];

  const current = {
    isFolder: true,
    path: folderNode.path,
    stats: folderNode.stats,
    fullName: path.relative(root, folderNode.path),
    sub: [],
    images: [],
    media: [],
    unknown: []
  };

  // parse files
  const fileMap = mapFiles(folderNode.files);
  if (fileMap['abcat.json']) {
    current.dataFile = fileMap['abcat.json'];
  } else if (fileMap['info.txt']) {
    current.infoFile = fileMap['info.txt'];
  }
  folderNode.files.forEach((fileNode) => {
    const filePath = fileNode.path;
    const ext = path.extname(filePath).toLowerCase();

    if (isInList(ext, ['.jpg', '.jpeg', '.png'])) {
      current.images.push(fileNode);
    } else if (isInList(ext, ['.mp3', '.ogg'])) {
      const inline = findInlineMediaItem(fileNode, fileMap);
      if (inline) {
        inline.fullName = path.relative(root, fileNode.path);
        cat.push(inline);
      } else {
        current.media.push(fileNode);
      }
    } else if (isInList(ext, ['.txt', '.info'])) {
      if (!current.infoFile && !current.dataFile &&
        !isInList(path.basename(filePath).toLowerCase(), ['audio.txt'])) {
        current.infoFile = fileNode;
      }
    } else {
      current.unknown.push(fileNode);
    }
  });

  if (level > 0 && (current.dataFile || current.infoFile)) {
    cat.push(current);
  }

  // parse sub-folders
  folderNode.folders.forEach((folderNode) => {
    const sub = parseFolder(folderNode, {level: level + 1, root});
    cat.push(...sub);
    current.sub.push(sub);
  });

  return cat;
};

const loadCatalog = (root) => {
  root = path.normalize(root);
  return scanPath(root).then((tree) => {
    if (tree.isFolder) {
      return parseFolder(tree, {root, level: 0});
    }
    return Promise.reject('Catalog cannot be a file');
  });
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
  readdirs,
  scanPath,
  loadCatalog
};

