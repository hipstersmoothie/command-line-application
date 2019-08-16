import { app, Command, MultiCommand } from '../src';

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
    ).toThrow('Found unknown flag "--vakue", did you mean "value"?');
  });

  test('can configure error type to return object', () => {
    // @ts-ignore
    jest.spyOn(process, 'exit').mockImplementationOnce(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(app(echo, { argv: ['--vakue', 'foo'], error: 'object' })).toEqual({
      error: 'Found unknown flag "--vakue", did you mean "value"?'
    });
  });
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

  test('can configure error type', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(app(scripts, { argv: ['flint'], error: 'object' })).toEqual({
      error: 'Found unknown command "flint", did you mean "lint"?'
    });
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
    expect(app(scripts, { argv: ['test', '--version'] }).version).toBe(true);
  });
});
