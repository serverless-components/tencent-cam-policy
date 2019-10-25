# 腾讯云访问管理CAM-policy组件

## 简介
该组件是serverless-tencent组件库中的基础组件之一。通过访问管理CAM-policy组件，可以快速，方便的创建，配置和管理腾讯云的CAM策略

## 快速开始

通过CAM-policy组件，对一个CAM的策略进行完整的创建，配置，部署和删除等操作。支持命令如下：

1. [安装](#1-安装)
2. [创建](#2-创建)
3. [配置](#3-配置)
4. [部署](#4-部署)

### 1. 安装

通过npm安装serverless

```console
$ npm install -g serverless
```

### 2. 创建

本地创建 `serverless.yml` 和 `.env` 两个文件

```console
$ touch serverless.yml
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的APPID，SecretId和SecretKey信息并保存

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
TENCENT_APP_ID=123
```

### 3. 配置

在serverless.yml中进行如下配置

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

### 4. 部署

通过如下命令进行部署，并查看部署过程中的信息
```console
$ serverless --debug
```


### 测试案例
```text
DFOUNDERLIU-MB0:tencent-cos-component-master dfounderliu$ sls

  id: 27280629

  0s › TencentCamPolicy › done

DFOUNDERLIU-MB0:tencent-cos-component-master dfounderliu$ sls remove

```

### 还支持哪些组件？

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。
