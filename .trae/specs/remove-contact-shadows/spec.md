# Remove Contact Shadows Spec

## Why
目前场景底部大面积的 `ContactShadows` 会产生类似噪点和锯齿的黑色失真区块（如用户提供的截图所示），极大地破坏了地面的整洁感和高级感，需要将其移除或优化以保证地面渲染干净。

## What Changes
- 移除或禁用 `src/App.tsx` 中使用的 `<ContactShadows>` 组件。
- 确保地面 (`Floor.tsx`) 能够正常接收并显示由 `<directionalLight>` 投射出的标准动态阴影（Cast/Receive Shadow）。

## Impact
- Affected specs: 场景的全局阴影渲染表现
- Affected code: `src/App.tsx`

## REMOVED Requirements
### Requirement: Contact Shadows
**Reason**: ContactShadows 在大面积半透明或复杂几何体场景下，由于分辨率和计算精度问题，导致了严重的锯齿状阴影和黑色色块失真。
**Migration**: 依赖标准的 DirectionalLight 阴影贴图（Shadow Map）来提供更干净、自然的实体投影。
