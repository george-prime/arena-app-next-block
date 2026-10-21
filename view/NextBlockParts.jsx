// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// TICK TOCK'S PARTS OF THE ARENA PAGE IN REACT (kanban #564, Daniel 2026-10-21: "and also next block"): what page/unity-page.js put into
// the page as markup and wrote into by hand - the next round's box beside the result, the bar that says a run is not reaching the signer
// nodes, the graphics choice in Settings and its benchmark card, the benchmark's lines under the frame rate, "securing your run", and the
// players line in the console. unity-page.js keeps the bridge to Unity and its timing, and hands these plain view data; the ids stay,
// for unity-page.css, the page's overlay switch and ARENA_NEXT_BOX_TOP.
import React from 'react';

/** The next round's box: { show, line, exit, addons, onAddons, onDonate, onExit } - "joining next round in N s" beside exit game. */
export class NextRoundBox extends React.Component {
  render() {
    const { show, line, exit, addons, onAddons, onDonate, onExit } = this.props;
    return (
      <div id="arena-next" role="status" style={{ display: show ? 'flex' : 'none' }}>
        <span id="arena-next-say">{line}</span>
        <button id="arena-next-addons" type="button" style={{ display: addons ? '' : 'none' }} onClick={onAddons}>Buy add-ons</button>
        <button id="arena-next-donate" type="button" onClick={onDonate}>♥ Donate</button>
        <button id="arena-next-exit" type="button" onClick={onExit}>{exit || 'exit game'}</button>
      </div>);
  }
}

const WARN = { display: 'none', position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, maxWidth: 'min(92vw,720px)',
  padding: '8px 14px', borderRadius: 8, background: '#b3261e', color: '#fff', font: '600 14px/1.35 system-ui,sans-serif', textAlign: 'center',
  pointerEvents: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.4)' };
/** The run's link to the signer nodes, said while it is driven: { say } - hidden while there is nothing to say. */
export const LinkWarn = ({ say }) => <div id="arena-link-warn" role="alert" style={{ ...WARN, display: say ? '' : 'none' }}>{say}</div>;

/** Settings' graphics line: { mode: 'auto' | 'high' | 'low', now, onChange(mode) } - the choice, and what this device runs now. */
export class GraphicsChoice extends React.Component {
  render() {
    const { mode, now, onChange } = this.props;
    return (
      <>
        <select id="arena-gfx-select" aria-label="Graphics" value={mode} onChange={(e) => onChange(e.target.value)}>
          <option value="auto">Auto (by device)</option><option value="high">High</option><option value="low">Low</option>
        </select>
        <div className="muted" id="arena-gfx-now">{now}</div>
      </>);
  }
}

/** Settings' benchmark card: { on, onToggle(on), onRun } - off by default; Run only while it is on. */
export class BenchCard extends React.Component {
  render() {
    const { on, onToggle, onRun } = this.props;
    return (
      <section className="settings-card" id="arena-set-bench">
        <h3>Benchmark</h3>
        <label className="muted"><input type="checkbox" id="arena-bench-on" checked={!!on} onChange={(e) => onToggle(e.target.checked)} /> On - off by default</label>
        <div className="muted">Spectates the round and measures this device's frame rate with each graphics cost switched off in turn; the result shows under the FPS line. While it is on, a tap on the FPS line runs it too.</div>
        <button id="arena-bench-go" type="button" disabled={!on} onClick={onRun}>Run the benchmark</button>
      </section>);
  }
}

const SECURING = { position: 'fixed', left: '50%', bottom: 14, transform: 'translateX(-50%)', zIndex: 60, padding: '8px 14px', borderRadius: 8,
  background: 'rgba(10,14,20,.92)', font: '600 14px system-ui', maxWidth: '92vw', textAlign: 'center' };
const TONE = { wait: '#ffd27a', safe: '#7ee08a', bad: '#ff8a7a' };
/** "Securing your run" after a delivered run: { say, tone: 'wait' | 'safe' | 'bad', hidden } - hidden with nothing to say, or when told. */
export const Securing = ({ say, tone = 'wait', hidden = false }) => (
  <div id="arena-securing" style={{ ...SECURING, color: TONE[tone] || TONE.wait, display: say && !hidden ? '' : 'none' }}>{say}</div>);

/** Lines of words where the page keeps them (the benchmark's lines, the console's players line): { text } - its own CSS breaks the lines. */
export const Lines = ({ text }) => text || null;
