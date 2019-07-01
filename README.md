# command-line-application

[![CircleCI](https://img.shields.io/circleci/project/github/hipstersmoothie/command-line-application/master.svg?style=for-the-badge)](https://circleci.com/gh/hipstersmoothie/command-line-application) [![npm](https://img.shields.io/npm/v/command-line-application.svg?style=for-the-badge)](https://www.npmjs.com/package/command-line-application) [![npm](https://img.shields.io/npm/dt/command-line-application.svg?style=for-the-badge)](https://www.npmjs.com/package/command-line-application)

A helpful wrapper around command-line-args and command-line-usage

## Installation

```sh
yarn add command-line-application
# or
npm i --save command-line-application
```

## Usage

### A simple single command app

```ts
import app, { Command } from 'command-line-application';

const echo: Command = {
  name: 'echo',
  description: 'Print a string to the terminal',
  examples: ['echo foo', 'echo "Intense message"'],
  options: [
    {
      name: 'value',
      type: String,
      defaultOption: true,
      description: 'The value to print',
    },
  ],
};

const args = app(echo);

// $ echo foo
console.log(args);
// output: { value: "foo" }
```

### Complex examples

```ts
import app, { Command } from 'command-line-application';

const echo: Command = {
  examples: [{ example: 'echo foo', desc: 'The default use case' }],
  ...
};
```

### Multi Command

You can even nest multi-commands!

```ts
import app, { Command } from 'command-line-application';

const test: Command = { ... };
const lint: Command = { ... };
const scripts: MultiCommand = {
  name: 'scripts',
  descriptions: 'my tools',
  commands: [test, lint]
};

const args = app(scripts);

// $ scripts test --fix
console.log(args);
// output: { _command: 'test', fix: true }
```
