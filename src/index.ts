import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import removeMarkdown from 'remove-markdown';

export type Option = commandLineUsage.OptionDefinition;

export type Example = {
  desc: string;
  example: string;
};

export type Section = commandLineUsage.Section & {
  code?: boolean;
};

export type Command = {
  name: string;
  description: string;
  options?: Option[];
  require?: string[];
  examples?: (string | Example)[];
  /** What group to render the command in a MultiCommand */
  group?: string;
  footer?: Section[] | Section | string;
};

export interface MultiCommand {
  name: string;
  logo?: string;
  description: string;
  options?: Option[];
  commands: (Command | MultiCommand)[];
  footer?: Section | string;
}

const help: Option = {
  name: 'help',
  alias: 'h',
  description: 'Display the help output',
  type: Boolean,
  group: 'global'
};

const globalOptions = [help];

const arrayify = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x]);
const hasGlobal = (options: Option[]) =>
  Boolean(options.find(option => option.group === 'global'));

function styleTypes(command: Command, option: Option) {
  const isRequired = command.require && command.require.includes(option.name);

  if (isRequired && option.type === Number) {
    option.typeLabel = `{rgb(173, 216, 230) {underline ${option.typeLabel ||
      'number'}}} [{rgb(254,91,92) required}]`;
  } else if (option.type === Number) {
    option.typeLabel = `{rgb(173, 216, 230) {underline ${option.typeLabel ||
      'number'}}}`;
  }

  if (isRequired && option.type === String) {
    option.typeLabel = `{rgb(173, 216, 230) {underline ${option.typeLabel ||
      'string'}}} [{rgb(254,91,92) required}]`;
  } else if (option.multiple && option.type === String) {
    option.typeLabel = `{rgb(173, 216, 230) {underline ${option.typeLabel ||
      'string[]'}}}`;
  } else if (option.type === String) {
    option.typeLabel = `{rgb(173, 216, 230) {underline ${option.typeLabel ||
      'string'}}}`;
  }
}

function addFooter(command: Command, sections: Section[]) {
  if (typeof command.footer === 'string') {
    sections.push({ content: command.footer });
  } else if (command.footer) {
    const footers = Array.isArray(command.footer)
      ? command.footer
      : [command.footer];

    footers.forEach(f => {
      // @ts-ignore
      if (typeof f.content === 'string') {
        console.log(
          'line',
          // @ts-ignore
          f.content
            .replace(/}/g, '\\}')
            .replace(/{/g, '\\{')
            .split('\n')
            // @ts-ignore
            .map(s => `  ${s}  `)
        );
      }

      sections.push({
        ...f,
        header: f.header
          ? removeMarkdown(f.header, { stripListLeaders: false })
          : undefined,
        content: !('content' in f)
          ? undefined
          : typeof f.content === 'string'
          ? removeMarkdown(
              f.code
                ? f.content
                    .replace(/}/g, '\\}')
                    .replace(/{/g, '\\{')
                    .split('\n')
                    .map(s => (s.includes('```') ? s : `  ${s}  `))
                    .join('\n')
                : f.content,
              {
                stripListLeaders: false
              }
            )
          : Array.isArray(f.content)
          ? f.content
          : undefined
      });
    });
  }
}

const printUsage = (command: Command) => {
  const options = command.options || [];
  const sections: Section[] = [
    {
      header: command.name,
      content: command.description
    }
  ];

  options.forEach(option => {
    styleTypes(command, option);
  });

  if (hasGlobal(options)) {
    sections.push(
      {
        header: 'Options',
        optionList: options
      },
      {
        header: 'Global Options',
        optionList: [...options, ...globalOptions],
        group: 'global'
      }
    );
  } else {
    sections.push({
      header: 'Options',
      optionList: [...options, ...globalOptions],
      group: ['_none', 'global']
    });
  }

  if (command.examples) {
    sections.push({
      header: 'Examples',
      content: command.examples
    });
  }

  addFooter(command, sections);

  console.log(commandLineUsage(sections));
  return;
};

const printRootUsage = (multi: MultiCommand) => {
  const subCommands =
    multi.commands.filter((c): c is Command => !('isMulti' in c)) || [];
  const rootOptions = multi.options || [];
  const options = [...rootOptions, ...globalOptions];
  const sections: Section[] = [];

  if (multi.logo) {
    sections.push({
      content: multi.logo,
      raw: true
    });
  }

  sections.push({
    header: multi.name,
    content: multi.description
  });

  sections.push({
    header: 'Synopsis',
    content: `$ ${multi.name} <command> <options>`
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
          description: command.description
        }))
      });
    }
  });

  if (groups.size === 0) {
    sections.push({
      header: 'Commands',
      content: subCommands.map(command => ({
        name: command.name,
        description: command.description
      }))
    });
  }

  options.forEach(option => {
    styleTypes(multi, option);
  });

  sections.push({
    header: 'Global Options',
    optionList: options,
    group: ['_none', 'global']
  });

  addFooter(multi, sections);

  console.log(commandLineUsage(sections));
};

interface Options {
  argv?: string[];
  showHelp?: boolean;
}

const parseCommand = (
  command: Command,
  { argv, showHelp }: Options
): Record<string, any> | undefined => {
  const args = [...(command.options || []), help];
  const { global, ...rest } = commandLineArgs(args, {
    stopAtFirstUnknown: true,
    camelCase: true,
    argv
  });

  if (rest._unknown) {
    printUsage(command);
    console.log(
      `Found unknown flag${
        rest._unknown.length > 1 ? 's' : ''
      }: ${rest._unknown.join(', ')}`
    );
    return;
  }

  if (global.help && showHelp) {
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
  command: Command | MultiCommand,
  { showHelp = true, argv }: Options = {}
):
  | ({ _command: string | string[] } & Record<string, any>)
  | Record<string, any>
  | undefined {
  const appOptions = { showHelp, argv };

  if (!('commands' in command)) {
    return parseCommand(command, appOptions);
  }

  const { global, _unknown } = commandLineArgs(globalOptions, {
    stopAtFirstUnknown: true,
    camelCase: true,
    argv
  });

  if (global.help && showHelp) {
    printRootUsage(command);
    return;
  }

  if (_unknown && _unknown.length > 0) {
    const rootOptions = command.options ? command.options || [] : [];
    const subCommand = command.commands.find((c): c is Command =>
      Boolean(c.name === _unknown[0])
    );

    if (subCommand) {
      const options = [...(subCommand.options || []), ...rootOptions];
      const parsed = app(
        { ...subCommand, options },
        { ...appOptions, argv: _unknown.slice(1) }
      );

      if (!parsed) {
        return;
      }

      return {
        ...parsed,
        _command:
          '_command' in parsed
            ? [subCommand.name, ...arrayify(parsed._command)]
            : subCommand.name
      };
    }

    printRootUsage(command);
    console.log(
      `Found unknown flag${_unknown.length > 1 ? 's' : ''}: ${_unknown.join(
        ', '
      )}`
    );

    return;
  } else {
    if (showHelp) {
      printRootUsage(command);
      console.log(`No sub-command provided to MultiCommand "${command.name}"`);
    }
    process.exit(1);
  }

  return global;
}
