const { mergeDeepRight } = require('ramda')
const util = require('util')
const { Component } = require('@serverless/core')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const CamClient = tencentcloud.cam.v20190116.Client
const camModels = tencentcloud.cam.v20190116.Models
const ClientProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/client_profile.js')
const HttpProfile = require('tencentcloud-sdk-nodejs/tencentcloud/common/profile/http_profile.js')

class TencentCamPolicy extends Component {
  getCamClient(credentials, region) {
    // create cam client

    const secret_id = credentials.SecretId
    const secret_key = credentials.SecretKey
    const cred = new tencentcloud.common.Credential(secret_id, secret_key)
    const httpProfile = new HttpProfile()
    httpProfile.reqTimeout = 30
    const clientProfile = new ClientProfile('HmacSHA256', httpProfile)
    return new CamClient(cred, region, clientProfile)
  }

  async default(inputs = {}) {
    this.context.status(`Deploying`)

    // Defaults
    const defaults = {}
    defaults.region = 'ap-guangzhou'
    defaults.policy = {
      version: '2.0',
      statement: [
        {
          action: ['cos:GetService'],
          resource: '*',
          effect: 'allow'
        }
      ]
    }

    defaults.name = this.state.name || this.context.resourceId()
    defaults.description = 'A policy created by Serverless Components'
    defaults.path = null

    inputs = mergeDeepRight(defaults, inputs)

    // Ensure Document is a string
    inputs.policy =
      typeof inputs.policy === 'string' ? inputs.policy : JSON.stringify(inputs.policy)

    const cam = this.getCamClient(this.context.credentials.tencent, inputs.region)

    const params = {
      PolicyName: inputs.name,
      PolicyDocument: inputs.policy,
      Description: inputs.description
    }

    let result
    const req = new camModels.CreatePolicyRequest()
    req.from_json_string(JSON.stringify(params))
    const handler = util.promisify(cam.CreatePolicy.bind(cam))
    try {
      result = await handler(req)
    } catch (error) {
      throw error
    }

    // Save state and set outputs
    const outputs = {}
    this.state.id = outputs.id = result.PolicyId
    await this.save()

    // this.cli.outputs(outputs)
    // console.log(outputs)
    return outputs
  }

  /**
   * Remove
   * @param  {Object}  [inputs={}]
   * @return {Promise}
   */

  async remove(inputs = {}) {
    if (!this.state.id) {
      return {}
    }

    const cam = this.getCamClient(this.context.credentials.tencent, inputs.region)

    const params = {
      PolicyId: [this.state.id]
    }

    const req = new camModels.DeletePolicyRequest()
    req.from_json_string(JSON.stringify(params))
    const handler = util.promisify(cam.DeletePolicy.bind(cam))
    try {
      await handler(req)
    } catch (error) {
      throw error
    }

    // Clear state
    this.state = {}
    await this.save()

    return {}
  }
}

module.exports = TencentCamPolicy
