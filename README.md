# command-line-app

A helpful wrapper around command-line-args and command-line-usage

## Installation

```sh
yarn add command-line-app
# or
npm i --save command-line-app
```

## Usage

### A simple single command app

```ts
import app, { Command } from 'command-line-app';

const update: Command = {
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

const args = app();

// $ echo foo
console.log(args);
// output: { value: "foo" }
```

### Complex examples

```ts
import app, { Command } from 'command-line-app';

const echo: Command = {
  examples: [{ example: 'echo foo', desc: 'The default use case' }],
  ...
};
```

### Multi Command

```ts
import app, { Command } from 'command-line-app';

const test: Command = { ... };
const lint: Command = { ... };
const update: Command = {
  examples: [{ example: 'echo foo', desc: 'The default use case' }],
  ...
};

const args = app([update, lint, test]);

// $ scripts test --fix
console.log(args);
// output: { _command: 'test', fix: true }
```
