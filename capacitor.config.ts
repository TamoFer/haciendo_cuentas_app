import type { CapacitorConfig } from '@capacitor/cli';
import { StatusBar, Style } from '@capacitor/status-bar';


const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'haciendo_cuentas_app',
  webDir: 'www'
};

StatusBar.setOverlaysWebView({ overlay: false });
StatusBar.setStyle({ style: Style.Dark });

export default config;
