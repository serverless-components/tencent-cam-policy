const { mergeDeepRight } = require('ramda')
const util = require('util')
const { utils } = require('@serverless/core')
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
    const defaults = {
      name: this.state.name || this.context.resourceId(),
      description: '',
      region: 'ap-guangzhou',
      path: null,
      policy: {
        version: '2.0',
        statement: [
          {
            action: [],
            resource: '*',
            effect: 'allow'
          }
        ]
      }
    }

    inputs = mergeDeepRight(defaults, inputs)

    // Ensure Document is a string
    inputs.policy =
      typeof inputs.policy === 'string' ? inputs.policy : JSON.stringify(inputs.policy)

    const cam = this.getCamClient(this.context.credentials.tencent, inputs.region)
    cam.sdkVersion = 'ServerlessComponent'

    const params = {
      PolicyName: inputs.name,
      PolicyDocument: inputs.policy,
      Description: inputs.description
    }

    let result
    let handler
    if (this.state && this.state.id) {
      params.PolicyId = this.state.id
      const updateReq = new camModels.UpdatePolicyRequest()
      updateReq.from_json_string(JSON.stringify(params))
      handler = util.promisify(cam.UpdatePolicy.bind(cam))
      try {
        await handler(updateReq)
      } catch (e) {
        throw 'UpdatePolicyError: ' + e
      }
    } else {
      const createReq = new camModels.CreatePolicyRequest()
      createReq.from_json_string(JSON.stringify(params))
      handler = util.promisify(cam.CreatePolicy.bind(cam))
      try {
        result = await handler(createReq)
      } catch (error) {
        if (error.code && error.code == 'FailedOperation.PolicyNameInUse') {
          const req = new camModels.ListPoliciesRequest()
          let body
          let page = 1
          let pagePolicList
          let pagePolicyCount = 1

          // cam could not get policyId through policyName, has not this type api
          // so use ListPolicies api to get  policy list
          while (pagePolicyCount > 0) {
            await utils.sleep(500) // Prevent overclocking
            body = {
              Rp: 200,
              Page: page
            }
            req.from_json_string(JSON.stringify(body))
            handler = util.promisify(cam.ListPolicies.bind(cam))
            try {
              pagePolicList = await handler(req)
              pagePolicyCount = pagePolicList.List.length
              for (let j = 0; j < pagePolicList.List.length; j++) {
                if (pagePolicList.List[j].PolicyName == params.PolicyName) {
                  params.PolicyId = pagePolicList.List[j].PolicyId
                  break // Policyid found, break loop
                }
              }
              if (params.PolicyId) {
                break // Policyid found, break loop
              }
            } catch (e) {
              throw 'GetPolicyIdError: ' + e
            }
            page = page + 1
          }

          const updateReq = new camModels.UpdatePolicyRequest()
          updateReq.from_json_string(JSON.stringify(params))
          handler = util.promisify(cam.UpdatePolicy.bind(cam))
          try {
            await handler(updateReq)
          } catch (e) {
            throw 'UpdatePolicyError: ' + e
          }
        } else {
          throw error
        }
      }
    }

    // Save state and set outputs
    const outputs = {}
    const policyId = result && result.PolicyId ? result.PolicyId : params.PolicyId
    this.state.id = outputs.id = policyId
    await this.save()

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
    cam.sdkVersion = 'ServerlessComponent'

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
