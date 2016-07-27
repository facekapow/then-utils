'use strict';

const fs = require('fs');
const { extname } = require('path');
const { exec, spawn } = require('child_process');

module.exports = {
  asyncFor(arr, onloop) {
    return new Promise((resolve, reject) => {
      if (typeof arr === 'number' || arr instanceof Number) {
        let tmp = arr;
        arr = [];
        for (let i = 0; i < tmp; i++) arr.push(null);
      }
      let keys = Object.keys(arr);
      const doloop = (i) => {
        if (i === keys.length) return resolve();
        try {
          (new Promise((resolve2, reject2) => {
            onloop(keys[i], arr[keys[i]], resolve2, reject2);
          })).then(() => {
            setImmediate(() => doloop(i+1));
          }).catch((err) => {
            reject(err);
          });
        } catch(e) {
          reject(e);
        }
      };
      setImmediate(() => doloop(0));
    });
  },
  rmrf(pathname) {
    return new Promise((resolve, reject) => {
      let rmUnknown;

      const rmFile = (pathname) => {
        return new Promise((resolve, reject) => {
          fs.unlink(pathname, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      };

      const rmFolder = (pathname) => {
        return new Promise((resolve, reject) => {
          fs.readdir(pathname, (err, files) => {
            if (err) return reject(err);
            module.exports.asyncFor(files, (i, file, resolve, reject) => {
              rmUnknown(`${pathname}/${file}`).then(resolve).catch(reject);
            }).then(() => {
              fs.rmdir(pathname, (err) => {
                if (err) return reject(err);
                resolve();
              });
            }).catch(reject);
          });
        });
      };

      rmUnknown = (pathname) => {
        return new Promise((resolve, reject) => {
          fs.stat(pathname, (err, stats) => {
            if (err) {
              if (err.code === 'ENOENT') return resolve();
              return reject(err);
            }
            if (stats.isDirectory()) {
              rmFolder(pathname).then(resolve).catch(reject);
            } else {
              rmFile(pathname).then(resolve).catch(reject);
            }
          });
        });
      }

      rmUnknown(pathname).then(resolve).catch(reject);
    });
  },
  mkdirp(pathname) {
    return new Promise((resolve, reject) => {
      const parts = pathname.split('/');
      let str = '/';
      if (parts[0] === '') parts.shift();
      module.exports.asyncFor(parts, (i, part, resolve, reject) => {
        str += part;
        fs.stat(str, (err, stats) => {
          if (err) {
            if (err.code === 'ENOENT') {
              return fs.mkdir(str, (err) => {
                if (err) return reject(err);
                str += '/';
                resolve();
              });
            }
            return reject(err);
          }
          str += '/';
          resolve();
        });
      }).then(resolve).catch(reject);
    });
  },
  filterByExtension(pathname, ext) {
    return new Promise((resolve, reject) => {
      fs.readdir(pathname, (err, files) => {
        if (err) return reject(err);
        const res = [];
        module.exports.asyncFor(files, (i, file, resolve, reject) => {
          if (extname(file) === ext) res.push(`${pathname}/${file}`);
          resolve();
        }).then(() => resolve(res)).catch(reject);
      });
    });
  },
  writeFile(pathname, cont) {
    return new Promise((resolve, reject) => {
      fs.writeFile(pathname, cont, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  exec(...args) {
    return new Promise((resolve, reject) => {
      exec(...args, (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve({
          stdout,
          stderr
        });
      });
    });
  },
  mv(oldpath, newpath) {
    return new Promise((resolve, reject) => {
      fs.rename(oldpath, newpath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  cpr(frompath, topath) {
    return new Promise((resolve, reject) => {
      let cpUnknown;

      const cpFile = (frompath, topath) => {
        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(frompath);
          const writeStream = fs.createWriteStream(topath);

          readStream.on('error', (err) => {
            readStream.destroy();
            writeStream.destroy();
            reject(err);
          });

          writeStream.on('error', (err) => {
            writeStream.destroy();
            readStream.destroy();
            reject(err);
          });

          writeStream.on('finish', resolve);

          readStream.pipe(writeStream);
        });
      };

      const cpFolder = (frompath, topath) => {
        return new Promise((resolve, reject) => {
          fs.readdir(frompath, (err, files) => {
            if (err) return reject(err);
            module.exports.mkdirp(topath).then(() => {
              return module.exports.asyncFor(files, (i, file, resolve, reject) => {
                cpUnknown(`${frompath}/${file}`, `${topath}/${file}`).then(resolve).catch(reject);
              });
            }).then(resolve).catch(reject);
          });
        });
      };

      cpUnknown = (frompath, topath) => {
        return new Promise((resolve, reject) => {
          fs.stat(frompath, (err, stats) => {
            if (err) return reject(err);
            if (stats.isDirectory()) {
              cpFolder(frompath, topath).then(resolve).catch(reject);
            } else {
              cpFile(frompath, topath).then(resolve).catch(reject);
            }
          });
        });
      }

      cpUnknown(frompath, topath).then(resolve).catch(reject);
    });
  },
  or(...objs) {
    for (const obj of objs) {
      if (obj !== null && obj !== undefined && typeof obj !== 'undefined') return obj;
    }
  },
  parseArgs(args) {
    return new Promise((resolve, reject) => {
      const argRegex = /\-(\-)?([A-Za-z0-9\-]+)/;
      const parsed = {};
      let setValueFor = null;
      module.exports.asyncFor(args, (i, arg, resolve, reject) => {
        const match = argRegex.exec(arg);
        if (match === null) {
          if (setValueFor !== null) parsed[setValueFor] = arg;
          setValueFor = null;
          return resolve();
        }
        if (setValueFor !== null) parsed[setValueFor] = true;
        setValueFor = match[2].replace(/-([A-Za-z0-9])/g, (match, $1) => $1.toUpperCase());
        resolve();
      }).then(() => {
        if (setValueFor !== null) parsed[setValueFor] = true;
        resolve(parsed);
      }).catch(reject);
    });
  },
  spawn(...args) {
    const cmd = spawn(...args);
    const p = new Promise((resolve, reject) => {
      cmd.on('close', resolve);
      cmd.on('error', reject);
    });
    p.cmd = cmd;
    return p;
  }
}