var castStateRefreshTimer = null, systemCastRequestDeadline = 0;
function renderCastState() {
  if (!state) return;

  var settings = state.settings || {},
    cast = state.cast || {};
  clearTimeout(castStateRefreshTimer);
  if (cast.screenMirrorActive) systemCastRequestDeadline = 0;
  // Device selection and screen-sharing consent finish asynchronously on the phone.
  // Poll only while waiting or casting, and stop when this page is hidden.
  if (cast.running || Date.now() < systemCastRequestDeadline) {
    castStateRefreshTimer = setTimeout(function () {
      castStateRefreshTimer = null;
      if (!document.hidden) refresh();
    }, cast.running ? 5000 : 1500);
  }
  var systemButton = document.getElementById("systemCastButton");
  systemButton.textContent = cast.screenMirrorActive ? "结束系统投屏" : "系统投屏";
  var directSwitch = document.getElementById("wifiDirectExperimental");
  directSwitch.checked = settings.wifiDirectExperimental === true;
  directSwitch.disabled = !!cast.running || !!state.takeoverReceiverUrl || !!(state.takeoverProgress || {}).active;
  document.getElementById("wifiDirectHint").textContent = directSwitch.disabled
    ? "结束投屏后可更改。默认使用路由器 IP；直连为实验性功能。"
    : "默认关闭，使用路由器 IP。开启后尝试直连，部分设备可能频繁断开。";
  document.getElementById("castStatus").textContent = cast.running
    ? (cast.status || "正在投送") : "电视在线";
  document.getElementById("castResolution").value = settings.webCastResolution || "1280x720";
  document.getElementById("castFps").value = String(settings.webCastFps || 25);
  document.getElementById("castCodec").value = settings.webCastCodec || "h264";
  document.getElementById("castTransport").value = settings.webCastTransport || "tcp";
  document.getElementById("castBitrate").value = String(settings.webCastBitrateMbps || 3);
  document.getElementById("castSuperResolution").checked = settings.webCastSuperResolution !== false;
  var compare = document.getElementById("compareSuperResolution");
  compare.disabled = superResolutionRequestPending || !cast.running
    || settings.webCastSuperResolution === false || cast.superResolutionCanCompare !== true;
  compare.textContent = cast.superResolutionComparing ? "原画对比中…" : "对比原画";
  clearTimeout(superResolutionCompareTimer);
  superResolutionCompareTimer = null;
  if (cast.superResolutionComparing) {
    // This settings page normally refreshes only on user actions. Read the
    // server once at expiry so the label follows the app's restoration timer.
    var remaining = Math.min(2000, Math.max(0, Number(cast.superResolutionCompareRemainingMs) || 0));
    superResolutionCompareTimer = setTimeout(function () {
      superResolutionCompareTimer = null;
      refresh();
    }, remaining + 80);
  }
  document.getElementById("castAudio").checked = settings.webCastAudio === true;
  document.getElementById("castDebug").checked = settings.webCastDebug === true;
  document.getElementById("castAudio").disabled = cast.audioSupported !== true;
  document.getElementById("castAudioHint").textContent = cast.audioSupported
    ? "电台和播放器声音直接编码，无需录音授权；网页声音需要捕获授权，拒绝后仍投送画面"
    : "当前系统仅支持画面";
  var capabilityText = cast.compatibilityNote
    ? cast.compatibilityNote
    : cast.h265Supported === false
      ? "当前设备没有 H.265 编码器；选择 H.265 时会自动回退 H.264。60/120 fps 也会按硬件能力降级。"
      : "60/120 fps 与 H.265 需要接收端支持；编码器不满足所选参数时会自动降级。";
  if (cast.running && cast.rtspVideoBitrate > 0) {
    capabilityText += " RTSP 实时：视频 " + formatCastBitrate(cast.rtspVideoBitrate);
    if (cast.rtspAudioBitrate > 0)
      capabilityText += "，声音 " + formatCastBitrate(cast.rtspAudioBitrate);
    capabilityText += "。";
  }
  if (cast.running) {
    if (cast.audioBitrate > 0) capabilityText += " 音频实际码率：" + formatCastBitrate(cast.audioBitrate) + "。";
    if (cast.rtspTransport) capabilityText += " 传输：" + cast.rtspTransport.toUpperCase() + "。";
    capabilityText += " 实际投屏：" + cast.width + "×" + cast.height + " / " + cast.fps + "fps / "
      Number(cast.encoderTargetBitrateMbps || cast.bitrateMbps).toFixed(1) + "Mbps。";
    if (cast.encodeSamples > 0) {
      capabilityText += " 编码链路均值 " + cast.encodeDelayMs + "ms，P95 " + cast.encodeP95Ms
        + "ms；提交 " + cast.surfaceSubmitMs + "ms，提交后 " + cast.afterSubmitMs
        + "ms，待完成 " + cast.encoderPendingFrames + " 帧。";
    }
    if (cast.adaptationStatus) capabilityText += " " + cast.adaptationStatus + "。";
  }
  document.getElementById("castCapabilityHint").textContent = capabilityText;
}

