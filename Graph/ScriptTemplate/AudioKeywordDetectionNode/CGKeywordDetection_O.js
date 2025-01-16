/**
 * @file CGKeywordDetection_O.js
 * @author
 * @date 2024/8/1
 * @brief CGKeywordDetection.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const APJS = require('./amazingpro');
const {BaseNode} = require('./BaseNode');

class CGKeywordDetection_O extends BaseNode {
  constructor() {
    super();
    this.audioNode = null;
    this.audioNodeName = 'kws_chn_hanzi';
    this.audioGraph = null;
    this.keywords = undefined;
  }

  setInput(index, func) {
    this.inputs[index] = func;
  }

  getOutput(index) {
    if (index === 2) {
      return this.audioNode;
    } else {
      return this.outputs[index];
    }
  }

  onUpdate(sys, dt) {
    this.updateParamsValue();
    const enable = this.inputs[1]();
    if (this.audioNode && enable) {
      const result = this.audioNode.getResult();
      if (result) {
        const featureList = result.featureList;
        if (!featureList.empty()) {
          const feature = featureList.popBack();
          this.parseResult(feature.values);
        } else {
          if (this.nexts[1]) {
            this.nexts[1]();
          }
          this.outputs[3] = '';
        }
      }
    }
  }

  parseResult(values) {
    let detected_words = [];
    if (this.inputs[3]) {
      const keywords = this.inputs[3]();
      if (!(keywords instanceof Array)) {
        return;
      }
      for (let i = 0; i < keywords.length; i++) {
        if (values.get(i) === 1) {
          detected_words.push(keywords[i]);
          if (this.nexts[0]) {
            this.nexts[0]();
          }
        }
      }
    }

    if (detected_words.length === 0) {
      if (this.nexts[1]) {
        this.nexts[1]();
      }
    }
    const result = detected_words.join(',');
    this.outputs[3] = result;
  }

  generateConfig(modelType) {
    if (!this.inputs[3]) {
      return;
    }
    const keywords = this.inputs[3]();
    if (!(keywords instanceof Array)) {
      return;
    }
    const len = keywords.length;
    const detectConfigs = [];
    for (let i = 0; i < len; i++) {
      const keyConfig = '{"threshold":-2.2,"text":"' + keywords[i] + '","lang":"' + modelType + '"}';
      detectConfigs.push(keyConfig);
    }
    let config = '{"version":"1.0","words":[';
    config += detectConfigs.join(',');
    config += ']}';
    return config;
  }

  updateParamsValue() {
    if (!this.audioNode || !this.inputs[3]) {
      return;
    }
    const currentKeywords = this.inputs[3]();
    if (!(currentKeywords instanceof Array)) {
      return;
    }
    let keywords = currentKeywords.join(',');
    if (this.keywords !== keywords) {
      this.keywords = keywords;
      const paraName = 'keywords';
      const modeltype = 'en_US';
      const config = this.generateConfig(modeltype);
      this.audioNode.setStringParameter(paraName, config);
    }
  }

  initAudio() {
    if (this.audioGraph) {
      const extractorMap = new APJS.Map();
      this.audioNodeName = 'kws_eng';
      this.audioNode = this.audioGraph.createAudioExtractorNode(this.audioNodeName, extractorMap);

      this.updateParamsValue();
    }
  }
}

exports.CGKeywordDetection_O = CGKeywordDetection_O;
