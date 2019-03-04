# aws-cognito-verify-token
validate cognito token using nodejs 

# Install 

```
npm i aws-cognito-verify-token --save 
yarn add aws-cognito-verify-token

```

and you need also to set (USER_POOL, region, AppClient) in your env varibales.


# Example

You can passed the jwt token generate by coginto in your front application with the function verifyToken , this function will call cognito (!USER_POOL, !region, !AppClient) to verify is this tokent is valide, if the verification is okey this function will output the user informations.

```
const { verifyToken } = require("aws-cognito-verify-token");

exports.handler = async event => {
  const { httpMethod, path, headers } = event;
  let { authorization } = headers;
  let cognitoData = {};
  if (authorization) {
    cognitoData = await verifyToken(authorization);
  }
  console.log('cognitoData',cognitoData);
    
}
```
