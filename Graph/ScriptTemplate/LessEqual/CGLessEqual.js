/**
 * @file CGLessEqual.js
 * @author
 * @date 2021/8/15
 * @brief CGLessEqual.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('../Utils/BaseNode');
const APJS = require('../../../amazingpro');

class CGLessEqual extends BaseNode {
  constructor() {
    super();
  }

  getOutput() {
    return this.inputs[0]() <= this.inputs[1]();
  }
}

exports.CGLessEqual = CGLessEqual;
