import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

export type Option = commandLineUsage.OptionDefinition;

export type Example = {
  desc: string;
  example: string;
};

export type Command = {
  name: string;
  description: string;
  options?: Option[];
  require?: string[];
  examples?: (string | Example)[];
  /** What group to render the command in a MultiCommand */
  group?: string;
};

export interface MultiCommand {
  isMulti: true;
  name: string;
  logo?: string;
  description: string;
  options?: Option[];
}

const help: Option = {
  name: 'help',
  alias: 'h',
  description: 'Display the help output',
  type: Boolean,
  group: 'global',
};

const globalOptions = [help];

const arrayify = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x]);
const hasGlobal = (options: Option[]) =>
  Boolean(options.find(option => option.group === 'global'));
const getRootCommand = (commands: (Command | MultiCommand)[]) =>
  commands.find((c): c is MultiCommand => 'isMulti' in c && c.isMulti);

function styleTypes(command: Command, option: Option) {
  const isRequired = command.require && command.require.includes(option.name);

  if (isRequired && option.type === Number) {
    option.typeLabel =
      '{rgb(173, 216, 230) {underline number}} [{rgb(254,91,92) required}]';
  } else if (option.type === Number) {
    option.typeLabel = '{rgb(173, 216, 230) {underline number}}';
  }

  if (isRequired && option.type === String) {
    option.typeLabel =
      '{rgb(173, 216, 230) {underline string}} [{rgb(254,91,92) required}]';
  } else if (option.multiple && option.type === String) {
    option.typeLabel = '{rgb(173, 216, 230) {underline string[]}}';
  } else if (option.type === String) {
    option.typeLabel = '{rgb(173, 216, 230) {underline string}}';
  }
}

const printUsage = (command: Command) => {
  const options = command.options || [];
  const sections: commandLineUsage.Section[] = [
    {
      header: command.name,
      content: command.description,
    },
  ];

  options.forEach(option => {
    styleTypes(command, option);
  });

  if (hasGlobal(options)) {
    sections.push(
      {
        header: 'Options',
        optionList: options,
      },
      {
        header: 'Global Options',
        optionList: [...options, ...globalOptions],
        group: 'global',
      }
    );
  } else {
    sections.push({
      header: 'Options',
      optionList: [...options, ...globalOptions],
      group: ['_none', 'global'],
    });
  }

  if (command.examples) {
    sections.push({
      header: 'Examples',
      content: command.examples,
    });
  }

  console.log(commandLineUsage(sections));
  return;
};

const printRootUsage = (commands: (MultiCommand | Command)[]) => {
  const root = getRootCommand(commands);
  const subCommands =
    commands.filter((c): c is Command => !('isMulti' in c)) || [];

  if (!root) {
    return;
  }

  const rootOptions = root.options || [];
  const options = [...rootOptions, ...globalOptions];
  const sections: commandLineUsage.Section[] = [];

  if (root.logo) {
    sections.push({
      content: root.logo,
      raw: true,
    });
  }

  sections.push({
    header: root.name,
    content: root.description,
  });

  sections.push({
    header: 'Synopsis',
    content: `$ ${root.name} <command> <options>`,
  });

  const groups = subCommands.reduce((all, command) => {
    if (command.group) {
      all.add(command.group);
    }

    return all;
  }, new Set<string>());

  groups.forEach(header => {
    const grouped = subCommands.filter(c => c.group === header) || [];

    if (grouped.length > 0) {
      sections.push({
        header,
        content: grouped.map(command => ({
          name: command.name,
          description: command.description,
        })),
      });
    }
  });

  if (groups.size === 0) {
    sections.push({
      header: 'Commands',
      content: subCommands.map(command => ({
        name: command.name,
        description: command.description,
      })),
    });
  }

  sections.push({
    header: 'Global Options',
    optionList: options,
    group: ['_none', 'global'],
  });

  console.log(commandLineUsage(sections));
};

const parseCommand = (
  command: Command,
  argv: string[] = []
): Record<string, any> | undefined => {
  const args = [...(command.options || []), help];
  const { global, ...rest } = commandLineArgs(args, {
    stopAtFirstUnknown: true,
    camelCase: true,
    argv,
  });

  if (global.help) {
    printUsage(command);
    return;
  }

  if (command.require) {
    const missing: string[] = [];

    command.require.forEach(r => {
      if (rest._all[r] === undefined) {
        missing.push(r);
      }
    });

    if (missing.length > 0) {
      const multiple = missing.length > 1;
      printUsage(command);
      console.log(
        `Missing required arg${multiple ? 's' : ''}: ${missing.join(', ')}`
      );
      process.exit(1);
    }
  }

  return { ...rest, ...rest._all, ...global };
};

export function app(
  config: Command | (MultiCommand | Command)[]
):
  | ({ _command: string } & Record<string, any>)
  | Record<string, any>
  | undefined {
  const commands = arrayify(config);

  if (commands.length === 1) {
    return parseCommand(commands[0]);
  }

  const { global, _unknown } = commandLineArgs(globalOptions, {
    stopAtFirstUnknown: true,
    camelCase: true,
  });

  if (global.help) {
    printRootUsage(commands);
    return;
  }

  if (_unknown && _unknown.length > 0) {
    const root = getRootCommand(commands);
    const rootOptions = root && root.options ? root.options || [] : [];
    const command = commands.find(
      (c): c is Command => Boolean(c.name === _unknown[0])
    );

    if (command) {
      const options = [...(command.options || []), ...rootOptions];
      const parsed = parseCommand({ ...command, options }, _unknown.slice(1));

      if (!parsed) {
        return;
      }

      return {
        _command: command.name,
        ...parseCommand({ ...command, options }, _unknown.slice(1)),
      };
    }

    return {
      _command: _unknown[0],
    };
  }

  return global;
}

// // EXAMPLE

// const interactive: Option = {
//   name: 'interactive',
//   type: Boolean,
//   description: 'Run the application in interactive mode',
// };

// const debug: Option = {
//   name: 'debug',
//   type: Boolean,
//   description: 'Run the application in debug mode',
// };

// const test: Command = {
//   name: 'test',
//   description: 'My single command application.',
//   options: [interactive],
//   examples: ['test --interactive'],
//   group: 'Testing Commands',
// };

// const fix: Option = {
//   name: 'fix',
//   type: Boolean,
//   description: 'Run the application in fix mode',
// };

// const lint: Command = {
//   name: 'lint',
//   description: 'My second command application.',
//   options: [fix],
//   examples: ['lint --fix'],
//   group: 'Testing Commands',
// };

// const scripts: MultiCommand = {
//   name: 'scripts',
//   isMulti: true,
//   description: 'My helper scripts',
//   options: [debug],
// };

// commandLineApp([scripts, test, lint]);
