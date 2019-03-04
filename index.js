/* Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file
 except in compliance with the License. A copy of the License is located at
     http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations under the License.
*/

var https = require("https");
var jose = require("node-jose");

const { USER_POOL, region, AppClient } = process.env;

var keysUrl =
  "https://cognito-idp." +
  region +
  ".amazonaws.com/" +
  USER_POOL +
  "/.well-known/jwks.json";
const https$ = (token, kid) =>
  new Promise((resolve, reject) =>
    https.get(keysUrl, response => {
      if (response.statusCode == 200) {
        response.on("data", function(body) {
          var keys = JSON.parse(body)["keys"];
          // search for the kid in the downloaded public keys
          var keyIndex = -1;
          for (var i = 0; i < keys.length; i++) {
            if (kid == keys[i].kid) {
              keyIndex = i;
              break;
            }
          }
          if (keyIndex == -1) {
            console.log("Public key not found in jwks.json");
            reject("Public key not found in jwks.json");
          }
          // construct the public key
          jose.JWK.asKey(keys[keyIndex]).then(function(result) {
            // verify the signature
            jose.JWS.createVerify(result)
              .verify(token)
              .then(function(result) {
                // now we can use the claims
                var claims = JSON.parse(result.payload);
                // additionally we can verify the token expiration
                let currentTs = Math.floor(new Date() / 1000);
                if (currentTs > claims.exp) {
                  reject("Token is expired");
                }
                // and the Audience (use claims.client_id if verifying an access token)
                if (claims.aud != AppClient) {
                  reject("Token was not issued for this audience");
                }
                resolve(claims);
              })
              .catch(function() {
                reject("Signature verification failed");
              });
          });
        });
      }
    })
  );

const verifyToken = async token => {
  var sections = token.split(".");
  // get the kid from the headers prior to verification
  var header = jose.util.base64url.decode(sections[0]);
  header = JSON.parse(header);
  var kid = header.kid;
  // download the public keys
  const response = await https$(token, kid);
  return response;
};

module.exports = {
  verifyToken,
  printMsg: function() {
    console.log("Cogniot helper token is imported ");
  }
};
