# then-utils
A collection of useful, promise-returing utilities.
No dependencies (other then Node builtins).

## Utilities

All utilities return `Promise`s.

### `callWithPromiseOrCallback`

#### Arguments

  * `func` - the function to call
  * `...args` - extra arguments to pass to the function

#### Description

Calls the given `func` with optional extra `...args`, and a Node-style callback (error, data). If the function returns a `Promise`, then it attaches it's `resolve` and `reject` to that `Promise`. If the callback is called, then it will `reject` if `error` is given, or `resolve` with the given `data`.

#### Usage

```js
const { callWithPromiseOrCallback } = require('then-utils');
const { addWithCallback, addWithPromise } = require('some-math-package');

callWithPromiseOrCallback(addWithCallback, 1, 2).then((result) => {
  console.log(result); // 3
}).catch((error) => {
  console.log('Oh no! Something blew up!');
  console.log(error.stack);
});

callWithPromiseOrCallback(addWithPromise, 3, 4).then((result) => {
  console.log(result); // 7
}).catch((error) => {
  console.log('What?! Math errors?');
  console.log(error.stack);
});
```

### `returnPromiseOrCallback`

#### Arguments

  * `callbackArg` - the callback argument
  * `handler` - the `Promise` handler

#### Description

This function is mainly for API developers who still need to support callbacks but want to migrate to `Promise`s. The `callbackArg` should be whatever your callback argument is in your function. If the `callbackArg` is a function, then it is called as a Node-style callback (error, data) when you `resolve` or `reject` in the `handler`. Otherwise, it returns a `Promise` with the given `handler`.

#### Usage

```js
const { returnPromiseOrCallback } = require('then-utils');

function myAPI(someArgs, myOptionalCallback) {
  return returnPromiseOrCallback(myOptionalCallback, (resolve, reject) => {
    console.log('process some arguments:', someArgs);
    // process someArgs
    resolve();
  });
}

myAPI('Wow', (error) => {
  if (error) return console.error('Oh no!', error.stack);
  console.log('done processing it already? wow.');
});

myAPI('Cool').then(() => {
  console.log('done processing it already? ok then!');
}).catch((error) => {
  console.error('Aw man!', error.stack);
});
```

### `asyncFor`


#### Arguments

  * `arrOrObjOrNum` - an array, object, or number to loop on
  * `onloop` - a function called for every iteration of the loop

#### Description

**TL;DR, just see the usage below**

Asynchronously loops using `setImmediate`. If `arrOrObjOrNum` is a number, it'll be converted into an array by pushing `null` into an array `arrOrObjOrNum` times, and looping on that. It uses `Object.keys()` to get the keys to loop through, except that if the key can be parsed to a `Number` (with `parseInt()`) then it'll convert it to a `Number`. It'll call `onloop` for every iteration of the loop with the current key (or index, for an array) and the item at that position (`null` if `arrOrObjOrNum` is a number). If `onloop` returns a `Promise`, it'll wait until the `Promise` is `resolve`d to goto the next loop. If the `Promise` is `reject`ed, it'll stop looping and reject it's own `Promise`. Otherwise, it'll add a Node-style callback (error, data) argument to `onloop`'s arguments, where if given an error, it'll act as if it were `reject`ed and end the loop.

#### Usage

```js
const { asyncFor } = require('then-utils');

const myArray = [9, 3, 4];
const myObject = {
  nom: 'hi',
  foo: 8
};

asyncFor(myArray, (index, item) => {
  return new Promise((resolve, reject) => {
    console.log('index:', index);
    console.log('item:', item);
    resolve();
  });
}).then(() => {
  console.log('Wow, done!');
}).catch((err) => {
  console.error(err.stack);
});

asyncFor(4, (index, item) => {
  return new Promise((resolve, reject) => {
    console.log('index:', index);
    console.log('item:', item); // will always be null, since you passed a number, which means you just want to loop 4 times
    resolve();
  });
}); // then, catch handlers here...

asyncFor(myObject, (key, item) => {
  return new Promise((resolve, reject) => {
    console.log('key:', key);
    console.log('item:', item);
    resolve();
  });
}); // then, catch handlers here...

asyncFor(myArray, (index, item, cb) => {
  // you can also just use a callback instead of returning a Promise
  console.log('index:', index);
  console.log('item:', item);
  cb();
}); // then, catch handlers here...

asyncFor(myArray, (index, item) => {
  return new Promise((resolve, reject) => {
    if (index === 1) {
      // `reject`ing acts like `break`, it ends the loop
      // the equivalent for a callback would be to pass an Error as the first argument to the callback
      return reject(new Error('Oh well'));
    }
    // you must call `resolve` (or the callback) when you are done
    // it can also act as `continue` if you `return resolve()` before you're finished
    resolve();
  });
});
```

### `rmrf`

#### Arguments

  * `pathname` - the path to remove recursively (can be a folder or a file)

#### Description

Remove a file or folder from the specified `pathname`. If the path is a folder, it is removed recursively. If the file or folder isn't found, then it will `resolve`, since the goal (having the path not exist) is already achieved.

