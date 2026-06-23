
# Ditto (Music Vibe) - Design System & UI Guidelines

本文件確立了 Ditto 專案的前端介面風格與設計語言。所有後續的 React/Next.js 元件與 CSS 樣式皆須嚴格遵循此規範，以確保全站風格統一。

## 1. 核心美學 (Core Aesthetic)
- **風格標籤**：Z 世代 (Gen-Z)、極簡主義 (Minimalist)、時尚高冷 (High Fashion)、類粗獷主義 (Brutalism-inspired)。
- **核心理念**：捨棄多餘的漸層、霓虹與發光特效。讓音樂與使用者本身的質感透過「留白 (Negative Space)」、「強烈對比」與「銳利排版」來呈現。

## 2. 色彩計畫 (Color Palette)
系統採用極致的黑白灰階單色系 (Monochrome)：
- **Background (背景)**: `#050505` (純黑中帶極微弱的灰，深邃而不死黑)
- **Card Background (卡片底色)**: `rgba(255, 255, 255, 0.03)` (極低透明度的白，搭配 Blur 營造清透感)
- **Primary Text (主文字)**: `#ffffff` (純白，用於標題與重要資訊)
- **Secondary Text (副文字)**: `#888888` (中性灰，用於副標題、時間進度、小標籤)
- **Borders (邊框)**: `rgba(255, 255, 255, 0.06)` (若隱若現的微弱邊線)

## 3. 字體排印 (Typography)
- **主要字體**：Google Fonts `Inter` (無襯線，俐落且充滿科技感)。
- **排版策略**：採用極端的粗細對比。
  - 使用者名稱或大標題使用 Extra Bold (`800`) 或 Bold (`700`)，並稍微縮減字距 (`letter-spacing: -0.5px`) 提升時尚感。
  - 輔助說明使用 Regular (`400`) 或 Medium (`500`)，字距適中。

## 4. 質感與特效 (Textures & Effects)
- **底片雜訊 (Noise Texture)**：在純黑背景上疊加一層極其細微的 SVG Noise，破除數位平滑感，增添 Y2K 復古與真實底片的粗糙質感。
- **高反差互動 (Invert Hover Effect)**：按鈕或互動元件預設為線條 (Outline) 與透明底，當使用者懸停 (Hover) 或按下時，瞬間反白（背景填滿純白，圖示/文字轉為純黑），創造乾淨卻強烈的回饋感。
- **玻璃擬態 (Frosted Glass)**：保留微量的 `backdrop-filter: blur(25px)`，但捨棄霓虹光暈，讓卡片邊緣保持銳利。

## 5. 核心 UI 元件規範 (Component Specifications)
- **配對卡片 (Cards)**：具備較大的圓角 (例如 `border-radius: 32px`)，呈現現代 App 趨勢。懸停時有流暢的放大與上浮位移。
- **照片處理 (Images)**：若無特殊需求，封面圖片可加上微量的去色濾鏡 (`grayscale(20%) contrast(110%)`) 來對齊整體的高冷調性。
- **進度條 (Progress Bars)**：捨棄粗重的漸層條，改用極細的 3px 線條，未播放部分為低透明度白，已播放部分為實心白。
- **圖示按鈕 (Icon Buttons)**：使用線條簡潔的 SVG Icon，不加多餘的裝飾性陰影。

---
*註：後續開發時，請將上述 CSS 變數 (`--bg-color`, `--text-primary` 等) 實作於 `globals.css` 中，讓所有組件共用。*
