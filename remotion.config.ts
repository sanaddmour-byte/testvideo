import { Config } from "@remotion/cli/config";

// Chromium is pre-installed in this environment; Remotion's own browser download is blocked by the network policy.
Config.setBrowserExecutable("/opt/pw-browsers/chromium");
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setConcurrency(4);
