/**
 * @file CGAudioExtractorOut.js
 * @author
 * @date 2021/12/30
 * @brief CGAudioExtractorOut.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const APJS = require('../../../amazingpro');
const {BaseNode} = require('../Utils/BaseNode');

class CGAudioExtractorOut extends BaseNode {
  constructor() {
    super();
    this.audioNode = null;
    this.audioNodeName = 'SinkNode';
    this.audioGraph = null;
    this.onlineMusicSpeaker = false;
    this.hasMicphone = false;
  }

  setInput(index, func) {
    this.inputs[index] = func;
  }

  initAudio(sys) {
    if (this.audioGraph) {
      const audioGainNode = sys.audioAssembler.getAudioGraph().createAudioNode('GainNode', null);
      audioGainNode.gain = 0;
      this.audioNode = audioGainNode;
      if (this.hasMicphone) {
        const micOutputNode = sys.audioAssembler.getAudioOutputForMic().outputNode;
        this.audioNode.connect(micOutputNode);
      } else if (this.onlineMusicSpeaker) {
        const musicOutputNode = sys.audioAssembler.getAudioOutputForMusic().outputNode;
        this.audioNode.connect(musicOutputNode);
      } else {
        const musicOutputNode = sys.audioAssembler.getAudioOutputForMp3().outputNode;
        this.audioNode.connect(musicOutputNode);
      }
    }
  }
}

exports.CGAudioExtractorOut = CGAudioExtractorOut;
