import { getDefaultInfo } from './info';

const jfs = require('fs-jetpack');
const AutoDecoder = require('autodetect-decoder-stream');
const promisify = require('promisify-node');
const fs = promisify('fs'); // todo:replace fs by jfs
// const jschardet = require('jschardet');
const path = require('path');

const handleError = (err) => {
  console.log(err);
  return Promise.reject(err);
};

const findOneOf = (values = [], map = {}) => map[values.find(value => !!map[value])];

const isInList = (value, list = []) => !!list.find(item => item === value);

const mapFiles = files => files.reduce((map, fileNode) => {
  map[path.basename(fileNode.path).toLowerCase()] = fileNode;
  return map;
}, {});

/* eslint-disable no-use-before-define */

export function scanPath(path) {
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
    const infoFileNameNoExt = `${path.basename(baseName, path.extname(baseName))}.txt`;
    if (fileMap[infoFileNameNoExt]) {
      inline.infoFile = fileMap[infoFileNameNoExt];
      return true;
    }

    return false;
  };

  const baseName = path.basename(fileNode.path).toLowerCase();
  return findDataFiles(baseName) ? inline : undefined;
};

const infoFiles = ['info.txt', '-info.txt'];
const ignoreFiles = ['audio.txt', '-audio.txt', 'readme.txt'];
const imageExt = ['.jpg', '.jpeg', '.png', '.gif'];
const mediaExt = ['.mp3', '.ogg', '.m4b', '.wma'];
const infoExt = ['.txt', '.info'];

const parseFolder = (folderNode, {level = 0, root, parent} = {}) => {
  const cat = [];

  const current = {
    parent,
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
  } else {
    const infoFile = findOneOf(infoFiles, fileMap);
    if (infoFile) {
      current.infoFile = infoFile;
    }
  }

  const inlineInfos = {};
  const potentialInfos = [];

  folderNode.files.forEach((fileNode) => {
    const filePath = fileNode.path;
    const ext = path.extname(filePath).toLowerCase();

    if (isInList(ext, imageExt)) {
      current.images.push(fileNode);
    } else if (isInList(ext, mediaExt)) {
      const inline = findInlineMediaItem(fileNode, fileMap);
      if (inline) {
        inline.fullName = path.relative(root, fileNode.path);
        cat.push(inline);
        inline.parent = current;
        current.sub.push(inline);
        if (inline.infoFile) {
          inlineInfos[inline.infoFile.path] = inline.infoFile;
        }
      } else {
        current.media.push(fileNode);
      }
    } else if (isInList(ext, infoExt)) {
      // collect all potential infos if no info/data found
      if (!current.infoFile && !current.dataFile) {
        potentialInfos.push(fileNode);
      }
    } else {
      current.unknown.push(fileNode);
    }
  });

  // filter potential infos if no info/data found
  if (!current.infoFile && !current.dataFile) {
    current.potentialInfoFiles = potentialInfos.filter((fileNode) => {
      const filePath = fileNode.path;
      return (!inlineInfos[filePath] &&
          !isInList(path.basename(filePath).toLowerCase(), ignoreFiles));
    });
  }

  if (level > 0 &&
      (current.dataFile || current.infoFile || (current.potentialInfoFiles && current.potentialInfoFiles.length))) {
    cat.push(current);
  }

  // parse sub-folders
  folderNode.folders.forEach((folderNode) => {
    const sub = parseFolder(folderNode, {level: level + 1, root, parent: current});
    cat.push(...sub);
    current.sub.push(...sub);
  });

  return cat;
};

export const loadCatalog = (root) => {
  root = path.normalize(root);
  return scanPath(root).then((tree) => {
    if (tree.isFolder) {
      return parseFolder(tree, {root, level: 0});
    }
    return Promise.reject('Catalog cannot be a file');
  });
};

const detectCharsetLoadFile = (path) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path).pipe(new AutoDecoder());
    const ss = [];
    stream.on('data', data => ss.push(data)).on('end', () => {
      // stream.destroy();
      resolve(ss.join(''));
    });
  });
  // return fs.readFile(path).then((data) => {
  //   const charset = jschardet.detect(data);
  //   return charset.encoding;
  // }).then(charset => fs.readFile(path, charset));
};

export const loadInfo = (node) => {
  if (node.dataFile) {
    console.log('Loading data', node.dataFile.path);
    return fs.readFile(node.dataFile.path, 'utf8').then((data) => {
      node.data = JSON.parse(data);
    });
  } else if (node.infoFile) {
    // return fs.readFile(node.infoFile.path, 'utf8').then((data) => {
    //   if (data.indexOf('а') < 0) {
    //     return fs.readFile(node.infoFile.path, '');
    //   }
    //   return data;
    // });
    console.log('Loading info', node.infoFile.path);
    return detectCharsetLoadFile(node.infoFile.path).then((info) => {
      node.data = getDefaultInfo();
      node.data.info = info;
    });
  }
  console.log('No info');
  return Promise.resolve();
};

export const loadAllInfo = (catalog) => {
  return Promise.all(catalog.map(node => loadInfo(node))).then(() => catalog);
};

/*
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
  // readdirs,
  scanPath,
  loadCatalog
};
*/