function formatCastBitrate(bitsPerSecond) {
  return bitsPerSecond >= 1000000
    ? (bitsPerSecond / 1000000).toFixed(1) + " Mbps"
    : Math.round(bitsPerSecond / 1000) + " kbps";
}

function saveWebCastSettings() {
  var payload = {
    webCastResolution: document.getElementById("castResolution").value,
    webCastFps: Number(document.getElementById("castFps").value),
    webCastCodec: document.getElementById("castCodec").value,
    webCastTransport: document.getElementById("castTransport").value,
    webCastBitrateMbps: Number(document.getElementById("castBitrate").value),
    webCastAudio: document.getElementById("castAudio").checked
  };
  api("/api/settings", payload, function (error) {
    if (error) {
      toast(error.message, true);
      refresh();
      return;
    }
    if (state && state.settings) {
      for (var key in payload) if (payload.hasOwnProperty(key)) state.settings[key] = payload[key];
    }
    toast("投屏参数已保存，下次投屏生效");
  });
}
function saveCastDebugSetting() {
  var toggle = document.getElementById("castDebug"), enabled = toggle.checked;
  toggle.disabled = true;
  api("/api/settings", { webCastDebug: enabled }, function (error) {
    toggle.disabled = false;
    if (error) { toast(error.message, true); refresh(); return; }
    if (state && state.settings) state.settings.webCastDebug = enabled;
    toast(enabled ? "投屏调试信息已显示" : "投屏调试信息已隐藏");
  });
}
var superResolutionRequestPending = false, superResolutionCompareTimer = null;
function saveSuperResolutionSetting() {
  var toggle = document.getElementById("castSuperResolution"), enabled = toggle.checked;
  superResolutionRequestPending = true;
  toggle.disabled = true;
  document.getElementById("compareSuperResolution").disabled = true;
  api("/api/settings", { webCastSuperResolution: enabled }, function (error) {
    superResolutionRequestPending = false;
    toggle.disabled = false;
    if (error) toast(error.message, true);
    else {
      if (state && state.settings) state.settings.webCastSuperResolution = enabled;
      toast(enabled ? "超分已开启" : "超分已关闭");
    }
    refresh();
  });
}
function compareSuperResolution() {
  var button = document.getElementById("compareSuperResolution");
  if (superResolutionRequestPending || button.disabled) return;
  superResolutionRequestPending = true;
  button.disabled = true;
  api("/api/control", { action: "compareSuperResolution" }, function (error) {
    superResolutionRequestPending = false;
    if (error) toast(error.message, true);
    else toast("原画对比 2 秒，随后自动恢复超分");
    refresh();
  });
}
function startSystemCast() {
  var stopping = !!(state && state.cast && state.cast.screenMirrorActive);
  systemCastRequestDeadline = Date.now() + (stopping ? 10000 : 120000);
  api("/api/control", { action: stopping ? "stopSystemCast" : "startSystemCast" }, function (error) {
    if (error) {
      systemCastRequestDeadline = 0;
      toast(error.message, true);
    }
    else toast(stopping ? "已结束系统投屏" : "请按手机提示选择设备或允许屏幕共享");
    refresh();
  });
}
function saveWifiDirectSetting() {
  var toggle = document.getElementById("wifiDirectExperimental");
  var enabled = toggle.checked;
  toggle.disabled = true;
  api("/api/settings", { wifiDirectExperimental: enabled }, function (error) {
    if (error) toast(error.message, true);
    else toast(enabled ? "已开启实验性直连，下次投屏尝试使用" : "已关闭直连，使用路由器 IP");
    refresh();
  });
}
function renderPageState() {
  renderCastState();
}
startPage();
