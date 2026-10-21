// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// TICK TOCK'S PAGE PARTS, MOUNTED (kanban #564): window.ArenaNextBlock.draw(element, kind, props) - kind 'next', 'warn', 'gfx', 'bench',
// 'securing' or 'lines' - one root per element, drawn again with each change. Built by tools/build-page-view.mjs into page/parts-page.js
// against the Arena page's own React (window.ArenaReact, from arena-react.js, loaded before it): the page carries React once.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NextRoundBox, LinkWarn, GraphicsChoice, BenchCard, Securing, Lines } from './NextBlockParts.jsx';

const VIEWS = { next: NextRoundBox, warn: LinkWarn, gfx: GraphicsChoice, bench: BenchCard, securing: Securing, lines: Lines };
export function draw(element, kind, props) {
  if (!element._nbRoot) element._nbRoot = createRoot(element);
  element._nbRoot.render(React.createElement(VIEWS[kind], props));
}
if (typeof window !== 'undefined') window.ArenaNextBlock = { draw };
