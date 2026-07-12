import { XMLParser } from 'fast-xml-parser';

type ParsedCommand = string | { key: string; time: number };
type ParsedUPnPData = { volume?: number; mute?: boolean };

export const UPnPparser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseAttributeValue: true,
});

export function parseUPnPChange(lastChangeXml: string): ParsedUPnPData {
  try {
    const cleanXml = lastChangeXml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const parsed = UPnPparser.parse(cleanXml);
    const instance = parsed.Event?.InstanceID;

    if (!instance) {
      return {};
    }

    const result: ParsedUPnPData = {};

    if (instance.Volume) {
      result.volume = parseInt(instance.Volume['@_val'], 10);
    }

    if (instance.Mute) {
      const muteVal = instance.Mute['@_val'];
      result.mute = muteVal === 1 || muteVal === '1' || muteVal === true || muteVal === 'true';
    }

    return result;
  } catch (err) {
    return {};
  }
}

export function parseCommands(commands: string | string[]): ParsedCommand[] {
  const commandList = Array.isArray(commands)
    ? commands.map((cmd) => cmd.replace(/\s/g, '')).filter(Boolean)
    : commands.replace(/\s/g, '').split(',').filter(Boolean);

  return commandList.flatMap((cmd): ParsedCommand[] => {
    const split = cmd.split('*');

    if (!split[1]) {
      return [cmd];
    }

    // Hold syntax: KEY*2.5s
    if (/^.*\*[0-9]*[.]?[0-9]+s$/.test(cmd)) {
      return [{ key: split[0], time: parseFloat(split[1]) }];
    }

    // Repeat syntax: KEY*3
    const count = parseInt(split[1], 10);
    if (count > 0) {
      return Array(count).fill(split[0]) as string[];
    }

    return [cmd];
  });
}
