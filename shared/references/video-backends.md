# 视频后端配置

图像模型的默认值写死在 `lib/tasks.json` 里，视频模型没有——**因为各家的视频模型
ID 差异大、更新快，写死只会误导**。所以视频技能要求你显式指定。

## 指定模型

```bash
export DLAZY_VIDEO_MODEL=<你账号里可用的视频模型 ID>
# 或每次调用时
node scripts/video.mjs --mode clip --task main-image-video --model <id> ...
```

没设会直接报错，不会拿一个猜的模型名去跑。

## 各后端

| 后端 | 怎么配 | 说明 |
| --- | --- | --- |
| `dlazy` | `DLAZY_VIDEO_MODEL` | 用 `dlazy --help` 看当前账号可用的视频工具 |
| `fal` | `FAL_KEY` + `GEN_MODEL_FAL=<视频模型路径>` | 产出在 `videos[]` 或 `video.url` |
| `replicate` | `REPLICATE_API_TOKEN` + `GEN_MODEL_REPLICATE=<owner/model>` | 产出为 URL |

图生视频时参考图走 `--images`，与图像技能一致。

## 合成依赖

拼接与字幕需要 ffmpeg：

```bash
brew install ffmpeg        # macOS
apt install ffmpeg         # Debian/Ubuntu
```

没装也能跑——片段照常生成，脚本会输出 `concat.txt`，装好后一条命令补拼。

## 字幕的三级降级

1. **烧录进画面**：需要 ffmpeg 带 libass。很多发行版的预编译包没有。
2. **软字幕轨**：`-c:s mov_text` 封进 MP4，播放器可开关。几乎总能成。
3. **都不行**：`.srt` 留在产物目录旁边，可导入剪辑软件。

脚本自动逐级尝试，不用你判断。查本机是否支持烧录：

```bash
ffmpeg -hide_banner -filters | grep ' subtitles '
```

## 分镜文件

```json
{
  "shots": [
    { "id": "s1", "seconds": 3, "image": "main.jpg",
      "prompt": "Slow push-in on the product, soft light sweeps across the surface.",
      "caption": "三层加厚，零下也不怕" }
  ]
}
```

`caption` 会按 `seconds` 累加时间轴自动生成 SRT，不用手对时间码。
