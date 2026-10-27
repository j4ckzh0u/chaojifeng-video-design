# 音乐驱动三维世界

project.json 保存音乐、主题、风格和规格。music-analysis.json 保存候选起音和逐帧能量，score.json 是本片有效事件表，public/job.json 由校验工具生成。

先实际核听并完善 score.json，按主题修改 src/index.tsx 或 blender/render.py 中的对象和关系。基础几何用于起步，不代表已经解释任意主题。theme_adaptation 和 listening 仅在实际完成对应工作后更新。

两条路线共享源音轨身份、片段、帧率和事件。Three.js 路线可直接用 Remotion 导出；Blender 路线先生成 public/frames，再由同一 Remotion 工程合成音频与字幕。

```sh
# 优先复用现有兼容 node_modules；确实缺依赖时才安装
npm install
npm run studio
npm run render

# Blender 路线，先改主题与配置，再串行渲染所需范围
blender -b --python-exit-code 1 --python blender/render.py
npm run render
```

先用 --frames 0:90 检查前三秒；完整合成前生成整片全部帧。只改字幕或后期可复用画面帧；改音乐窗口、帧率或对象动作后，重新生成受影响数据和画面。不要保留旧的同步通过状态。依赖版本来自本库实际验证环境，其他宿主先核本地版本。
