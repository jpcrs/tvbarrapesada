import { StreamOptions, Utils } from "@dank074/discord-video-stream";
import config from "./config.js";
import { DiscordService } from "./services/discord.js";
import { RedisService } from "./services/redis.js";
import { RedisMessage } from "./types/types.js";
import { ShutdownHandler } from "./utils/shutdown.js";
import { YoutubeHelper } from "./utils/youtube.js";

const streamOpts: StreamOptions = {
    width: config.width,
    height: config.height,
    fps: config.fps,
    bitrateKbps: config.bitrateKbps,
    maxBitrateKbps: config.maxBitrateKbps,
    hardwareAcceleratedDecoding: config.hardwareAcceleratedDecoding,
    videoCodec: Utils.normalizeVideoCodec(config.videoCodec),
    
    /**
     * Enables the sending of RTCP sender reports. These reports assist the receiver in synchronizing audio and video frames.
     * In certain uncommon scenarios, disabling this feature might be beneficial.
     */
    rtcpSenderReportEnabled: false,
    /**
     * Specifies the encoding preset for H264 or H265 codecs. Faster presets result in lower quality.
     * Available presets include: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, and veryslow.
     */
    h26xPreset: 'ultrafast',
    /**
     * Configures ffmpeg parameters to minimize latency and expedite video output.
     * Note: This may occasionally cause video output lag.
     */
    minimizeLatency: false,
    /**
     * Forces the use of ChaCha20-Poly1305 encryption, which is generally faster than AES-256-GCM,
     * except when AES-NI is utilized.
     */
    forceChacha20Encryption: true
};

const discordService = new DiscordService();
const redisService = new RedisService();
const shutdownHandler = new ShutdownHandler(discordService, redisService);
shutdownHandler.setupShutdownHandlers();

async function handlePlay(title: string, url: string) {
    const streamUdpConn = await discordService.joinVoiceChannel(streamOpts);
    const videoUrl = await YoutubeHelper.getVideoInternalUrl(url) ?? url;
    await discordService.startStreaming(videoUrl, streamUdpConn);
    discordService.setWatchingStatus(title);
    console.log(videoUrl);
}

async function handleStop() {
    discordService.leaveVoiceChannel();
    discordService.setIdleStatus();
    console.log("Stopped playing");
}

async function handleMessage({ command, title, url }: RedisMessage) {
    console.log("Received command: " + command + " from channel: " + title);
    
    if (command === "play") {
        await handlePlay(title, url);
    }

    if (command === "stop") {
        await handleStop();
    }
}

redisService.subscribe("tvbarrapesada", handleMessage);