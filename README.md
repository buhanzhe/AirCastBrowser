# 空投浏览器 · AirCastBrowser

面向 Android 手机、平板、电视和盒子的浏览器，支持多标签网页、媒体播放、AirPlay / Miracast 投屏与局域网网页管理。支持 Android 5.0 及以上。

## 下载与更新

从 [GitHub Releases](https://github.com/buhanzhe/AirCastBrowser/releases/latest) 下载对应安装包：

- `AirCastBrowser32.apk`：ARM 32 位。
- `AirCastBrowser64.apk`：ARM 64 位。
- `AirCastBrowserx86.apk`：x86 设备或模拟器。

应用不在启动时检查或强制更新。进入网页管理的“系统信息”查看新版本，确认后下载并调用系统安装器。覆盖安装可保留设置。

## 网页管理

手机和设备连接同一局域网，打开应用显示的管理地址或二维码。默认管理端口为 `9955`；被占用时自动尝试后续端口，以设备实际显示为准。管理页面、飞鼠和录屏网页资源统一维护于本仓库。

## 本地打包（Windows）

配置 `local.properties` 中的 Android SDK，并准备 `.signing/aircast-release.jks` 和 `.signing/aircast-keystore-info.properties`，运行 `build-release.bat`。

`output` 目录包含三个 APK 和唯一的更新配置 `version-lite.json`；更新配置包含版本号、各架构下载地址及 SHA-256。发布到本仓库的同一个 Release 即可。

签名文件与混淆映射仅保存在本地。

[English](README.en.md)
