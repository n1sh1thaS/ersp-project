/**
 * @file CGExpressionDetection.js
 * @author liujiacheng
 * @date 2021/8/19
 * @brief CGExpressionDetection.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('../Utils/BaseNode');
const APJS = require('../../../amazingpro');

const {BEMessage, BEState} = require('../Utils/BEMessage');
const BEMsg = BEMessage.FaceExpression;
class CGExpressionDetection extends BaseNode {
  constructor() {
    super();
    this.expressionDetected = false;
    this.faceIndexMap = {
      'Face 0': 0,
      'Face 1': 1,
      'Face 2': 2,
      'Face 3': 3,
      'Face 4': 4,
      Any: -1,
    };
    this.expressionMap = {
      Happy: APJS.FaceAttrExpression.Happy,
      Angry: APJS.FaceAttrExpression.Angry,
      Surprise: APJS.FaceAttrExpression.Surprise,
      Disgust: APJS.FaceAttrExpression.Disgust,
      Fear: APJS.FaceAttrExpression.Fear,
      Sad: APJS.FaceAttrExpression.Sad,
      Neutral: APJS.FaceAttrExpression.Neutral,
    };
    this.expressionAction = {
      Happy: BEMsg.action.Happy.id,
      Angry: BEMsg.action.Angry.id,
      Surprise: BEMsg.action.Surprise.id,
      Disgust: BEMsg.action.Disgust.id,
      Fear: BEMsg.action.Fear.id,
      Sad: BEMsg.action.Sad.id,
      Neutral: BEMsg.action.Neutral.id,
    };
    this.lastAction = BEState.None.key;
  }

  onUpdate(sys, dt) {
    const expressionInput = this.inputs[1]();
    const whichFace = this.inputs[0]();

    const algResult = APJS.AlgorithmManager.getResult();

    if (algResult !== null && expressionInput !== null && whichFace !== null) {
      const expression = this.expressionMap[expressionInput];
      const index = this.faceIndexMap[whichFace];

      if (index === undefined || expression === undefined) {
        return;
      }

      let curExpressionDetected = false;
      if (index === -1) {
        for (let i = 0; i < 5; ++i) {
          const face = algResult.getFaceAttributeInfo(i);
          if (face) {
            curExpressionDetected = curExpressionDetected || face.expType === expression;
          }
        }
      } else {
        const face = algResult.getFaceAttributeInfo(index);
        if (face) {
          curExpressionDetected = face.expType === expression;
        }
      }

      if (curExpressionDetected && !this.expressionDetected) {
        if (this.nexts[0]) {
          this.nexts[0]();
        }
        if (sys.APJScene && this.lastAction !== BEState.Begin.key) {
          this.lastAction = BEState.Begin.key;
          sys.APJScene.postMessage(BEMsg.msgId, this.expressionAction[expressionInput], BEState.Begin.id, '');
        }
      }
      if (curExpressionDetected) {
        if (this.nexts[1]) {
          this.nexts[1]();
        }
        if (sys.APJScene && this.lastAction !== BEState.Stay.key) {
          this.lastAction = BEState.Stay.key;
          sys.APJScene.postMessage(BEMsg.msgId, this.expressionAction[expressionInput], BEState.Stay.id, '');
        }
      }
      if (!curExpressionDetected && this.expressionDetected) {
        if (this.nexts[2]) {
          this.nexts[2]();
        }
        if (sys.APJScene && this.lastAction !== BEState.End.key) {
          this.lastAction = BEState.End.key;
          sys.APJScene.postMessage(BEMsg.msgId, this.expressionAction[expressionInput], BEState.End.id, '');
        }
      }
      if (!curExpressionDetected) {
        if (this.nexts[3]) {
          this.nexts[3]();
        }
        if (sys.APJScene && this.lastAction !== BEState.None.key) {
          this.lastAction = BEState.None.key;
          sys.APJScene.postMessage(BEMsg.msgId, this.expressionAction[expressionInput], BEState.None.id, '');
        }
      }

      this.expressionDetected = curExpressionDetected;
    }
  }

  resetOnRecord(sys) {
    this.expressionDetected = false;
    this.lastAction = BEState.None.key;
  }
}

exports.CGExpressionDetection = CGExpressionDetection;
