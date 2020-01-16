# 腾讯云访问管理CAM-policy组件

&nbsp;

* [请点击这里查看英文版部署文档](./README_EN.md)

## 简介
该组件是serverless-tencent组件库中的基础组件之一。通过访问管理CAM-policy组件，可以快速，方便的创建，配置和管理腾讯云的CAM策略

## 快速开始

通过CAM-policy组件，对一个CAM的策略进行完整的创建，配置，部署和删除等操作。支持命令如下：

1. [安装](#1-安装)
2. [创建](#2-创建)
3. [配置](#3-配置)
4. [部署](#4-部署)
5. [移除](#5-移除)

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

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API密钥管理
](https://console.cloud.tencent.com/cam/capi)中获取`APPID`, `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 3. 配置

在serverless.yml中进行如下配置

```yml
# serverless.yml

myPolicy:
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
* [点击此处查看配置文档](https://github.com/serverless-tencent/tencent-cam-policy/blob/master/docs/configure.md)


### 4. 部署

通过如下命令进行部署，并查看部署过程中的信息
```console
$ sls --debug

  DEBUG ─ Resolving the template's static variables.
  DEBUG ─ Collecting components from the template.
  DEBUG ─ Downloading any NPM components found in the template.
  DEBUG ─ Analyzing the template's components dependencies.
  DEBUG ─ Creating the template's components graph.
  DEBUG ─ Syncing template state.
  DEBUG ─ Executing the template's components graph.

  myPolicy: 
    id: 27710257

  7s › myPolicy › done
```


### 5. 移除
```console
$ sls remove --debug

  DEBUG ─ Flushing template state and removing all components.

  1s › myPolicy › done


```

### 还支持哪些组件？

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。
