import {Config} from '@remotion/cli/config';
Config.setConcurrency(1);
Config.setChromiumOpenGlRenderer('angle');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(18);
// Reuse an existing compatible browser when supplied; no machine-specific path.
if(process.env.MUSIC_WORLD_BROWSER) Config.setBrowserExecutable(process.env.MUSIC_WORLD_BROWSER);