#### Usage

```js
const { rmrf } = require('then-utils');

rmrf('some-path/i-wanna/delete').then(() => {
  console.log('great, done deleting the path');
}).catch((err) => {
  console.error('crap, something went wrong while deleting the path');
  console.error(err.stack);
});
```

### `mkdirp`

#### Arguments

  * `pathname` - the full path for the new folder

#### Description

Creates a folder at the specified path recursively, that is, it will create any folders that don't exist in the path.

#### Usage

```js
const { mkdirp } = require('then-utils');

mkdirp('/i-exist/me-too/but-i-dont/me-neither/i-am-the-target-folder').then(() => {
  console.log('the whole path now exists, yeah!');
}).catch((err) => {
  conosle.error('oh man...');
  console.error(err.stack);
});
```

### `filterByExtension`

#### Arguments

  * `pathname` - the path search in to filter it's files
  * `ext` - the extension to filter for

#### Description

Reads the files of the `pathname`, and filters them. If their extension matches the specified `ext`, then they will be returned.

#### Usage

```js
const { filterByExtension } = require('then-utils');

filterByExtension('/path/i-want/to/search', '.js').then((files) => {
  console.log('now i have a list of all the files ending with \'.js\':');
  console.dir(files);
}).catch((err) => {
  console.error('what happened?');
  console.error(err.stack);
});
```

### `writeFile`

#### Arguments

See [`fs.writeFile`](https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_writefile_file_data_options_callback).

#### Description

`Promise`-ified [`fs.writeFile`](https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_writefile_file_data_options_callback).

#### Usage

```js
const { writeFile } = require('then-utils');

writeFile('/my/file/path', 'some file contents').then(() => {
  console.log('done writing file');
}).catch((err) => {
  console.error('crap');
  console.error(err.stack);
});
```

### `exec`

#### Arguments

See [`child_process.exec`](https://nodejs.org/dist/latest/docs/api/child_process.html#child_process_child_process_exec_command_options_callback).

#### Description

`Promise`-ified [`child_process.exec`](https://nodejs.org/dist/latest/docs/api/child_process.html#child_process_child_process_exec_command_options_callback).

#### Usage

```js
const { exec } = require('then-utils');

exec('ls $HOME', {
  env: {
    HOME: '/home/my-place'
  }
}).then(({ stdout, stderr }) => {
  console.log('done executing command');
  console.log(stdout);
  console.log(stderr);
}).catch((err) => {
  console.error('why?!');
  console.error(err.stack);
});
```

### `mv`

#### Arguments

See [`fs.rename`](https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_rename_oldpath_newpath_callback).

#### Description

`Promise`-ified [`fs.rename`](https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_rename_oldpath_newpath_callback).

#### Usage

```js
const { mv } = require('then-utils');

mv('/my/old/path', '/my/new/place').then(() => {
  console.log('done moving path');
}).catch((err) => {
  console.error('go away errors, i don\'t like you');
  console.error(err.stack);
});
```

### `cpr`

#### Arguments

  * `frompath` - the path to copy from
  * `topath` - the path to copy to

#### Description

Copies a folder or file recursively from `frompath` to `topath`.

#### Usage

```js
const { cpr } = require('then-utils');

cpr('/some/folder', '/put/me/here').then(() => {
  console.log('done copying folder');
}).catch((err) => {
  console.error('ugh errors');
  console.error(err.stack);
});
```

### `parseArgs`

#### Arguments

  * `args` - the arguments to parse

#### Description

Parses the given arguments into an object. I'm not going to spend time explaining this, just take the example.

#### Usage

```js
const { parseArgs } = require('then-utils');

parseArgs(process.argv.slice(2)).then((args) => {
  // let's say process.argv.slice(2) === ['--hi', '--foo', '8', '-u']
  // then `args` would contain:
  args.hi === true;
  args.foo === '8';
  args.u === true;
}).catch((err) => {
  console.error('nope, i\'m not even gonna log this one');
});
```

### `spawn`

#### Arguments

See [`child_process.spawn`](https://nodejs.org/dist/latest/docs/api/child_process.html#child_process_child_process_spawn_command_args_options).

#### Description

`Promise`-ified [`child_process.spawn`](https://nodejs.org/dist/latest/docs/api/child_process.html#child_process_child_process_spawn_command_args_options).

#### Usage

```js
const { spawn } = require('then-utils');

const child = spawn('ls', ['$HOME'], {
  env: {
    HOME: '/home/my-place'
  }
});

child.cmd; // contains the spawned ChildProcess

child.then(() => {
  console.log('done executing this other command');
}).catch((err) => {
  console.error('well, i can\'t do anything about errors');
  console.error(err.stack);
});
```

### `sleep`

#### Arguments

  * `ms` - number of milliseconds to wait

#### Description

A "sleep" function (a.k.a. `setTimeout`), `resolve`s after the given time is up.

#### Usage

```js
const { sleep } = require('then-utils');

sleep(800).then(() => {
  console.log('800 milliseconds are up');
});
```
