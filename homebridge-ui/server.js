import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';

class PluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();
    this.ready();
  }
}

new PluginUiServer();
