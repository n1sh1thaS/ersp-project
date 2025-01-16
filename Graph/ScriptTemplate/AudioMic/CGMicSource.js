/**
 * @file CGAudioMic.js
 * @author
 * @date 2022/5/30
 * @brief CGAudioMic.js
 * @copyright Copyright (c) 2022, ByteDance Inc, All Rights Reserved
 */

const APJS = require('./amazingpro');
const {BaseNode} = require('./BaseNode');

class CGMicSource extends BaseNode {
  constructor() {
    super();
    this.audioNode = null;
    this.audioNodeName = 'MicSourceNode';
  }

  getOutput(index) {
    return this.audioNode;
  }

  onStart(sys) {
    if (this.audioNode) {
      this.audioNode.start();
    }
  }

  initAudio() {
    if (this.audioGraph && this.audioNode === null) {
      this.audioNode = this.audioGraph.createAudioNode(this.audioNodeName, null);
    }
  }
}

exports.CGMicSource = CGMicSource;
