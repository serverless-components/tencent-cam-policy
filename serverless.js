const { mergeDeepRight } = require('ramda')
const util = require('util')
const fs = require('fs')
const { utils } = require('@serverless/core')
const { Component } = require('@serverless/core')
const TencentLogin = require('tencent-login')
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
    const cred = credentials.token
      ? new tencentcloud.common.Credential(secret_id, secret_key, credentials.token)
      : new tencentcloud.common.Credential(secret_id, secret_key)
    const httpProfile = new HttpProfile()
    httpProfile.reqTimeout = 30
    const clientProfile = new ClientProfile('HmacSHA256', httpProfile)
    return new CamClient(cred, region, clientProfile)
  }

  async doLogin() {
    const login = new TencentLogin()
    const tencent_credentials = await login.login()
    if (tencent_credentials) {
      tencent_credentials.timestamp = Date.now() / 1000
      try {
        const tencent = {
          SecretId: tencent_credentials.secret_id,
          SecretKey: tencent_credentials.secret_key,
          AppId: tencent_credentials.appid,
          token: tencent_credentials.token,
          expired: tencent_credentials.expired,
          signature: tencent_credentials.signature,
          uuid: tencent_credentials.uuid,
          timestamp: tencent_credentials.timestamp
        }
        await fs.writeFileSync('./.env_temp', JSON.stringify(tencent))
        this.context.debug(
          'The temporary key is saved successfully, and the validity period is two hours.'
        )
        return tencent
      } catch (e) {
        throw 'Error getting temporary key: ' + e
      }
    }
  }

  async getTempKey() {
    const that = this
    try {
      const data = await fs.readFileSync('./.env_temp', 'utf8')
      try {
        const tencent = {}
        const tencent_credentials_read = JSON.parse(data)
        if (Date.now() / 1000 - tencent_credentials_read.timestamp <= 6000) {
          return tencent_credentials_read
        }
        const login = new TencentLogin()
        const tencent_credentials_flush = await login.flush(
          tencent_credentials_read.uuid,
          tencent_credentials_read.expired,
          tencent_credentials_read.signature,
          tencent_credentials_read.AppId
        )
        if (tencent_credentials_flush) {
          tencent.SecretId = tencent_credentials_flush.secret_id
          tencent.SecretKey = tencent_credentials_flush.secret_key
          tencent.AppId = tencent_credentials_flush.appid
          tencent.token = tencent_credentials_flush.token
          tencent.expired = tencent_credentials_flush.expired
          tencent.signature = tencent_credentials_flush.signature
          tencent.uuid = tencent_credentials_read.uuid
          tencent.timestamp = Date.now() / 1000
          await fs.writeFileSync('./.env_temp', JSON.stringify(tencent))
          return tencent
        }
        return await that.doLogin()
      } catch (e) {
        return await that.doLogin()
      }
    } catch (e) {
      return await that.doLogin()
    }
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

    let { tencent } = this.context.credentials
    if (!tencent) {
      tencent = await this.getTempKey(tencent)
      this.context.credentials.tencent = tencent
    }

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
