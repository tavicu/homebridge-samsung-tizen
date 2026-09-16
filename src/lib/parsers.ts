import { XMLParser } from 'fast-xml-parser';
import { StoredApplication, UPnPData } from '../types/index.js';

type InstalledAppEntry = {
  appId: string;
  app_type: number;
  name: string;
};

type ParsedCommand = string | { key: string; time: number };

export const UPnPparser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseAttributeValue: true,
});

export function parseUPnPChange(lastChangeXml: string): UPnPData {
  try {
    const cleanXml = lastChangeXml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const parsed = UPnPparser.parse(cleanXml);
    const instance = parsed.Event?.InstanceID;

    if (!instance) {
      return {};
    }

    const result: UPnPData = {};

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
  const parts = Array.isArray(commands) ? commands : commands.split(',');
  const commandList = parts.map((cmd) => cmd.replace(/\s/g, '')).filter(Boolean);

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

export function parseInstalledApps(apps: InstalledAppEntry[] = []): StoredApplication[] {
  return apps.filter((app) => app.app_type === 2 && app.appId).map((app) => ({ id: app.appId, name: app.name }));
}
