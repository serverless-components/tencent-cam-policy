# Tencent-cam-policy

Easily provision Tencent CAM policy using [Serverless Components](https://github.com/serverless/components).

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;


### 1. Install

```shell
$ npm install -g serverless
```

### 2. Create

Just create a `serverless.yml` file

```shell
$ touch serverless.yml
$ touch .env      # your Tencent api keys
```

If you don't have a Tencent Cloud account, you could [sign up](https://intl.cloud.tencent.com/register) first.  

If you already login in, find  `TENCENT_SECRET_ID` and `TENCENT_SECRET_KEY`  in [Tencent Console](https://console.cloud.tencent.com/cam/capi).

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 3. Configure

```yml
# serverless.yml

name: my-app

myRole:
  component: "@serverless/tencent-cam-policy"
  inputs:
    name: my-policy
    description: A policy created by Serverless Components
    policy:
      statement:
        - effect: allow
          action:
            - cos:GetService
          resource: '*'
```

### 4. Deploy

```shell
$ serverless
```

&nbsp;

### Test
```text
DFOUNDERLIU-MB0:tencent-cos-component-master dfounderliu$ sls

  id: 27280629

  0s › TencentCamPolicy › done

DFOUNDERLIU-MB0:tencent-cos-component-master dfounderliu$ sls remove

```

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
