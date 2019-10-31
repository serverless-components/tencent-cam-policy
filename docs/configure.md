# Configure document

## Complete configuration

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

## Configuration description

Main param description

| Param        | Required/Optional    |  Description |
| --------     | :-----:              |  :----      |
| name       | Required             | Policy name  |
| description | Optional        | Policy description |
| [policy](#policy-param-description) | Required | Policy configure |


### policy param description

| Param        | Required/Optional    |  Description |
| --------     | :-----:              |  :----      |
| statement      | Required           | Describes details of one or multiple policies. The element includes permission or permission set for other elements such as action, resource, condition, effect. One policy can only have one statement element. |


* statement param description

| Param        |   Description |
| --------     |   :----      |
| effect    |   Describes whether the result produced by the declaration is "Allow" or "Explicitly Deny". This includes two situations: allow, deny. This element is mandatory. |
| action    |  Describes allowed or disallowed actions. An action can be an API (described using the prefix "name") or a feature set (a set of specific APIs, described using the prefix "permid"). This element is mandatory. |
| resource    |   Describes the detailed data of authorization. Resource is described using 6-piece format. Detailed resource definition for each product is different. For information on how to specify resource information, please see the corresponding product documentation of the resource declaration you wrote. This element is mandatory. |
