import { app, Command, MultiCommand } from '../src';
import stripAnsi from 'strip-ansi';

beforeEach(() => {
  process.argv = [];
  jest.clearAllMocks();
});

describe('single command app', () => {
  const echo: Command = {
    name: 'echo',
    description: 'Print a string to the terminal',
    examples: ['echo foo', 'echo "Intense message"'],
    options: [
      {
        name: 'value',
        type: String,
        defaultOption: true,
        description: 'The value to print'
      }
    ]
  };

  test('usage', () => {
    expect(app(echo, { argv: ['foo'] })).toEqual(
      expect.objectContaining({ value: 'foo' })
    );
  });

  test('help', () => {
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(echo, { argv: ['--help'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
  });

  test('errors on unknown flag', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});

    app(echo, { argv: ['--error'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('errors on unknown flag + known flags', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});

    app(echo, { argv: ['--error', '--value=foo'] });

    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('suggests typo correction', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    app(echo, { argv: ['--vakue', 'foo'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('can configure error type to throw', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(() =>
      app(echo, { argv: ['--vakue', 'foo'], error: 'throw' })
    ).toThrow();
  });

  test('can configure error type to return object', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(
      stripAnsi(app(echo, { argv: ['--vakue', 'foo'], error: 'object' })!.error)
    ).toBe('Found unknown flag "--vakue", did you mean "--value"?');
  });

  test('errors without required flag', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});

    app({ ...echo, require: ['value'] }, { argv: [] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('errors without required flag - or', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});

    app({ ...echo, require: [['a', 'b'], 'c'] }, { argv: [] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

test('renders logos', () => {
  const echo: MultiCommand = {
    name: 'echo',
    description: 'Print a string to the terminal',
    logo: 'FOOBAR',
    commands: [
      {
        name: 'lint',
        description: 'find common errors'
      }
    ]
  };
  jest.spyOn(console, 'log').mockImplementationOnce(() => {});
  app(echo, { argv: ['--help'] });

  // @ts-ignore
  expect(console.log.mock.calls[0]).toMatchSnapshot();
});

test('can disable camelCase', () => {
  const echo: Command = {
    name: 'echo',
    description: 'Print a string to the terminal',
    options: [
      {
        name: 'lint_it',
        description: 'find common errors',
        type: Boolean
      }
    ]
  };
  jest.spyOn(console, 'log').mockImplementationOnce(() => {});
  const args = app(echo, { camelCase: false, argv: ['--lint_it'] });

  expect(args).toEqual(
    expect.objectContaining({
      lint_it: true
    })
  );
});

test('should display code', () => {
  const echo: Command = {
    name: 'echo',
    description: 'Print a string to the terminal',
    examples: ['echo foo', 'echo "Intense message"'],
    footer: [
      {
        code: true,
        content: `
        \`\`\`json
        {
          "create": {
            "package": {
              "templates": [
                {
                  "name": "custom-js",
                  "url": "https://github.intuit.com/me/my-template",
                  "description": "A custom package template",
                  "sha": "4b9c7b627307380fb31acae059f7c095d0c626b8"
                }
              ]
            }
          }
        }      
       \`\`\``
      }
    ]
  };

  const log = jest.fn();
  console.log = log;

  app(echo, { argv: ['--help'] });

  expect(log.mock.calls[0][0]).toMatchSnapshot();
});

describe('multi command app', () => {
  const testCommand: Command = {
    name: 'test',
    description: 'test the project',
    examples: ['test --interactive'],
    options: [
      {
        name: 'interactive',
        type: Boolean,
        description: 'Run the application in interactive mode'
      }
    ]
  };
  const lintCommand: Command = {
    name: 'lint',
    description: 'lint the project',
    examples: ['lint --fix'],
    options: [
      {
        name: 'fix',
        type: Boolean,
        description: 'Run the application in fix mode'
      }
    ]
  };
  const scripts: MultiCommand = {
    name: 'scripts',
    description: 'My scripts package',
    commands: [lintCommand, testCommand],
    options: [
      {
        name: 'verbose',
        alias: 'v',
        description: 'Log a bunch of stuff',
        type: Boolean
      }
    ]
  };

  test('help', () => {
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(scripts, { argv: ['--help'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
  });

  test('should exit when no sub command is provided', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(scripts);

    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('use lint', () => {
    expect(app(scripts, { argv: ['lint', '--fix'] })).toEqual(
      expect.objectContaining({ _command: 'lint', fix: true })
    );
  });

  test('use test', () => {
    expect(app(scripts, { argv: ['test'] })).toEqual(
      expect.objectContaining({ _command: 'test' })
    );
  });

  test('errors on unknown flag', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    app(scripts, { argv: ['--error'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('errors on unknown flag for sub command', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    app(scripts, { argv: ['lint', '--error'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('suggests misspelled command', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    app(scripts, { argv: ['flint'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
    // @ts-ignore
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should handle curlies in descriptions', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    app(
      {
        ...scripts,
        footer: {
          header: 'Additional Info',
          content:
            'Only run this if you really need to ({ foo }) => { console.log("") }'
        }
      },
      { argv: ['flint'] }
    );

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
    // @ts-ignore
    expect(console.log.mock.calls[1]).toMatchSnapshot();
  });

  test('can configure error type', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(
      stripAnsi(app(scripts, { argv: ['flint'], error: 'object' })!.error)
    ).toBe('Found unknown command "flint", did you mean "lint"?');
  });
});

describe('multi command app w/multi commands', () => {
  const testCommand: Command = {
    name: 'test',
    description: 'test the project',
    examples: ['test --interactive'],
    options: [
      {
        name: 'interactive',
        type: Boolean,
        description: 'Run the application in interactive mode'
      }
    ]
  };
  const createCommand: MultiCommand = {
    name: 'create',
    description: 'create a new project',
    // examples: ['create component', 'create project'],
    options: [
      {
        name: 'name',
        type: String,
        description: 'The name of the thing to create'
      }
    ],
    commands: [
      {
        name: 'component',
        description: 'create a component',
        examples: ['create component']
      },
      {
        name: 'project',
        description: 'create a project',
        examples: ['create project'],
        options: [
          {
            name: 'cwd',
            type: Boolean,
            description: 'Use the current working directory'
          }
        ]
      }
    ]
  };
  const scripts: MultiCommand = {
    name: 'scripts',
    description: 'My scripts package',
    commands: [createCommand, testCommand],
    options: [
      {
        name: 'verbose',
        alias: 'v',
        description: 'Log a bunch of stuff',
        type: Boolean
      }
    ]
  };

  test('sub-multi-command help', () => {
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(scripts, { argv: ['create', '--help'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
  });

  test('sub-multi-command sub-command help', () => {
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(scripts, { argv: ['create', 'project', '--help'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
  });

  test('sub-multi-command sub-command usage', () => {
    expect(
      app(scripts, { argv: ['create', 'project', '--cwd', '--name', 'foo'] })
    ).toEqual(
      expect.objectContaining({
        _command: ['create', 'project'],
        cwd: true,
        name: 'foo'
      })
    );
  });
});

describe('multi command app w/global singleton flags', () => {
  const testCommand: Command = {
    name: 'test',
    description: 'test the project',
    examples: ['test --interactive'],
    options: [
      {
        name: 'interactive',
        type: Boolean,
        description: 'Run the application in interactive mode'
      }
    ]
  };

  const scripts: MultiCommand = {
    name: 'scripts',
    description: 'My scripts package',
    commands: [testCommand],
    options: [
      {
        name: 'version',
        alias: 'v',
        description: 'Get the version',
        type: Boolean
      }
    ]
  };

  test('sub-multi-command help', () => {
    expect(app(scripts, { argv: ['--version'] })).toStrictEqual({
      version: true
    });
  });

  test('sub-multi-command help', () => {
    expect(app(scripts, { argv: ['test', '--version'] })!.version).toBe(true);
  });
});

describe('multi command app sub-command groups', () => {
  const testCommand: Command = {
    name: 'test',
    description: 'test the project',
    examples: ['test --interactive'],
    group: 'developer',
    options: [
      {
        name: 'interactive',
        type: Boolean,
        description: 'Run the application in interactive mode'
      }
    ]
  };

  const styleCommand: Command = {
    name: 'style-guide',
    description: 'create a styleguide for the project',
    group: 'design'
  };

  const scripts: MultiCommand = {
    name: 'scripts',
    description: 'My scripts package',
    commands: [testCommand, styleCommand]
  };

  test('sub-multi-command help', () => {
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    app(scripts, { argv: ['--help'] });

    // @ts-ignore
    expect(console.log.mock.calls[0]).toMatchSnapshot();
  });
});
